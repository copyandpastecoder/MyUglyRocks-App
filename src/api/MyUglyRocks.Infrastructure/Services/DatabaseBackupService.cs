using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Configuration;
using Npgsql;

namespace MyUglyRocks.Infrastructure.Services;

/// <summary>
/// Service for PostgreSQL database backup and restore operations.
/// Uses pg_dump/pg_restore CLI tools and stores backups in R2.
/// Supports optional AES-256-CBC encryption (OpenSSL-compatible format).
/// </summary>
/// <remarks>
/// <para><b>Required Configuration:</b></para>
/// <list type="bullet">
///   <item><description>ConnectionStrings:DefaultConnection - PostgreSQL connection string</description></item>
///   <item><description>R2:BackupBucketName - R2 bucket name for backup storage</description></item>
///   <item><description>R2:AccountId, R2:AccessKeyId, R2:SecretAccessKey - R2 credentials</description></item>
/// </list>
/// <para><b>Optional Configuration:</b></para>
/// <list type="bullet">
///   <item><description>R2:BackupPassword - Password for AES-256 encryption. If empty, backups are stored unencrypted.</description></item>
/// </list>
/// <para><b>CLI Restore Scripts:</b></para>
/// <para>
/// When using CLI scripts (restore.sh/restore.ps1), set these environment variables:
/// </para>
/// <list type="bullet">
///   <item><description>DATABASE_URL - PostgreSQL connection URL (postgresql://user:pass@host:port/db)</description></item>
///   <item><description>BACKUP_PASSWORD - Decryption password (only if backups are encrypted)</description></item>
///   <item><description>R2_BUCKET - Optional: Override default bucket name</description></item>
/// </list>
/// </remarks>
public class DatabaseBackupService : IDatabaseBackupService
{
    private readonly IConfiguration _configuration;
    private readonly IBackupStorageService _backupStorage;
    private readonly ILogger<DatabaseBackupService> _logger;
    private readonly string? _backupPassword;

    // OpenSSL magic header for "Salted__" format
    private static readonly byte[] OpenSslSaltHeader = "Salted__"u8.ToArray();

    // Mutex to prevent concurrent backup/restore operations
    // Prevents: scheduled job + manual backup, or two restores running simultaneously
    private static readonly SemaphoreSlim _operationLock = new(1, 1);
    private static readonly TimeSpan _lockTimeout = TimeSpan.FromMinutes(30);

    // Process timeout for pg_dump/pg_restore operations
    // Prevents hung processes from blocking forever
    private static readonly TimeSpan _processTimeout = TimeSpan.FromMinutes(30);

    // Minimum required disk space for backup (50MB buffer + estimated dump size)
    // For small databases, 100MB is sufficient; adjust for larger databases
    private const long MinimumDiskSpaceBytes = 100 * 1024 * 1024; // 100 MB

    // Minimum backups to always keep, regardless of age
    // This safeguard prevents a bug in retention logic from deleting all backups
    private const int MinDailyBackups = 7;    // Always keep at least 1 week
    private const int MinWeeklyBackups = 4;   // Always keep at least 1 month
    private const int MinMonthlyBackups = 3;  // Always keep at least 1 quarter

    public DatabaseBackupService(
        IConfiguration configuration,
        IBackupStorageService backupStorage,
        IOptions<R2Settings> r2Settings,
        ILogger<DatabaseBackupService> logger)
    {
        _configuration = configuration;
        _backupStorage = backupStorage;
        _logger = logger;
        _backupPassword = string.IsNullOrEmpty(r2Settings.Value.BackupPassword)
            ? null
            : r2Settings.Value.BackupPassword;

        if (_backupPassword != null)
        {
            _logger.LogInformation("Backup encryption enabled (AES-256-CBC)");
        }
        else
        {
            _logger.LogWarning("Backup encryption disabled - backups will be stored unencrypted");
        }
    }

    public async Task<BackupResult> CreateBackupAsync(BackupType backupType, CancellationToken cancellationToken = default)
    {
        // Acquire lock (with timeout to prevent deadlocks)
        if (!await _operationLock.WaitAsync(_lockTimeout, cancellationToken))
        {
            return new BackupResult(false, null, null, TimeSpan.Zero, null,
                "Another backup/restore operation is in progress. Please wait and try again.");
        }

        try
        {
            return await CreateBackupInternalAsync(backupType, cancellationToken);
        }
        finally
        {
            _operationLock.Release();
        }
    }

    private async Task<BackupResult> CreateBackupInternalAsync(BackupType backupType, CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss");

        // Determine folder and filename based on backup type
        var folder = backupType switch
        {
            BackupType.Scheduled => GetScheduledFolder(),
            BackupType.Manual => "manual",
            BackupType.PreRestore => "pre-restore",
            _ => "daily"
        };

        var fileName = backupType == BackupType.PreRestore
            ? $"pre-restore_{timestamp}.dump"
            : $"myuglyrocks_{timestamp}.dump";

        var r2Key = $"{folder}/{fileName}";
        var tempFile = Path.Combine(Path.GetTempPath(), $"backup_{Guid.NewGuid()}.dump");

        try
        {
            // 1. Run pg_dump with custom format (supports compression + pg_restore)
            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not configured");

            var pgDumpResult = await RunPgDumpAsync(connectionString, tempFile, cancellationToken);

            if (!pgDumpResult.Success)
            {
                return new BackupResult(false, null, null, stopwatch.Elapsed, null, pgDumpResult.Error);
            }

            // 2. Encrypt the backup file if password is configured
            var isEncrypted = false;
            if (_backupPassword != null)
            {
                var encryptedFile = tempFile + ".enc";
                await EncryptFileAsync(tempFile, encryptedFile, _backupPassword, cancellationToken);
                File.Delete(tempFile);
                File.Move(encryptedFile, tempFile);
                isEncrypted = true;
                _logger.LogInformation("Backup encrypted with AES-256-CBC");
            }

            // 3. Calculate checksum for integrity verification (of encrypted file if applicable)
            var checksum = await CalculateSha256Async(tempFile, cancellationToken);

            // 4. Upload to R2 (backup bucket) with checksum in metadata
            var fileInfo = new FileInfo(tempFile);
            await using var fileStream = File.OpenRead(tempFile);
            var metadata = new Dictionary<string, string>
            {
                ["x-amz-meta-checksum"] = checksum,
                ["x-amz-meta-backup-type"] = backupType.ToString(),
                ["x-amz-meta-created-at"] = DateTime.UtcNow.ToString("O"),
                ["x-amz-meta-encrypted"] = isEncrypted.ToString().ToLowerInvariant()
            };
            await _backupStorage.UploadAsync(r2Key, fileStream, "application/octet-stream", metadata, cancellationToken);

            _logger.LogInformation(
                "Backup created: {R2Key}, Size: {Size} bytes, Checksum: {Checksum}",
                r2Key, fileInfo.Length, checksum);

            return new BackupResult(true, r2Key, fileInfo.Length, stopwatch.Elapsed, checksum, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Backup failed");
            return new BackupResult(false, null, null, stopwatch.Elapsed, null, ex.Message);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    private string GetScheduledFolder()
    {
        var now = DateTime.UtcNow;

        // Priority order: monthly > weekly > daily
        // If the 1st of the month falls on a Sunday, it goes to monthly/ (not weekly/)
        // This is intentional: monthly retention is indefinite, so we preserve more history
        if (now.Day == 1)
            return "monthly";

        if (now.DayOfWeek == DayOfWeek.Sunday)
            return "weekly";

        return "daily";
    }

    private async Task<(bool Success, string? Error)> RunPgDumpAsync(
        string connectionString,
        string outputPath,
        CancellationToken cancellationToken)
    {
        // Pre-flight check: ensure sufficient disk space
        var tempRoot = Path.GetPathRoot(Path.GetTempPath());
        if (!string.IsNullOrEmpty(tempRoot))
        {
            var tempDrive = new DriveInfo(tempRoot);
            if (tempDrive.AvailableFreeSpace < MinimumDiskSpaceBytes)
            {
                return (false, $"Insufficient disk space. Required: {MinimumDiskSpaceBytes / 1024 / 1024} MB, " +
                    $"Available: {tempDrive.AvailableFreeSpace / 1024 / 1024} MB");
            }
        }

        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        var processInfo = new ProcessStartInfo
        {
            FileName = "pg_dump",
            // -Fc = custom format (compressed, works with pg_restore)
            // -Z5 = compression level 5 (good balance of speed/size)
            // --no-owner --no-acl = don't include ownership (avoids permission issues)
            Arguments = $"-Fc -Z5 --no-owner --no-acl -f \"{outputPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Set PostgreSQL environment variables
        processInfo.Environment["PGHOST"] = builder.Host;
        processInfo.Environment["PGPORT"] = builder.Port.ToString();
        processInfo.Environment["PGDATABASE"] = builder.Database;
        processInfo.Environment["PGUSER"] = builder.Username;
        processInfo.Environment["PGPASSWORD"] = builder.Password;

        if (builder.SslMode != SslMode.Disable)
        {
            processInfo.Environment["PGSSLMODE"] = "require";
        }

        using var process = new Process { StartInfo = processInfo };
        process.Start();

        // Apply timeout to prevent hung processes from blocking forever
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(_processTimeout);

        try
        {
            var stderr = await process.StandardError.ReadToEndAsync(timeoutCts.Token);
            await process.WaitForExitAsync(timeoutCts.Token);

            if (process.ExitCode != 0)
            {
                return (false, $"pg_dump failed with exit code {process.ExitCode}: {stderr}");
            }

            return (true, null);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            // Timeout occurred (not user cancellation)
            try { process.Kill(entireProcessTree: true); } catch { /* ignore */ }
            return (false, $"pg_dump timed out after {_processTimeout.TotalMinutes} minutes");
        }
    }

    public async Task<RestoreResult> RestoreAsync(
        string backupKey,
        bool createPreRestoreBackup = true,
        bool useSingleTransaction = true,
        CancellationToken cancellationToken = default)
    {
        // Acquire lock (with timeout to prevent deadlocks)
        if (!await _operationLock.WaitAsync(_lockTimeout, cancellationToken))
        {
            return new RestoreResult(false, null, TimeSpan.Zero,
                "Another backup/restore operation is in progress. Please wait and try again.");
        }

        try
        {
            return await RestoreInternalAsync(backupKey, createPreRestoreBackup, useSingleTransaction, cancellationToken);
        }
        finally
        {
            _operationLock.Release();
        }
    }

    private async Task<RestoreResult> RestoreInternalAsync(
        string backupKey,
        bool createPreRestoreBackup,
        bool useSingleTransaction,
        CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        string? preRestoreKey = null;

        try
        {
            // 1. Create safety backup before restore (calls internal method directly to avoid deadlock)
            if (createPreRestoreBackup)
            {
                _logger.LogInformation("Creating pre-restore safety backup...");
                var preRestoreResult = await CreateBackupInternalAsync(BackupType.PreRestore, cancellationToken);

                if (!preRestoreResult.Success)
                {
                    return new RestoreResult(false, null, stopwatch.Elapsed,
                        $"Failed to create pre-restore backup: {preRestoreResult.ErrorMessage}");
                }

                preRestoreKey = preRestoreResult.R2Key;
                _logger.LogInformation("Pre-restore backup created: {Key}", preRestoreKey);
            }

            // 2. Get backup metadata (includes stored checksum)
            Dictionary<string, string> metadata;
            try
            {
                metadata = await _backupStorage.GetMetadataAsync(backupKey, cancellationToken);
            }
            catch (FileNotFoundException)
            {
                return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed, $"Backup not found: {backupKey}");
            }

            var storedChecksum = metadata.TryGetValue("x-amz-meta-checksum", out var cs) ? cs : null;
            var isEncrypted = metadata.TryGetValue("x-amz-meta-encrypted", out var enc)
                && string.Equals(enc, "true", StringComparison.OrdinalIgnoreCase);

            // 3. Download backup from R2
            var tempFile = Path.Combine(Path.GetTempPath(), $"restore_{Guid.NewGuid()}.dump");
            try
            {
                await using var downloadStream = await _backupStorage.GetAsync(backupKey, cancellationToken);
                await using var fileStream = File.Create(tempFile);
                await downloadStream.CopyToAsync(fileStream, cancellationToken);
            }
            catch (Exception ex)
            {
                return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed,
                    $"Failed to download backup: {ex.Message}");
            }

            // 4. Verify checksum before decryption (checksum is of encrypted file)
            if (!string.IsNullOrEmpty(storedChecksum))
            {
                var downloadedChecksum = await CalculateSha256Async(tempFile, cancellationToken);
                if (!string.Equals(storedChecksum, downloadedChecksum, StringComparison.OrdinalIgnoreCase))
                {
                    File.Delete(tempFile);
                    return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed,
                        $"Checksum mismatch! Expected: {storedChecksum}, Got: {downloadedChecksum}. " +
                        "The backup file may be corrupted. Restore aborted.");
                }
                _logger.LogInformation("Checksum verified: {Checksum}", downloadedChecksum);
            }
            else
            {
                _logger.LogWarning("No stored checksum found for {BackupKey}, skipping verification", backupKey);
            }

            // 5. Decrypt if encrypted
            if (isEncrypted)
            {
                if (_backupPassword == null)
                {
                    File.Delete(tempFile);
                    return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed,
                        "Backup is encrypted but no backup password is configured. " +
                        "Set the backup-password secret to decrypt this backup.");
                }

                var decryptedFile = tempFile + ".dec";
                try
                {
                    await DecryptFileAsync(tempFile, decryptedFile, _backupPassword, cancellationToken);
                    File.Delete(tempFile);
                    File.Move(decryptedFile, tempFile);
                    _logger.LogInformation("Backup decrypted successfully");
                }
                catch (CryptographicException ex)
                {
                    File.Delete(tempFile);
                    if (File.Exists(decryptedFile)) File.Delete(decryptedFile);
                    return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed,
                        $"Failed to decrypt backup. Wrong password? Error: {ex.Message}");
                }
            }

            // 6. Run pg_restore
            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not configured");

            var restoreResult = await RunPgRestoreAsync(connectionString, tempFile, useSingleTransaction, cancellationToken);

            if (File.Exists(tempFile))
                File.Delete(tempFile);

            if (!restoreResult.Success)
            {
                return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed, restoreResult.Error);
            }

            _logger.LogInformation("Database restored successfully from {BackupKey}", backupKey);

            return new RestoreResult(true, preRestoreKey, stopwatch.Elapsed, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Restore failed");
            return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed, ex.Message);
        }
    }

    private async Task<(bool Success, string? Error)> RunPgRestoreAsync(
        string connectionString,
        string inputPath,
        bool useSingleTransaction,
        CancellationToken cancellationToken)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        var arguments = useSingleTransaction
            ? $"--clean --if-exists --single-transaction --no-owner --no-acl -d \"{builder.Database}\" \"{inputPath}\""
            : $"--clean --if-exists --no-owner --no-acl -d \"{builder.Database}\" \"{inputPath}\"";

        var processInfo = new ProcessStartInfo
        {
            FileName = "pg_restore",
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Set PostgreSQL environment variables
        processInfo.Environment["PGHOST"] = builder.Host;
        processInfo.Environment["PGPORT"] = builder.Port.ToString();
        processInfo.Environment["PGUSER"] = builder.Username;
        processInfo.Environment["PGPASSWORD"] = builder.Password;

        if (builder.SslMode != SslMode.Disable)
        {
            processInfo.Environment["PGSSLMODE"] = "require";
        }

        using var process = new Process { StartInfo = processInfo };
        process.Start();

        // Apply timeout to prevent hung processes from blocking forever
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(_processTimeout);

        try
        {
            var stderr = await process.StandardError.ReadToEndAsync(timeoutCts.Token);
            await process.WaitForExitAsync(timeoutCts.Token);

            // pg_restore returns warnings on stderr even for success
            // Only fail on non-zero exit code
            if (process.ExitCode != 0)
            {
                return (false, $"pg_restore failed with exit code {process.ExitCode}: {stderr}");
            }

            return (true, null);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            // Timeout occurred (not user cancellation)
            try { process.Kill(entireProcessTree: true); } catch { /* ignore */ }
            return (false, $"pg_restore timed out after {_processTimeout.TotalMinutes} minutes");
        }
    }

    public async Task<IEnumerable<BackupInfo>> ListBackupsAsync(int limit = 50, CancellationToken cancellationToken = default)
    {
        var allBackups = new List<BackupInfo>();

        // List all prefixes
        foreach (var prefix in new[] { "daily/", "weekly/", "monthly/", "manual/", "pre-restore/" })
        {
            var objects = await _backupStorage.ListAsync(prefix, cancellationToken);
            foreach (var obj in objects)
            {
                var backupType = prefix.TrimEnd('/') switch
                {
                    "daily" => BackupType.Scheduled,
                    "weekly" => BackupType.Scheduled,
                    "monthly" => BackupType.Scheduled,
                    "manual" => BackupType.Manual,
                    "pre-restore" => BackupType.PreRestore,
                    _ => BackupType.Scheduled
                };

                allBackups.Add(new BackupInfo(
                    obj.Key,
                    Path.GetFileName(obj.Key),
                    obj.LastModified,
                    obj.Size,
                    backupType,
                    null // Checksum not available from LIST operation
                ));
            }
        }

        return allBackups
            .OrderByDescending(b => b.CreatedAt)
            .Take(limit);
    }

    public async Task<BackupInfo?> GetLastBackupAsync(CancellationToken cancellationToken = default)
    {
        var backups = await ListBackupsAsync(1, cancellationToken);
        return backups.FirstOrDefault();
    }

    public async Task ApplyRetentionPolicyAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Delete daily backups older than 30 days, but always keep at least MinDailyBackups
        var dailyCutoff = now.AddDays(-30);
        await DeleteBackupsOlderThanAsync("daily/", dailyCutoff, MinDailyBackups, cancellationToken);

        // Delete weekly backups older than 180 days, but always keep at least MinWeeklyBackups
        var weeklyCutoff = now.AddDays(-180);
        await DeleteBackupsOlderThanAsync("weekly/", weeklyCutoff, MinWeeklyBackups, cancellationToken);

        // Monthly backups: only enforce minimum, no age-based deletion
        // This ensures we always have at least MinMonthlyBackups even if they're very old
        await EnforceMinimumBackupsAsync("monthly/", MinMonthlyBackups, cancellationToken);

        _logger.LogInformation("Retention policy applied");
    }

    private async Task DeleteBackupsOlderThanAsync(
        string prefix,
        DateTime cutoff,
        int minKeep,
        CancellationToken cancellationToken)
    {
        var backups = (await _backupStorage.ListAsync(prefix, cancellationToken))
            .OrderByDescending(b => b.LastModified)
            .ToList();

        // Identify candidates for deletion (older than cutoff)
        var toDelete = backups
            .Where(b => b.LastModified < cutoff)
            .ToList();

        // Ensure we keep at least minKeep backups
        var totalAfterDelete = backups.Count - toDelete.Count;
        if (totalAfterDelete < minKeep)
        {
            // Keep the newest ones from toDelete to meet minimum
            var mustKeep = minKeep - totalAfterDelete;
            toDelete = toDelete
                .OrderByDescending(b => b.LastModified)
                .Skip(mustKeep)
                .ToList();

            _logger.LogInformation(
                "Retention: Keeping {MustKeep} extra backups in {Prefix} to meet minimum of {MinKeep}",
                mustKeep, prefix, minKeep);
        }

        foreach (var backup in toDelete)
        {
            await _backupStorage.DeleteAsync(backup.Key, cancellationToken);
            _logger.LogInformation("Deleted old backup: {Key}", backup.Key);
        }
    }

    private async Task EnforceMinimumBackupsAsync(
        string prefix,
        int minKeep,
        CancellationToken cancellationToken)
    {
        var backups = (await _backupStorage.ListAsync(prefix, cancellationToken))
            .OrderByDescending(b => b.LastModified)
            .ToList();

        if (backups.Count < minKeep)
        {
            _logger.LogWarning(
                "Only {Count} backups in {Prefix}, below minimum of {MinKeep}. No deletions performed.",
                backups.Count, prefix, minKeep);
        }
    }

    public async Task<ValidationResult> ValidateBackupAsync(string backupKey, CancellationToken cancellationToken = default)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"validate_{Guid.NewGuid()}.dump");

        try
        {
            // 1. Get stored checksum from R2 metadata
            Dictionary<string, string> metadata;
            try
            {
                metadata = await _backupStorage.GetMetadataAsync(backupKey, cancellationToken);
            }
            catch (FileNotFoundException)
            {
                return new ValidationResult(false, $"Backup not found: {backupKey}");
            }

            var storedChecksum = metadata.TryGetValue("x-amz-meta-checksum", out var cs) ? cs : null;
            var isEncrypted = metadata.TryGetValue("x-amz-meta-encrypted", out var enc)
                && string.Equals(enc, "true", StringComparison.OrdinalIgnoreCase);

            // 2. Download backup
            await using var downloadStream = await _backupStorage.GetAsync(backupKey, cancellationToken);
            await using var fileStream = File.Create(tempFile);
            await downloadStream.CopyToAsync(fileStream, cancellationToken);
            fileStream.Close();

            // 3. Verify checksum matches stored value (checksum is of encrypted file)
            if (!string.IsNullOrEmpty(storedChecksum))
            {
                var downloadedChecksum = await CalculateSha256Async(tempFile, cancellationToken);
                if (!string.Equals(storedChecksum, downloadedChecksum, StringComparison.OrdinalIgnoreCase))
                {
                    return new ValidationResult(false,
                        $"Checksum mismatch! Expected: {storedChecksum}, Got: {downloadedChecksum}. " +
                        "The backup file may be corrupted.");
                }
                _logger.LogInformation("Checksum verified: {Checksum}", downloadedChecksum);
            }
            else
            {
                _logger.LogWarning("No stored checksum found for {BackupKey}, skipping checksum verification", backupKey);
            }

            // 4. Decrypt if encrypted
            if (isEncrypted)
            {
                if (_backupPassword == null)
                {
                    return new ValidationResult(false,
                        "Backup is encrypted but no backup password is configured.");
                }

                var decryptedFile = tempFile + ".dec";
                try
                {
                    await DecryptFileAsync(tempFile, decryptedFile, _backupPassword, cancellationToken);
                    File.Delete(tempFile);
                    File.Move(decryptedFile, tempFile);
                    _logger.LogInformation("Backup decrypted for validation");
                }
                catch (CryptographicException ex)
                {
                    if (File.Exists(decryptedFile)) File.Delete(decryptedFile);
                    return new ValidationResult(false,
                        $"Failed to decrypt backup. Wrong password? Error: {ex.Message}");
                }
            }

            // 5. Run pg_restore --list to verify format/integrity (doesn't actually restore)
            var processInfo = new ProcessStartInfo
            {
                FileName = "pg_restore",
                Arguments = $"--list \"{tempFile}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processInfo };
            process.Start();

            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(_processTimeout);

            var stderr = await process.StandardError.ReadToEndAsync(timeoutCts.Token);
            await process.WaitForExitAsync(timeoutCts.Token);

            if (process.ExitCode != 0)
            {
                return new ValidationResult(false, $"pg_restore --list failed: {stderr}");
            }

            return new ValidationResult(true, null);
        }
        catch (Exception ex)
        {
            return new ValidationResult(false, ex.Message);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    private static async Task<string> CalculateSha256Async(string filePath, CancellationToken cancellationToken)
    {
        using var sha256 = SHA256.Create();
        await using var stream = File.OpenRead(filePath);
        var hash = await sha256.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>
    /// Encrypts a file using AES-256-CBC with PBKDF2 key derivation.
    /// Output format is OpenSSL-compatible: "Salted__" + 8-byte salt + ciphertext
    /// This allows decryption via: openssl enc -d -aes-256-cbc -pbkdf2 -in file.enc -out file
    /// </summary>
    private static async Task EncryptFileAsync(
        string inputPath,
        string outputPath,
        string password,
        CancellationToken cancellationToken)
    {
        // Generate random 8-byte salt (OpenSSL format)
        var salt = RandomNumberGenerator.GetBytes(8);

        // Derive key and IV using PBKDF2 (OpenSSL default: 10000 iterations, SHA256)
        var (key, iv) = DeriveKeyAndIv(password, salt);

        await using var inputStream = File.OpenRead(inputPath);
        await using var outputStream = File.Create(outputPath);

        // Write OpenSSL header: "Salted__" + salt
        await outputStream.WriteAsync(OpenSslSaltHeader, cancellationToken);
        await outputStream.WriteAsync(salt, cancellationToken);

        // Encrypt with AES-256-CBC
        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        await using var cryptoStream = new CryptoStream(outputStream, aes.CreateEncryptor(), CryptoStreamMode.Write);
        await inputStream.CopyToAsync(cryptoStream, cancellationToken);
    }

    /// <summary>
    /// Decrypts a file encrypted with AES-256-CBC (OpenSSL format).
    /// Expects format: "Salted__" + 8-byte salt + ciphertext
    /// </summary>
    private static async Task DecryptFileAsync(
        string inputPath,
        string outputPath,
        string password,
        CancellationToken cancellationToken)
    {
        await using var inputStream = File.OpenRead(inputPath);

        // Read and verify OpenSSL header
        var header = new byte[8];
        var bytesRead = await inputStream.ReadAsync(header, cancellationToken);
        if (bytesRead != 8 || !header.AsSpan().SequenceEqual(OpenSslSaltHeader))
        {
            throw new CryptographicException("Invalid encrypted file format. Missing OpenSSL 'Salted__' header.");
        }

        // Read 8-byte salt
        var salt = new byte[8];
        bytesRead = await inputStream.ReadAsync(salt, cancellationToken);
        if (bytesRead != 8)
        {
            throw new CryptographicException("Invalid encrypted file format. Could not read salt.");
        }

        // Derive key and IV using same parameters as encryption
        var (key, iv) = DeriveKeyAndIv(password, salt);

        // Decrypt with AES-256-CBC
        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        await using var outputStream = File.Create(outputPath);
        await using var cryptoStream = new CryptoStream(inputStream, aes.CreateDecryptor(), CryptoStreamMode.Read);
        await cryptoStream.CopyToAsync(outputStream, cancellationToken);
    }

    /// <summary>
    /// Derives AES-256 key (32 bytes) and IV (16 bytes) from password and salt using PBKDF2.
    /// Uses 600,000 iterations per OWASP 2023 recommendations for PBKDF2-HMAC-SHA256.
    /// CLI scripts must use: openssl enc -iter 600000
    /// </summary>
    private static (byte[] Key, byte[] Iv) DeriveKeyAndIv(string password, byte[] salt)
    {
        // OWASP recommends at least 600,000 iterations for PBKDF2-HMAC-SHA256 (2023)
        using var pbkdf2 = new Rfc2898DeriveBytes(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 600000,
            HashAlgorithmName.SHA256);

        // AES-256 requires 32-byte key, CBC requires 16-byte IV
        var key = pbkdf2.GetBytes(32);
        var iv = pbkdf2.GetBytes(16);

        return (key, iv);
    }
}
