# Plan: Railway PostgreSQL Backup to R2

## Overview

Implement automated daily database backups from Railway PostgreSQL to Cloudflare R2, with manual backup/restore capabilities via the Admin panel and fallback scripts.

## Requirements Summary

| Requirement | Value |
|-------------|-------|
| **Schedule** | Daily at 4:00 AM UTC |
| **Manual Trigger** | Admin panel "Backup Now" button |
| **Storage** | R2 bucket `myuglyrocks-media-backup` |
| **Retention** | < 30 days: all, 30-180 days: weekly (Sunday), > 180 days: monthly (1st) |
| **Restore - Primary** | Admin panel with confirmation |
| **Restore - Fallback** | Scripts for when API is down |
| **Pre-restore Safety** | Auto-backup before restore (named `pre-restore_*`) |
| **Failure Notification** | Email all Admin users via Resend |

---

## Architecture

```
+------------------------------------------------------------------+
|                      API Pod (Railway)                            |
|                                                                   |
|  +---------------+    +------------------+    +----------------+  |
|  | Admin Panel   |--->| AdminController  |--->| DatabaseBackup |  |
|  | (Backup Now)  |    | POST /admin/...  |    | Service        |  |
|  +---------------+    +------------------+    +-------+--------+  |
|                                                       |           |
|  +---------------+    +------------------+            |           |
|  | Hangfire      |--->| DatabaseBackup   |------------+           |
|  | (4 AM UTC)    |    | Job (Recurring)  |            |           |
|  +---------------+    +------------------+            |           |
|                                                       v           |
|                       +------------------+    +----------------+  |
|                       | pg_dump /        |<---| pg_restore     |  |
|                       | pg_restore       |    | (custom fmt)   |  |
|                       | (postgresql-cli) |    +----------------+  |
|                       +--------+---------+                        |
+--------------------------------|----------------------------------+
                                 |
              +------------------+------------------+
              |                  |                  |
              v                  v                  v
       +------------+     +------------+     +------------+
       | PostgreSQL |     | R2 Bucket  |     | Resend     |
       | (Railway)  |     | (backups)  |     | (alerts)   |
       +------------+     +------------+     +------------+
```

---

## R2 Bucket Configuration

### Bucket Structure

```
myuglyrocks-media-backup/
+-- daily/                                    # Retained < 30 days
|   +-- myuglyrocks_2025-12-16_04-00-00.dump
|   +-- ...
|
+-- weekly/                                   # Retained 30-180 days (Sundays)
|   +-- myuglyrocks_2025-12-15_04-00-00.dump
|   +-- ...
|
+-- monthly/                                  # Retained > 180 days (1st of month)
|   +-- myuglyrocks_2025-12-01_04-00-00.dump
|   +-- ...
|
+-- manual/                                   # Never auto-deleted
|   +-- myuglyrocks_2025-12-16_15-30-00.dump
|
+-- pre-restore/                              # Safety backups before restore
    +-- pre-restore_2025-12-16_15-45-00.dump
```

### Security Requirements

**R2 Bucket Access:**
- Create a **dedicated R2 API token** with only `Object Read & Write` permissions
- Scope token to `myuglyrocks-media-backup` bucket only (least privilege)
- Do NOT reuse the media bucket token
- Store token in K8s secrets: `r2-backup-access-key-id`, `r2-backup-secret-access-key`

**Bucket Settings:**
- **Public Access**: Disabled (bucket is private)
- **CORS**: Not needed (server-side only)
- R2 automatically encrypts at rest (SSE)

**Why `DisablePayloadSigning = true`:**
- Required for R2 compatibility with AWS SDK v4
- R2 doesn't support SigV4 payload signing
- Safe because we're using HTTPS (TLS encryption in transit)

**Encryption Strategy:**
- **At rest**: R2 automatically encrypts all objects using SSE (Server-Side Encryption)
- **In transit**: All R2 operations use HTTPS (TLS encryption)
- **Client-side encryption**: Not implemented in initial version
  - Acceptable risk for now: R2 SSE + private bucket + dedicated API token provides sufficient protection
  - Database dumps don't contain raw credentials (hashed passwords, encrypted tokens)
  - Future enhancement: Add AES-256 encryption before upload for defense-in-depth
  - If implemented, store encryption key in separate secret (not with R2 credentials)

**Database Role Requirements (for restore):**
- The Railway PostgreSQL connection string user must be the database owner or have sufficient privileges
- Required permissions: DROP/CREATE tables, indexes, sequences, functions; TRUNCATE
- Railway's default `postgres` user typically has these permissions
- Using `--no-owner --no-acl` in pg_restore skips ownership/permission statements (avoids errors when restoring to different user)
- If restore fails with "permission denied", verify the user owns the target database

### Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Scheduled | `myuglyrocks_YYYY-MM-DD_HH-mm-ss.dump` | `myuglyrocks_2025-12-16_04-00-00.dump` |
| Manual | `myuglyrocks_YYYY-MM-DD_HH-mm-ss.dump` | `myuglyrocks_2025-12-16_15-30-00.dump` |
| Pre-restore | `pre-restore_YYYY-MM-DD_HH-mm-ss.dump` | `pre-restore_2025-12-16_15-45-00.dump` |

**Note:** Using `.dump` extension (pg_dump custom format) instead of `.sql.gz`.

---

## Implementation Details

### 1. Docker Image Modification

**File: `src/api/MyUglyRocks.Api/Dockerfile`**

Add `postgresql-client` package to enable `pg_dump` and `pg_restore` commands:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install PostgreSQL client tools for database backup/restore
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# ... rest of Dockerfile
```

**Impact:**
- Image size: +10-15 MB
- Build time: +5-10 seconds
- Runtime cost: Negligible (tools only run during backup)

---

### 2. Database Backup Service

**File: `src/api/MyUglyRocks.Infrastructure/Services/DatabaseBackupService.cs`**

```csharp
public interface IDatabaseBackupService
{
    /// <summary>
    /// Creates a database backup and uploads to R2
    /// </summary>
    Task<BackupResult> CreateBackupAsync(BackupType backupType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists available backups from R2
    /// </summary>
    Task<IEnumerable<BackupInfo>> ListBackupsAsync(int limit = 50, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the most recent backup info
    /// </summary>
    Task<BackupInfo?> GetLastBackupAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Restores database from a backup
    /// </summary>
    Task<RestoreResult> RestoreAsync(string backupKey, bool createPreRestoreBackup = true, CancellationToken cancellationToken = default);

    /// <summary>
    /// Applies retention policy - deletes old backups
    /// </summary>
    Task ApplyRetentionPolicyAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates backup integrity using pg_restore --list (format/CRC check).
    /// This verifies the backup file is readable and not corrupted, but does NOT
    /// actually restore data. See "Future Enhancements" for deep validation with
    /// a disposable database.
    /// </summary>
    Task<ValidationResult> ValidateBackupAsync(string backupKey, CancellationToken cancellationToken = default);
}

public enum BackupType
{
    Scheduled,   // Daily 4 AM backup
    Manual,      // Admin-triggered backup
    PreRestore   // Safety backup before restore
}

public record BackupResult(
    bool Success,
    string? R2Key,
    long? SizeBytes,
    TimeSpan Duration,
    string? Checksum,      // MD5 hash for integrity verification
    string? ErrorMessage
);

/// <summary>
/// Backup metadata. Note: Checksum is null when returned from ListBackupsAsync
/// because S3/R2 LIST operations don't include custom metadata.
/// Use GetBackupMetadataAsync to fetch checksum for a specific backup when needed
/// (e.g., on-demand when user expands a row in the admin UI).
/// </summary>
public record BackupInfo(
    string R2Key,
    string FileName,
    DateTime CreatedAt,
    long SizeBytes,
    BackupType Type,
    string? Checksum  // null from ListBackupsAsync; populated from HEAD request on-demand
);

public record RestoreResult(
    bool Success,
    string? PreRestoreBackupKey,
    TimeSpan Duration,
    string? ErrorMessage
);

public record ValidationResult(
    bool Success,
    string? ErrorMessage
);
```

**Implementation approach:**

```csharp
public class DatabaseBackupService : IDatabaseBackupService
{
    private readonly IConfiguration _configuration;
    private readonly IStorageService _storageService;
    private readonly ILogger<DatabaseBackupService> _logger;

    // Mutex to prevent concurrent backup/restore operations
    // Prevents: scheduled job + manual backup, or two restores running simultaneously
    private static readonly SemaphoreSlim _operationLock = new(1, 1);
    private static readonly TimeSpan _lockTimeout = TimeSpan.FromMinutes(30);

    public async Task<BackupResult> CreateBackupAsync(BackupType backupType, CancellationToken cancellationToken)
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
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            var pgDumpResult = await RunPgDumpAsync(connectionString, tempFile, cancellationToken);

            if (!pgDumpResult.Success)
            {
                return new BackupResult(false, null, null, stopwatch.Elapsed, null, pgDumpResult.Error);
            }

            // 2. Calculate checksum for integrity verification
            var checksum = await CalculateMd5Async(tempFile, cancellationToken);

            // 3. Upload to R2 (backup bucket) with checksum in metadata
            var fileInfo = new FileInfo(tempFile);
            await using var fileStream = File.OpenRead(tempFile);
            var metadata = new Dictionary<string, string>
            {
                ["x-amz-meta-checksum"] = checksum,
                ["x-amz-meta-backup-type"] = backupType.ToString(),
                ["x-amz-meta-created-at"] = DateTime.UtcNow.ToString("O")
            };
            await _storageService.UploadToBackupBucketAsync(r2Key, fileStream, "application/octet-stream", metadata, cancellationToken);

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

    // Process timeout for pg_dump/pg_restore operations
    // Prevents hung processes from blocking forever
    private static readonly TimeSpan _processTimeout = TimeSpan.FromMinutes(30);

    // Minimum required disk space for backup (50MB buffer + estimated dump size)
    // For small databases, 100MB is sufficient; adjust for larger databases
    private const long MinimumDiskSpaceBytes = 100 * 1024 * 1024; // 100 MB

    /// <summary>
    /// Uses pg_dump with custom format (-Fc) which:
    /// - Supports built-in compression (no need for gzip)
    /// - Allows selective restore
    /// - Works with pg_restore for safe restores
    /// </summary>
    private async Task<(bool Success, string? Error)> RunPgDumpAsync(
        string connectionString,
        string outputPath,
        CancellationToken cancellationToken)
    {
        // Pre-flight check: ensure sufficient disk space
        var tempDrive = new DriveInfo(Path.GetPathRoot(Path.GetTempPath()) ?? "/");
        if (tempDrive.AvailableFreeSpace < MinimumDiskSpaceBytes)
        {
            return (false, $"Insufficient disk space. Required: {MinimumDiskSpaceBytes / 1024 / 1024} MB, " +
                $"Available: {tempDrive.AvailableFreeSpace / 1024 / 1024} MB");
        }

        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        var processInfo = new ProcessStartInfo
        {
            FileName = "pg_dump",
            // -Fc = custom format (compressed, works with pg_restore)
            // -Z5 = compression level 5 (good balance of speed/size)
            // --no-owner --no-acl = don't include ownership (avoids permission issues)
            Arguments = $"-Fc -Z5 --no-owner --no-acl -f \"{outputPath}\"",
            Environment =
            {
                ["PGHOST"] = builder.Host,
                ["PGPORT"] = builder.Port.ToString(),
                ["PGDATABASE"] = builder.Database,
                ["PGUSER"] = builder.Username,
                ["PGPASSWORD"] = builder.Password,
            },
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

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
            return await RestoreInternalAsync(backupKey, createPreRestoreBackup, cancellationToken);
        }
        finally
        {
            _operationLock.Release();
        }
    }

    private async Task<RestoreResult> RestoreInternalAsync(
        string backupKey,
        bool createPreRestoreBackup,
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
            var metadata = await _storageService.GetBackupMetadataAsync(backupKey, cancellationToken);
            var storedChecksum = metadata.TryGetValue("x-amz-meta-checksum", out var cs) ? cs : null;

            // 3. Download backup from R2
            var tempFile = Path.Combine(Path.GetTempPath(), $"restore_{Guid.NewGuid()}.dump");
            try
            {
                await using var downloadStream = await _storageService.GetFromBackupBucketAsync(backupKey, cancellationToken);
                await using var fileStream = File.Create(tempFile);
                await downloadStream.CopyToAsync(fileStream, cancellationToken);
            }
            catch (Exception ex)
            {
                return new RestoreResult(false, preRestoreKey, stopwatch.Elapsed,
                    $"Failed to download backup: {ex.Message}");
            }

            // 4. Verify checksum before restore (fail fast on corrupted download)
            if (!string.IsNullOrEmpty(storedChecksum))
            {
                var downloadedChecksum = await CalculateMd5Async(tempFile, cancellationToken);
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

            // 5. Run pg_restore with --clean --if-exists --single-transaction
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            var restoreResult = await RunPgRestoreAsync(connectionString, tempFile, cancellationToken);

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

    /// <summary>
    /// Uses pg_restore with:
    /// - --clean: Drop existing objects before recreating
    /// - --if-exists: Don't error if objects don't exist
    /// - --single-transaction (optional): All-or-nothing restore (rollback on error)
    /// - --no-owner --no-acl: Skip ownership/permissions
    ///
    /// Connection info is passed via PGHOST/PGPORT/PGUSER/PGPASSWORD environment variables
    /// (not just -d <dbname>). This is required for Railway since pg_restore doesn't
    /// accept a full connection string - it needs host/port/user/password separately.
    ///
    /// IMPORTANT: Database Role Requirements
    /// The connection string user must have sufficient privileges to:
    /// - DROP and CREATE tables, indexes, sequences, functions
    /// - TRUNCATE tables (for --clean)
    /// - Railway's default postgres user typically has these permissions
    /// - If restore fails with "permission denied", check that the user owns the database
    ///   or has been granted the necessary roles
    ///
    /// TRADEOFF: --single-transaction
    /// - PRO: Atomic restore - if any statement fails, entire restore rolls back (no partial state)
    /// - CON: Holds exclusive locks for entire restore duration, can cause connection timeouts
    /// - CON: For very large databases, transaction log can grow significantly
    /// - RECOMMENDATION: Use for small-medium databases (&lt;1GB). For larger databases,
    ///   consider disabling and accepting the risk of partial restore on failure.
    /// </summary>
    private async Task<(bool Success, string? Error)> RunPgRestoreAsync(
        string connectionString,
        string inputPath,
        CancellationToken cancellationToken,
        bool useSingleTransaction = true)
    {
        // Parse connection string to extract individual components
        // pg_restore doesn't accept a connection string directly - it needs PGHOST/etc env vars
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        var arguments = useSingleTransaction
            ? $"--clean --if-exists --single-transaction --no-owner --no-acl -d \"{builder.Database}\" \"{inputPath}\""
            : $"--clean --if-exists --no-owner --no-acl -d \"{builder.Database}\" \"{inputPath}\"";

        var processInfo = new ProcessStartInfo
        {
            FileName = "pg_restore",
            // -d specifies database name; host/port/user/password come from env vars below
            Arguments = arguments,
            Environment =
            {
                // Required for Railway (remote host) - without these, pg_restore tries localhost
                ["PGHOST"] = builder.Host,
                ["PGPORT"] = builder.Port.ToString(),
                ["PGUSER"] = builder.Username,
                ["PGPASSWORD"] = builder.Password,
            },
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

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

    // Minimum backups to always keep, regardless of age
    // This safeguard prevents a bug in retention logic from deleting all backups
    private const int MinDailyBackups = 7;    // Always keep at least 1 week
    private const int MinWeeklyBackups = 4;   // Always keep at least 1 month
    private const int MinMonthlyBackups = 3;  // Always keep at least 1 quarter

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

    /// <summary>
    /// Deletes backups older than cutoff, but always keeps at least minKeep backups.
    /// Backups are sorted by date (newest first) before applying the minimum.
    /// </summary>
    private async Task DeleteBackupsOlderThanAsync(
        string prefix,
        DateTime cutoff,
        int minKeep,
        CancellationToken cancellationToken)
    {
        var backups = (await _storageService.ListBackupBucketAsync(prefix, cancellationToken))
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
            await _storageService.DeleteFromBackupBucketAsync(backup.Key, cancellationToken);
            _logger.LogInformation("Deleted old backup: {Key}", backup.Key);
        }
    }

    /// <summary>
    /// Ensures at least minKeep backups exist in the prefix.
    /// Does not delete based on age - only enforces a minimum count.
    /// </summary>
    private async Task EnforceMinimumBackupsAsync(
        string prefix,
        int minKeep,
        CancellationToken cancellationToken)
    {
        var backups = (await _storageService.ListBackupBucketAsync(prefix, cancellationToken))
            .OrderByDescending(b => b.LastModified)
            .ToList();

        if (backups.Count < minKeep)
        {
            _logger.LogWarning(
                "Only {Count} backups in {Prefix}, below minimum of {MinKeep}. No deletions performed.",
                backups.Count, prefix, minKeep);
        }
    }

    private async Task<string> CalculateMd5Async(string filePath, CancellationToken cancellationToken)
    {
        using var md5 = MD5.Create();
        await using var stream = File.OpenRead(filePath);
        var hash = await md5.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
```

---

### 3. Backup Validation Job

**File: `src/api/MyUglyRocks.Infrastructure/Jobs/BackupValidationJob.cs`**

Weekly job to verify backup integrity:

```csharp
public class BackupValidationJob
{
    private readonly IDatabaseBackupService _backupService;
    private readonly IEmailService _emailService;
    private readonly IUserService _userService;
    private readonly ILogger<BackupValidationJob> _logger;

    /// <summary>
    /// Weekly validation job - runs every Sunday at 5 AM UTC (after daily backup)
    ///
    /// Current validation (lightweight, runs weekly):
    /// 1. Downloads backup file from R2
    /// 2. Runs pg_restore --list to verify format/CRC integrity
    /// 3. Verifies checksum matches stored value
    ///
    /// This catches corrupted/incomplete backups but NOT logical issues
    /// (e.g., permission errors that would fail on actual restore).
    /// See "Future Enhancements" for deep validation with disposable DB.
    /// </summary>
    [AutomaticRetry(Attempts = 2)]
    [DisableConcurrentExecution(timeoutInSeconds: 1800)] // Prevent overlapping validation runs
    public async Task ExecuteValidationAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting weekly backup validation");

        var lastBackup = await _backupService.GetLastBackupAsync(cancellationToken);
        if (lastBackup == null)
        {
            _logger.LogWarning("No backups found to validate");
            return;
        }

        var result = await _backupService.ValidateBackupAsync(lastBackup.R2Key, cancellationToken);

        if (!result.Success)
        {
            _logger.LogError("Backup validation failed: {Error}", result.ErrorMessage);
            await SendValidationFailureNotificationAsync(lastBackup.R2Key, result.ErrorMessage, cancellationToken);
            throw new Exception($"Backup validation failed: {result.ErrorMessage}");
        }

        _logger.LogInformation("Backup validation passed for {R2Key}", lastBackup.R2Key);
    }

    private async Task SendValidationFailureNotificationAsync(string backupKey, string? error, CancellationToken cancellationToken)
    {
        var adminUsers = await _userService.GetUsersByRoleAsync("Admin", cancellationToken);

        foreach (var admin in adminUsers)
        {
            await _emailService.SendEmailAsync(
                to: admin.Email,
                subject: "[MyUglyRocks] Backup Validation Failed - ACTION REQUIRED",
                htmlBody: $@"
                    <h2>Backup Validation Failed</h2>
                    <p>The weekly backup validation at {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC failed.</p>
                    <p><strong>Backup:</strong> {backupKey}</p>
                    <p><strong>Error:</strong> {error ?? "Unknown error"}</p>
                    <p>This means your backups may not be restorable. Please investigate immediately.</p>
                ",
                cancellationToken: cancellationToken);
        }
    }
}
```

**Validation implementation in DatabaseBackupService:**

```csharp
public async Task<ValidationResult> ValidateBackupAsync(string backupKey, CancellationToken cancellationToken)
{
    var tempFile = Path.Combine(Path.GetTempPath(), $"validate_{Guid.NewGuid()}.dump");

    try
    {
        // 1. Get stored checksum from R2 metadata
        var metadata = await _storageService.GetBackupMetadataAsync(backupKey, cancellationToken);
        var storedChecksum = metadata.TryGetValue("x-amz-meta-checksum", out var cs) ? cs : null;

        // 2. Download backup
        await using var downloadStream = await _storageService.GetFromBackupBucketAsync(backupKey, cancellationToken);
        await using var fileStream = File.Create(tempFile);
        await downloadStream.CopyToAsync(fileStream, cancellationToken);
        fileStream.Close();

        // 3. Verify checksum matches stored value
        if (!string.IsNullOrEmpty(storedChecksum))
        {
            var downloadedChecksum = await CalculateMd5Async(tempFile, cancellationToken);
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

        // 4. Run pg_restore --list to verify format/integrity (doesn't actually restore)
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

        var stderr = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);

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
```

**Register recurring jobs in `Program.cs`:**

```csharp
// Daily backup at 4 AM UTC
RecurringJob.AddOrUpdate<DatabaseBackupJob>(
    "database-backup",
    job => job.ExecuteScheduledBackupAsync(CancellationToken.None),
    "0 4 * * *",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// Weekly validation at 5 AM UTC on Sundays
RecurringJob.AddOrUpdate<BackupValidationJob>(
    "backup-validation",
    job => job.ExecuteValidationAsync(CancellationToken.None),
    "0 5 * * 0",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
```

---

### 4. Hangfire Backup Job

**File: `src/api/MyUglyRocks.Infrastructure/Jobs/DatabaseBackupJob.cs`**

```csharp
public class DatabaseBackupJob
{
    private readonly IDatabaseBackupService _backupService;
    private readonly IEmailService _emailService;
    private readonly IUserService _userService;
    private readonly ILogger<DatabaseBackupJob> _logger;

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 60, 300, 900 })]
    [DisableConcurrentExecution(timeoutInSeconds: 3600)] // Prevent overlapping runs if backup takes long
    public async Task ExecuteScheduledBackupAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting scheduled database backup");

        var result = await _backupService.CreateBackupAsync(BackupType.Scheduled, cancellationToken);

        if (result.Success)
        {
            _logger.LogInformation(
                "Scheduled backup completed: {R2Key}, Size: {Size} MB, Duration: {Duration}s, Checksum: {Checksum}",
                result.R2Key,
                result.SizeBytes / 1024.0 / 1024.0,
                result.Duration.TotalSeconds,
                result.Checksum);

            await _backupService.ApplyRetentionPolicyAsync(cancellationToken);
        }
        else
        {
            _logger.LogError("Scheduled backup failed: {Error}", result.ErrorMessage);
            await SendBackupFailureNotificationAsync(result.ErrorMessage, cancellationToken);
            throw new Exception($"Backup failed: {result.ErrorMessage}");
        }
    }

    private async Task SendBackupFailureNotificationAsync(string? errorMessage, CancellationToken cancellationToken)
    {
        try
        {
            var adminUsers = await _userService.GetUsersByRoleAsync("Admin", cancellationToken);

            foreach (var admin in adminUsers)
            {
                await _emailService.SendEmailAsync(
                    to: admin.Email,
                    subject: "[MyUglyRocks] Database Backup Failed",
                    htmlBody: $@"
                        <h2>Database Backup Failed</h2>
                        <p>The scheduled database backup at {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC failed.</p>
                        <p><strong>Error:</strong> {errorMessage ?? "Unknown error"}</p>
                        <p>Please check the Hangfire dashboard for more details.</p>
                        <p><a href=""https://myuglyrocks.com/hangfire"">View Hangfire Dashboard</a></p>
                    ",
                    cancellationToken: cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send backup failure notification");
        }
    }
}
```

---

### 5. Admin Controller Endpoints

**File: `src/api/MyUglyRocks.Api/Controllers/AdminController.cs`**

```csharp
[HttpGet("backup/status")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<BackupStatusDto>> GetBackupStatus(CancellationToken cancellationToken)
{
    var lastBackup = await _backupService.GetLastBackupAsync(cancellationToken);

    return Ok(new BackupStatusDto
    {
        LastBackupDate = lastBackup?.CreatedAt,
        LastBackupSize = lastBackup?.SizeBytes,
        LastBackupKey = lastBackup?.R2Key,
        LastBackupType = lastBackup?.Type.ToString(),
        LastBackupChecksum = lastBackup?.Checksum
    });
}

[HttpGet("backup/list")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<IEnumerable<BackupInfo>>> ListBackups(
    [FromQuery] int limit = 20,
    CancellationToken cancellationToken = default)
{
    var backups = await _backupService.ListBackupsAsync(limit, cancellationToken);
    return Ok(backups);
}

[HttpPost("backup")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<BackupResult>> CreateBackup(CancellationToken cancellationToken)
{
    _logger.LogInformation("Manual backup triggered by {User}", User.Identity?.Name);

    var result = await _backupService.CreateBackupAsync(BackupType.Manual, cancellationToken);

    if (!result.Success)
        return StatusCode(500, result);

    return Ok(result);
}

[HttpPost("backup/restore")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<RestoreResult>> RestoreBackup(
    [FromBody] RestoreRequest request,
    CancellationToken cancellationToken)
{
    if (request.Confirmation != "RESTORE")
        return BadRequest("Invalid confirmation. Type 'RESTORE' to confirm.");

    _logger.LogWarning(
        "Database restore initiated by {User} from backup {BackupKey}",
        User.Identity?.Name,
        request.BackupKey);

    var result = await _backupService.RestoreAsync(
        request.BackupKey,
        createPreRestoreBackup: true,
        cancellationToken);

    if (!result.Success)
        return StatusCode(500, result);

    return Ok(result);
}

public record RestoreRequest(string BackupKey, string Confirmation);

public record BackupStatusDto
{
    public DateTime? LastBackupDate { get; init; }
    public long? LastBackupSize { get; init; }
    public string? LastBackupKey { get; init; }
    public string? LastBackupType { get; init; }
    public string? LastBackupChecksum { get; init; }
}
```

---

### 6. Storage Service Updates

**File: `src/api/MyUglyRocks.Abstractions/Interfaces/IStorageService.cs`**

```csharp
public interface IStorageService
{
    // ... existing methods ...

    Task UploadToBackupBucketAsync(string key, Stream stream, string contentType, Dictionary<string, string>? metadata = null, CancellationToken cancellationToken = default);
    Task<Stream> GetFromBackupBucketAsync(string key, CancellationToken cancellationToken = default);
    Task<Dictionary<string, string>> GetBackupMetadataAsync(string key, CancellationToken cancellationToken = default);
    Task<IEnumerable<S3ObjectInfo>> ListBackupBucketAsync(string? prefix = null, CancellationToken cancellationToken = default);
    Task DeleteFromBackupBucketAsync(string key, CancellationToken cancellationToken = default);
}

/// <summary>
/// Basic object info from S3 LIST operation.
/// Note: Checksum is NOT included here because LIST doesn't return metadata.
/// Use GetBackupMetadataAsync to fetch checksum for a specific object when needed.
/// </summary>
public record S3ObjectInfo(string Key, long Size, DateTime LastModified);
```

**Checksum Fetching Strategy for Listings:**

S3/R2 LIST operations don't return custom metadata (like our checksum). Options for displaying checksums in the admin UI:

1. **On-demand HEAD requests (recommended for now)**: When user expands a backup row or clicks "show details", call `GetBackupMetadataAsync` to fetch checksum. This avoids N+1 HEAD requests on page load.

2. **Parallel HEAD for limited list**: Since `ListBackupsAsync` limits to ~20-50 items, we could issue parallel HEAD requests for all items. Add a method like:
   ```csharp
   public async Task<IEnumerable<BackupInfo>> ListBackupsWithMetadataAsync(int limit, CancellationToken ct)
   {
       var objects = await ListBackupBucketAsync(null, ct);
       var tasks = objects.Take(limit).Select(async o => {
           var meta = await GetBackupMetadataAsync(o.Key, ct);
           return new BackupInfo(o.Key, ..., meta.GetValueOrDefault("x-amz-meta-checksum"));
       });
       return await Task.WhenAll(tasks);
   }
   ```

3. **Future: Store checksums in database**: If we need faster lookups or historical tracking, store backup metadata in a `backups` table. This adds complexity but enables queries like "find backup by checksum".

For initial implementation, use option 1 (on-demand) to keep it simple.

**R2 Metadata Key Casing:**

S3/R2 metadata keys are case-insensitive. We consistently use lowercase `x-amz-meta-checksum` for both write and read operations. When reading back, AWS SDK may return keys in different casing, but `Dictionary.TryGetValue` with the same key we wrote will work correctly.

**File: `src/api/MyUglyRocks.Infrastructure/Services/R2StorageService.cs`**

```csharp
public async Task UploadToBackupBucketAsync(string key, Stream stream, string contentType, Dictionary<string, string>? metadata = null, CancellationToken cancellationToken = default)
{
    var request = new PutObjectRequest
    {
        BucketName = _settings.BackupBucketName,
        Key = key,
        InputStream = stream,
        ContentType = contentType,
        // Required for R2 - it doesn't support SigV4 payload signing
        // Safe because we use HTTPS (encryption in transit)
        DisablePayloadSigning = true
    };

    // Add metadata (checksum, backup type, timestamp)
    if (metadata != null)
    {
        foreach (var kvp in metadata)
        {
            request.Metadata.Add(kvp.Key, kvp.Value);
        }
    }

    await _s3Client.PutObjectAsync(request, cancellationToken);
}

public async Task<Dictionary<string, string>> GetBackupMetadataAsync(string key, CancellationToken cancellationToken = default)
{
    var request = new GetObjectMetadataRequest
    {
        BucketName = _settings.BackupBucketName,
        Key = key
    };

    var response = await _s3Client.GetObjectMetadataAsync(request, cancellationToken);
    return response.Metadata.Keys.ToDictionary(k => k, k => response.Metadata[k]);
}

/// <summary>
/// Lists all objects in backup bucket with given prefix.
/// Uses pagination to handle >1000 objects (S3 API limit per request).
/// </summary>
public async Task<IEnumerable<S3ObjectInfo>> ListBackupBucketAsync(string? prefix = null, CancellationToken cancellationToken = default)
{
    var results = new List<S3ObjectInfo>();
    string? continuationToken = null;

    do
    {
        var request = new ListObjectsV2Request
        {
            BucketName = _settings.BackupBucketName,
            Prefix = prefix,
            ContinuationToken = continuationToken
        };

        var response = await _s3Client.ListObjectsV2Async(request, cancellationToken);

        results.AddRange(response.S3Objects.Select(o =>
            new S3ObjectInfo(o.Key, o.Size, o.LastModified)));

        continuationToken = response.IsTruncated ? response.NextContinuationToken : null;

    } while (continuationToken != null);

    return results;
}
```

---

### 7. Fallback Restore Scripts

**IMPORTANT:** These scripts now create a pre-restore backup by default and use pg_restore.

**File: `scripts/database-restore/restore.sh`**

```bash
#!/bin/bash
#
# MyUglyRocks Database Restore Script (Linux/Mac)
#
# This script restores the PostgreSQL database from an R2 backup.
# Use this when the API/Hangfire is down and you cannot restore via Admin panel.
#
# Prerequisites (ALL required):
#   - Wrangler CLI: npm install -g wrangler
#   - PostgreSQL client: apt-get install postgresql-client (or brew install postgresql)
#   - Python 3: apt-get install python3 (or brew install python3)
#     * REQUIRED for URL parsing - handles special characters in passwords (@ : % etc.)
#     * Simple bash parsing breaks on these characters
#   - Wrangler authenticated: wrangler login
#
# Usage:
#   ./restore.sh                     # List available backups
#   ./restore.sh <backup-key>        # Restore specific backup (creates safety backup first)
#   ./restore.sh --no-safety <key>   # Restore without creating safety backup
#

set -e

BUCKET="myuglyrocks-media-backup"
TEMP_DIR="/tmp/myuglyrocks-restore"
CREATE_SAFETY_BACKUP=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  MyUglyRocks Database Restore${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Parse arguments
BACKUP_KEY=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-safety)
            CREATE_SAFETY_BACKUP=false
            shift
            ;;
        *)
            BACKUP_KEY="$1"
            shift
            ;;
    esac
done

# List backups if no key provided
if [ -z "$BACKUP_KEY" ]; then
    echo "Available backups:"
    echo ""
    for prefix in daily weekly monthly manual pre-restore; do
        echo -e "${YELLOW}--- ${prefix}/ ---${NC}"
        wrangler r2 object list "$BUCKET" --prefix="${prefix}/" 2>/dev/null || echo "  (none)"
        echo ""
    done
    echo "Usage: $0 [--no-safety] <backup-key>"
    echo "Example: $0 daily/myuglyrocks_2025-12-16_04-00-00.dump"
    exit 0
fi

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
    echo ""
    echo "Set it with your Railway PostgreSQL connection string:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    exit 1
fi

# Parse DATABASE_URL for pg_dump/pg_restore
# Format: postgresql://user:pass@host:port/dbname
# NOTE: Simple bash parsing breaks on passwords with @ or : characters.
# Use Python's urllib for robust URL parsing, writing to a temp file to avoid eval injection.
parse_url() {
    local env_file="$TEMP_DIR/.pg_env_$$"

    # Python reads DATABASE_URL from environment and writes parsed values to temp file
    # (avoids eval injection from quotes/backticks in URL)
    python3 << 'PYEOF' > "$env_file"
import os
from urllib.parse import urlparse, unquote

url = urlparse(os.environ.get('DATABASE_URL', ''))
# unquote handles URL-encoded chars like %40 (@) or %3A (:)
# Write as KEY=value (no quotes needed when sourcing)
print(f'PGUSER={unquote(url.username or "")}')
print(f'PGPASSWORD={unquote(url.password or "")}')
print(f'PGHOST={url.hostname or ""}')
print(f'PGPORT={url.port or 5432}')
print(f'PGDATABASE={url.path.lstrip("/") or ""}')
PYEOF

    # Source the env file and clean up
    set -a  # Auto-export all variables
    source "$env_file"
    set +a
    rm -f "$env_file"
}

mkdir -p "$TEMP_DIR"
parse_url

# Verify parsing succeeded
if [ -z "$PGHOST" ] || [ -z "$PGDATABASE" ]; then
    echo -e "${RED}ERROR: Failed to parse DATABASE_URL${NC}"
    echo "Expected format: postgresql://user:pass@host:port/dbname"
    exit 1
fi

mkdir -p "$TEMP_DIR"

# Create safety backup first
if [ "$CREATE_SAFETY_BACKUP" = true ]; then
    echo -e "${YELLOW}Creating safety backup before restore...${NC}"
    SAFETY_FILE="$TEMP_DIR/pre-restore_$(date -u +%Y-%m-%d_%H-%M-%S).dump"
    SAFETY_KEY="pre-restore/pre-restore_$(date -u +%Y-%m-%d_%H-%M-%S).dump"

    pg_dump -Fc -Z5 --no-owner --no-acl -f "$SAFETY_FILE"

    if [ -f "$SAFETY_FILE" ]; then
        echo "Uploading safety backup to R2..."
        wrangler r2 object put "$BUCKET/$SAFETY_KEY" --file="$SAFETY_FILE"
        rm -f "$SAFETY_FILE"
        echo -e "${GREEN}Safety backup created: $SAFETY_KEY${NC}"
    else
        echo -e "${RED}ERROR: Failed to create safety backup${NC}"
        exit 1
    fi
fi

# Confirm restore
echo ""
echo -e "${RED}!!! WARNING !!!${NC}"
echo -e "${RED}This will REPLACE the entire database with the backup.${NC}"
echo ""
echo "Backup to restore: $BACKUP_KEY"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Cancelled."
    exit 0
fi

# Download and restore
echo ""
echo "Downloading backup from R2..."
RESTORE_FILE="$TEMP_DIR/restore.dump"
wrangler r2 object get "$BUCKET/$BACKUP_KEY" --file="$RESTORE_FILE"

if [ ! -f "$RESTORE_FILE" ]; then
    echo -e "${RED}ERROR: Failed to download backup${NC}"
    exit 1
fi

echo "Download complete: $(ls -lh $RESTORE_FILE | awk '{print $5}')"

# Get stored checksum from R2 metadata and verify
echo ""
echo "Verifying checksum..."
STORED_CHECKSUM=$(wrangler r2 object head "$BUCKET/$BACKUP_KEY" 2>/dev/null | grep -i "x-amz-meta-checksum" | awk '{print $2}' | tr -d '\r')

if [ -n "$STORED_CHECKSUM" ]; then
    # macOS uses 'md5' while Linux uses 'md5sum'
    if command -v md5sum &> /dev/null; then
        DOWNLOADED_CHECKSUM=$(md5sum "$RESTORE_FILE" | awk '{print $1}')
    else
        DOWNLOADED_CHECKSUM=$(md5 -q "$RESTORE_FILE")
    fi
    if [ "$STORED_CHECKSUM" != "$DOWNLOADED_CHECKSUM" ]; then
        echo -e "${RED}ERROR: Checksum mismatch!${NC}"
        echo "  Expected: $STORED_CHECKSUM"
        echo "  Got:      $DOWNLOADED_CHECKSUM"
        echo "The backup file may be corrupted. Restore aborted."
        rm -f "$RESTORE_FILE"
        exit 1
    fi
    echo -e "${GREEN}Checksum verified: $DOWNLOADED_CHECKSUM${NC}"
else
    echo -e "${YELLOW}WARNING: No stored checksum found, skipping verification${NC}"
fi

echo ""
echo "Restoring database..."
pg_restore --clean --if-exists --single-transaction --no-owner --no-acl -d "$PGDATABASE" "$RESTORE_FILE"

rm -f "$RESTORE_FILE"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Restore Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Note: Restart the API to clear any cached data."
```

**File: `scripts/database-restore/restore.ps1`**

```powershell
<#
.SYNOPSIS
    MyUglyRocks Database Restore Script (Windows)

.DESCRIPTION
    Restores PostgreSQL database from R2 backup.
    Creates a safety backup before restore by default.

.PARAMETER BackupKey
    The R2 object key of the backup to restore.
    If not provided, lists available backups.

.PARAMETER NoSafety
    Skip creating a safety backup before restore.

.EXAMPLE
    .\restore.ps1
    # Lists available backups

.EXAMPLE
    .\restore.ps1 -BackupKey "daily/myuglyrocks_2025-12-16_04-00-00.dump"
    # Restores with safety backup

.EXAMPLE
    .\restore.ps1 -BackupKey "daily/..." -NoSafety
    # Restores without safety backup
#>

param(
    [string]$BackupKey,
    [switch]$NoSafety,
    [string]$DatabaseUrl = $env:DATABASE_URL
)

# Load System.Web assembly for URL decoding (required for passwords with special chars)
Add-Type -AssemblyName System.Web

$ErrorActionPreference = "Stop"
$Bucket = "myuglyrocks-media-backup"
$TempDir = "$env:TEMP\myuglyrocks-restore"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  MyUglyRocks Database Restore" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# List backups if no key provided
if (-not $BackupKey) {
    Write-Host "Available backups:" -ForegroundColor Yellow
    foreach ($prefix in @("daily", "weekly", "monthly", "manual", "pre-restore")) {
        Write-Host "--- $prefix/ ---" -ForegroundColor Yellow
        wrangler r2 object list $Bucket --prefix="$prefix/" 2>$null
        Write-Host ""
    }
    Write-Host "Usage: .\restore.ps1 [-NoSafety] -BackupKey <backup-key>"
    return
}

# Check DATABASE_URL
if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL not set" -ForegroundColor Red
    return
}

# Parse DATABASE_URL using .NET Uri class
# This handles URL-encoded passwords with special characters (@ : etc.)
try {
    $Uri = [System.Uri]$DatabaseUrl
    $env:PGHOST = $Uri.Host
    $env:PGPORT = if ($Uri.Port -gt 0) { $Uri.Port } else { 5432 }
    $env:PGDATABASE = $Uri.AbsolutePath.TrimStart('/')

    # UserInfo contains "user:password" - need to split and URL-decode
    if ($Uri.UserInfo) {
        $Parts = $Uri.UserInfo -split ':', 2  # Split on first : only (password may contain :)
        $env:PGUSER = [System.Web.HttpUtility]::UrlDecode($Parts[0])
        if ($Parts.Length -gt 1) {
            $env:PGPASSWORD = [System.Web.HttpUtility]::UrlDecode($Parts[1])
        }
    }
} catch {
    Write-Host "ERROR: Failed to parse DATABASE_URL" -ForegroundColor Red
    Write-Host "Expected format: postgresql://user:pass@host:port/dbname"
    return
}

# Verify parsing succeeded
if (-not $env:PGHOST -or -not $env:PGDATABASE) {
    Write-Host "ERROR: DATABASE_URL missing host or database" -ForegroundColor Red
    return
}

New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

# Create safety backup
if (-not $NoSafety) {
    Write-Host "Creating safety backup before restore..." -ForegroundColor Yellow
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd_HH-mm-ss")
    $SafetyFile = "$TempDir\pre-restore_$timestamp.dump"
    $SafetyKey = "pre-restore/pre-restore_$timestamp.dump"

    pg_dump -Fc -Z5 --no-owner --no-acl -f $SafetyFile

    if (Test-Path $SafetyFile) {
        Write-Host "Uploading safety backup to R2..."
        wrangler r2 object put "$Bucket/$SafetyKey" --file="$SafetyFile"
        Remove-Item $SafetyFile -ErrorAction SilentlyContinue
        Write-Host "Safety backup created: $SafetyKey" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to create safety backup" -ForegroundColor Red
        return
    }
}

# Confirm
Write-Host ""
Write-Host "!!! WARNING !!!" -ForegroundColor Red
Write-Host "This will REPLACE the entire database with the backup." -ForegroundColor Red
Write-Host ""
Write-Host "Backup to restore: $BackupKey" -ForegroundColor Yellow
Write-Host ""
$Confirm = Read-Host "Type 'RESTORE' to confirm"

if ($Confirm -ne "RESTORE") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    return
}

# Download and restore
Write-Host ""
Write-Host "Downloading backup from R2..." -ForegroundColor Yellow
$RestoreFile = "$TempDir\restore.dump"
wrangler r2 object get "$Bucket/$BackupKey" --file="$RestoreFile"

if (-not (Test-Path $RestoreFile)) {
    Write-Host "ERROR: Failed to download backup" -ForegroundColor Red
    return
}

$FileSize = (Get-Item $RestoreFile).Length / 1MB
Write-Host "Download complete: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green

# Get stored checksum from R2 metadata and verify
Write-Host ""
Write-Host "Verifying checksum..." -ForegroundColor Yellow
$MetadataOutput = wrangler r2 object head "$Bucket/$BackupKey" 2>$null
$StoredChecksum = ($MetadataOutput | Select-String -Pattern "x-amz-meta-checksum:\s*(\S+)").Matches.Groups[1].Value

if ($StoredChecksum) {
    $DownloadedChecksum = (Get-FileHash -Path $RestoreFile -Algorithm MD5).Hash.ToLower()
    if ($StoredChecksum.ToLower() -ne $DownloadedChecksum) {
        Write-Host "ERROR: Checksum mismatch!" -ForegroundColor Red
        Write-Host "  Expected: $StoredChecksum"
        Write-Host "  Got:      $DownloadedChecksum"
        Write-Host "The backup file may be corrupted. Restore aborted."
        Remove-Item $RestoreFile -ErrorAction SilentlyContinue
        return
    }
    Write-Host "Checksum verified: $DownloadedChecksum" -ForegroundColor Green
} else {
    Write-Host "WARNING: No stored checksum found, skipping verification" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Restoring database..." -ForegroundColor Yellow
pg_restore --clean --if-exists --single-transaction --no-owner --no-acl -d $env:PGDATABASE $RestoreFile

Remove-Item $RestoreFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Restore Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Restart the API to clear any cached data."
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/api/MyUglyRocks.Infrastructure/Services/DatabaseBackupService.cs` | Core backup/restore logic |
| `src/api/MyUglyRocks.Infrastructure/Jobs/DatabaseBackupJob.cs` | Hangfire scheduled job |
| `src/api/MyUglyRocks.Infrastructure/Jobs/BackupValidationJob.cs` | Weekly integrity check |
| `src/api/MyUglyRocks.Abstractions/DTOs/BackupDtos.cs` | DTOs for backup operations |
| `src/web/src/hooks/use-backup.ts` | React Query hooks for backup API |
| `scripts/database-restore/restore.sh` | Linux/Mac restore script |
| `scripts/database-restore/restore.ps1` | Windows restore script |
| `scripts/database-restore/README.md` | Script documentation |

### Modified Files

| File | Changes |
|------|---------|
| `src/api/MyUglyRocks.Api/Dockerfile` | Add `postgresql-client` package |
| `src/api/MyUglyRocks.Api/Controllers/AdminController.cs` | Add backup/restore endpoints |
| `src/api/MyUglyRocks.Api/Program.cs` | Register recurring backup + validation jobs |
| `src/api/MyUglyRocks.Abstractions/Interfaces/IStorageService.cs` | Add backup bucket methods |
| `src/api/MyUglyRocks.Infrastructure/Services/R2StorageService.cs` | Implement backup bucket methods |
| `src/web/src/app/(protected)/admin/page.tsx` | Add backup UI section |
| `src/web/src/lib/api.ts` | Add backup API methods |

---

## Testing Plan

### 1. Unit Tests
- [ ] `CreateBackupAsync` - verify pg_dump execution and checksum generation
- [ ] `RestoreAsync` - verify pg_restore with --clean --single-transaction, checksum verification
- [ ] `ValidateBackupAsync` - verify both checksum verification AND pg_restore --list succeed
- [ ] `ValidateBackupAsync` - verify failure when checksum mismatches (corrupted file)
- [ ] `ValidateBackupAsync` - verify failure when pg_restore --list fails (invalid format)
- [ ] `ApplyRetentionPolicyAsync` - verify correct files deleted
- [ ] Backup job retry logic

### 2. Integration Tests
- [ ] Create backup and verify in R2
- [ ] Verify checksum matches downloaded file
- [ ] List backups returns correct data
- [ ] Restore from backup (use test database)
- [ ] Retention policy deletes correct backups
- [ ] Validation job detects corrupted backups

### 3. Manual Testing
- [ ] Trigger backup from Admin panel
- [ ] Verify backup appears in R2
- [ ] Wait for scheduled backup (4 AM UTC)
- [ ] Test restore from Admin panel (on staging/dev)
- [ ] Test restore scripts (on staging/dev)
- [ ] Verify failure email notification
- [ ] Verify validation email on corrupt backup

---

## Estimated Effort

| Task | Time |
|------|------|
| Dockerfile modification | 15 min |
| DatabaseBackupService (with pg_restore) | 3-4 hours |
| Storage service updates | 1 hour |
| Hangfire jobs (backup + validation) | 2 hours |
| Admin controller endpoints | 1 hour |
| Admin panel UI | 2 hours |
| Restore scripts (with safety backup) | 2 hours |
| Testing | 3-4 hours |
| Documentation | 1 hour |
| **Total** | **15-18 hours** |

---

## Rollout Plan

1. **Development**
   - Implement all components
   - Test locally with K8s environment
   - Create dedicated R2 backup bucket with restricted access
   - Verify R2 bucket access

2. **Staging (if available)**
   - Deploy to staging
   - Run full backup/restore cycle
   - Verify scheduled + validation jobs run
   - Test corrupted backup detection

3. **Production**
   - Create R2 API token with backup bucket only access
   - Deploy during low-traffic period
   - Verify scheduled job is registered
   - Trigger manual backup to confirm working
   - Monitor first scheduled backup (next 4 AM UTC)
   - Monitor first validation (next Sunday 5 AM UTC)

---

## Security Checklist

- [ ] Create dedicated R2 API token (backup bucket only)
- [ ] Verify bucket is not publicly accessible
- [ ] Store R2 credentials in K8s secrets
- [ ] Verify HTTPS is used for all R2 operations
- [ ] Add `DisablePayloadSigning` comment explaining why it's needed
- [ ] Review backup files don't contain sensitive credentials in plaintext

---

## Monitoring

- **Hangfire Dashboard**: View backup/validation job status at `/hangfire`
- **Logs**: Check API logs for backup success/failure
- **R2 Console**: Verify backups appear in bucket
- **Email**: Failure notifications to admin users
- **Weekly Validation**: Alerts on backup integrity issues

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| R2 Storage (30 daily × 10MB) | ~$0.005 |
| R2 Storage (4 weekly × 10MB) | ~$0.001 |
| R2 Storage (1 monthly × 10MB) | ~$0.0002 |
| Railway CPU (30s/day backup + weekly validation) | ~$0.02 |
| **Total** | **< $0.05/month** |

---

## Future Enhancements

These improvements are worth considering after the core backup system is working:

### Streaming Uploads
Currently, pg_dump writes to a temp file before uploading. For very large databases, this could be improved by streaming directly to R2 using multipart upload:
- Reduces temp disk usage
- Handles databases larger than available disk space
- More complex implementation (chunking, retry logic)

### Maintenance Mode During Restore
Add a simple maintenance mode to prevent data corruption during restore:
- Set a flag in Redis/memory before restore starts
- Middleware returns 503 for non-admin requests
- Clear flag after restore completes
- Could also lock Hangfire jobs during restore

### Metrics & Alerting Dashboard
Add observability beyond email alerts:
- Prometheus metrics: backup_duration_seconds, backup_size_bytes, backup_last_success_timestamp
- Grafana dashboard showing backup history and trends
- Alert on backup age > 48 hours (missed backup detection)

### Admin UI Improvements
Enhance the admin backup panel with:
- Real-time backup progress indicator
- Show "in-progress" or "failed" state during operations
- **Post-restore summary**: After restore completes, show:
  - The restored backup's checksum (so user can verify they restored the correct backup)
  - The pre-restore backup key (so user can easily rollback if needed)
  - A "Restore from safety backup" button that pre-fills the key
- Download backup file directly from admin panel
- Show checksum for each backup in the list (fetch via HEAD on demand)

### R2 API Token Rotation
Document token rotation procedure:
1. Create new R2 token
2. Add new credentials to K8s secrets
3. Restart API to pick up new credentials
4. Verify backup works with new token
5. Delete old R2 token

### Deep Validation with Disposable Database
Current validation only checks format/CRC via `pg_restore --list`. For deeper validation:
- Create a temporary/disposable PostgreSQL database (Railway allows creating additional databases)
- Actually restore the backup to the disposable database
- Run basic integrity checks (table counts, row counts, foreign key constraints)
- Drop the disposable database after validation
- Run monthly instead of weekly (more resource intensive)
- Catches logical/permission issues that format validation misses
