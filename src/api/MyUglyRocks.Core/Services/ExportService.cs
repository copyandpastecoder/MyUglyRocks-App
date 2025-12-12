using System.Globalization;
using System.IO.Compression;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class ExportService : IExportService
{
    private readonly DbContext _context;

    // DbSet properties to access entities
    private DbSet<User> Users => _context.Set<User>();
    private DbSet<Cycle> Cycles => _context.Set<Cycle>();
    private DbSet<StageRun> StageRuns => _context.Set<StageRun>();
    private DbSet<Tumbler> Tumblers => _context.Set<Tumbler>();
    private DbSet<Post> Posts => _context.Set<Post>();
    private DbSet<Comment> Comments => _context.Set<Comment>();
    private DbSet<Vote> Votes => _context.Set<Vote>();
    private DbSet<UserSettings> UserSettingsSet => _context.Set<UserSettings>();

    public ExportService(DbContext context)
    {
        _context = context;
    }

    public async Task<ExportResponse> ExportCyclesAsync(Guid userId, ExportCyclesRequest? request = null)
    {
        var query = Cycles
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
            .Include(c => c.CycleSpecimens)
                .ThenInclude(cs => cs.Specimen)
            .AsQueryable();

        if (request?.StartDate.HasValue == true)
            query = query.Where(c => c.StartDate >= request.StartDate.Value);

        if (request?.EndDate.HasValue == true)
            query = query.Where(c => c.StartDate <= request.EndDate.Value);

        if (!string.IsNullOrEmpty(request?.Status))
        {
            if (Enum.TryParse<CycleStatus>(request.Status, true, out var status))
                query = query.Where(c => c.Status == status);
        }

        var cycles = await query.OrderByDescending(c => c.StartDate).ToListAsync();

        var rows = cycles.Select(c => new CycleCsvRow(
            CycleId: c.CycleId,
            CycleName: c.Name,
            Status: c.Status.ToString(),
            StartDate: c.StartDate,
            EndDate: c.EndDate,
            DifficultyRating: c.DifficultyRating,
            FinalQuality: c.FinalQuality,
            Specimens: GetSpecimensString(c),
            Notes: c.Notes,
            TotalStages: c.StageRuns.Count,
            CompletedStages: c.StageRuns.Count(s => s.Status == StageRunStatus.Completed)
        )).ToList();

        var csv = GenerateCsv(rows);
        var fileName = $"cycles-export-{DateTime.UtcNow:yyyy-MM-dd}.csv";

        return new ExportResponse(fileName, "text/csv", csv);
    }

    public async Task<ExportResponse> ExportCycleAsync(Guid userId, Guid cycleId)
    {
        var cycle = await Cycles
            .Where(c => c.CycleId == cycleId && c.UserId == userId && !c.IsDeleted)
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.StageRunBarrels)
                    .ThenInclude(srb => srb.Barrel)
            .Include(c => c.CycleSpecimens)
                .ThenInclude(cs => cs.Specimen)
            .FirstOrDefaultAsync();

        if (cycle == null)
            throw new InvalidOperationException("Cycle not found or access denied");

        var rows = cycle.StageRuns.OrderBy(s => s.StartDateTime).Select(s => new StageCsvRow(
            StageId: s.StageRunId,
            CycleId: cycle.CycleId,
            CycleName: cycle.Name,
            StageName: s.StageName,
            Status: s.Status.ToString(),
            StartDateTime: s.StartDateTime,
            EndDateTime: s.EndDateTime,
            DurationEstimateEndDate: s.DurationEstimateEndDate,
            DurationDays: s.DurationDays,
            DurationHours: s.DurationHours,
            BarrelName: GetBarrelNamesString(s),
            LoadWeightBeforeGrams: s.LoadWeightBeforeGrams,
            LoadWeightAfterGrams: s.LoadWeightAfterGrams,
            BarrelRpm: s.BarrelRpm,
            FillLevelPercent: s.FillLevelPercent,
            WaterLevel: s.WaterLevel?.ToString(),
            ResultRating: s.ResultRating,
            NextAction: s.NextAction?.ToString(),
            Notes: s.Notes
        )).ToList();

        var csv = GenerateCsv(rows);
        var safeName = SanitizeFileName(cycle.Name);
        var fileName = $"cycle-{safeName}-{DateTime.UtcNow:yyyy-MM-dd}.csv";

        return new ExportResponse(fileName, "text/csv", csv);
    }

    public async Task<ExportResponse> ExportStagesAsync(Guid userId, ExportCyclesRequest? request = null)
    {
        var query = StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.StageRunBarrels)
                .ThenInclude(srb => srb.Barrel)
            .Where(s => s.Cycle.UserId == userId && !s.IsDeleted && !s.Cycle.IsDeleted)
            .AsQueryable();

        if (request?.StartDate.HasValue == true)
            query = query.Where(s => DateOnly.FromDateTime(s.StartDateTime) >= request.StartDate.Value);

        if (request?.EndDate.HasValue == true)
            query = query.Where(s => DateOnly.FromDateTime(s.StartDateTime) <= request.EndDate.Value);

        if (!string.IsNullOrEmpty(request?.Status))
        {
            if (Enum.TryParse<CycleStatus>(request.Status, true, out var cycleStatus))
                query = query.Where(s => s.Cycle.Status == cycleStatus);
        }

        var stages = await query.OrderByDescending(s => s.StartDateTime).ToListAsync();

        var rows = stages.Select(s => new StageCsvRow(
            StageId: s.StageRunId,
            CycleId: s.CycleId,
            CycleName: s.Cycle.Name,
            StageName: s.StageName,
            Status: s.Status.ToString(),
            StartDateTime: s.StartDateTime,
            EndDateTime: s.EndDateTime,
            DurationEstimateEndDate: s.DurationEstimateEndDate,
            DurationDays: s.DurationDays,
            DurationHours: s.DurationHours,
            BarrelName: GetBarrelNamesString(s),
            LoadWeightBeforeGrams: s.LoadWeightBeforeGrams,
            LoadWeightAfterGrams: s.LoadWeightAfterGrams,
            BarrelRpm: s.BarrelRpm,
            FillLevelPercent: s.FillLevelPercent,
            WaterLevel: s.WaterLevel?.ToString(),
            ResultRating: s.ResultRating,
            NextAction: s.NextAction?.ToString(),
            Notes: s.Notes
        )).ToList();

        var csv = GenerateCsv(rows);
        var fileName = $"stages-export-{DateTime.UtcNow:yyyy-MM-dd}.csv";

        return new ExportResponse(fileName, "text/csv", csv);
    }

    public async Task<ExportResponse> ExportTumblersAsync(Guid userId)
    {
        var tumblers = await Tumblers
            .Include(t => t.Barrels)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.DateCreated)
            .ToListAsync();

        var rows = tumblers.Select(t => new TumblerCsvRow(
            TumblerId: t.TumblerId,
            Brand: t.Brand,
            Model: t.Model,
            TumblerType: t.TumblerType.ToString(),
            IsActive: t.IsActive,
            Notes: t.Notes,
            BarrelCount: t.Barrels.Count,
            DateCreated: t.DateCreated
        )).ToList();

        var csv = GenerateCsv(rows);
        var fileName = $"tumblers-export-{DateTime.UtcNow:yyyy-MM-dd}.csv";

        return new ExportResponse(fileName, "text/csv", csv);
    }

    public async Task<ExportResponse> ExportPostsAsync(Guid userId)
    {
        var posts = await Posts
            .Include(p => p.Cycle)
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.DateCreated)
            .ToListAsync();

        var rows = posts.Select(p => new PostCsvRow(
            PostId: p.PostId,
            Title: p.Title,
            Description: p.Description,
            Status: p.Status.ToString(),
            VoteCount: p.VoteCount,
            CommentCount: p.CommentCount,
            DateCreated: p.DateCreated,
            LinkedCycleId: p.CycleId,
            LinkedCycleName: p.Cycle?.Name
        )).ToList();

        var csv = GenerateCsv(rows);
        var fileName = $"posts-export-{DateTime.UtcNow:yyyy-MM-dd}.csv";

        return new ExportResponse(fileName, "text/csv", csv);
    }

    public async Task<ExportResponse> ExportFullDataAsync(Guid userId, string password)
    {
        // Verify password first
        var user = await Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive);

        if (user == null)
            throw new InvalidOperationException("User not found");

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid password");

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            // Export cycles
            var cyclesExport = await ExportCyclesAsync(userId);
            AddToArchive(archive, "cycles.csv", cyclesExport.Data);

            // Export all stages
            var stagesExport = await ExportStagesAsync(userId);
            AddToArchive(archive, "stages.csv", stagesExport.Data);

            // Export tumblers
            var tumblersExport = await ExportTumblersAsync(userId);
            AddToArchive(archive, "tumblers.csv", tumblersExport.Data);

            // Export posts
            var postsExport = await ExportPostsAsync(userId);
            AddToArchive(archive, "posts.csv", postsExport.Data);

            // Export user profile
            var profileCsv = GenerateUserProfileCsv(user);
            AddToArchive(archive, "profile.csv", profileCsv);

            // Export settings
            if (user.Settings != null)
            {
                var settingsCsv = GenerateUserSettingsCsv(user.Settings);
                AddToArchive(archive, "settings.csv", settingsCsv);
            }

            // Export comments made by the user
            var commentsCsv = await GenerateCommentsCsvAsync(userId);
            AddToArchive(archive, "comments.csv", commentsCsv);

            // Export votes made by the user
            var votesCsv = await GenerateVotesCsvAsync(userId);
            AddToArchive(archive, "votes.csv", votesCsv);

            // Add a README
            var readme = GenerateReadme(user.Username);
            AddToArchive(archive, "README.txt", readme);
        }

        memoryStream.Position = 0;
        var fileName = $"myuglyrocks-data-export-{DateTime.UtcNow:yyyy-MM-dd}.zip";

        return new ExportResponse(fileName, "application/zip", memoryStream.ToArray());
    }

    private static string GetSpecimensString(Cycle cycle)
    {
        var specimens = cycle.CycleSpecimens
            .Select(cs => cs.Specimen?.CommonName)
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();

        if (!string.IsNullOrEmpty(cycle.AdditionalSpecimens))
            specimens.Add(cycle.AdditionalSpecimens);

        return string.Join("; ", specimens);
    }

    private static string? GetBarrelNamesString(StageRun stageRun)
    {
        var barrelNames = stageRun.StageRunBarrels
            .Select(srb => srb.Barrel?.Nickname)
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();

        return barrelNames.Count > 0 ? string.Join("; ", barrelNames) : null;
    }

    private static byte[] GenerateCsv<T>(IList<T> rows) where T : class
    {
        var sb = new StringBuilder();
        var properties = typeof(T).GetProperties();

        // Header
        sb.AppendLine(string.Join(",", properties.Select(p => EscapeCsvField(p.Name))));

        // Rows
        foreach (var row in rows)
        {
            var values = properties.Select(p =>
            {
                var value = p.GetValue(row);
                return EscapeCsvField(FormatValue(value));
            });
            sb.AppendLine(string.Join(",", values));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string FormatValue(object? value)
    {
        return value switch
        {
            null => "",
            DateTime dt => dt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
            DateOnly d => d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            bool b => b ? "Yes" : "No",
            decimal dec => dec.ToString(CultureInfo.InvariantCulture),
            _ => value.ToString() ?? ""
        };
    }

    private static string EscapeCsvField(string? field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }

        return field;
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Join("", name.Split(invalid)).Replace(" ", "-").ToLowerInvariant();
    }

    private static void AddToArchive(ZipArchive archive, string fileName, byte[] data)
    {
        var entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
        using var stream = entry.Open();
        stream.Write(data, 0, data.Length);
    }

    private static byte[] GenerateUserProfileCsv(User user)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Field,Value");
        sb.AppendLine($"UserId,{EscapeCsvField(user.UserId.ToString())}");
        sb.AppendLine($"Username,{EscapeCsvField(user.Username)}");
        sb.AppendLine($"Email,{EscapeCsvField(user.Email)}");
        sb.AppendLine($"DisplayName,{EscapeCsvField(user.DisplayName)}");
        sb.AppendLine($"Bio,{EscapeCsvField(user.Bio)}");
        sb.AppendLine($"Role,{user.Role}");
        sb.AppendLine($"EmailVerified,{(user.EmailVerified ? "Yes" : "No")}");
        sb.AppendLine($"DateCreated,{user.DateCreated:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"DateLastLogin,{user.DateLastLogin?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Never"}");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] GenerateUserSettingsCsv(UserSettings settings)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Setting,Value");
        sb.AppendLine($"MeasurementSystem,{settings.MeasurementSystem}");
        sb.AppendLine($"DateFormat,{settings.DateFormat}");
        sb.AppendLine($"TimeFormat,{settings.TimeFormat}");
        sb.AppendLine($"Timezone,{EscapeCsvField(settings.Timezone)}");
        sb.AppendLine($"FirstDayOfWeek,{settings.FirstDayOfWeek}");
        sb.AppendLine($"ShowRelativeTimes,{(settings.ShowRelativeTimes ? "Yes" : "No")}");
        sb.AppendLine($"Theme,{settings.Theme}");
        sb.AppendLine($"NotifyStageReminders,{(settings.NotifyStageReminders ? "Yes" : "No")}");
        sb.AppendLine($"NotifyComments,{(settings.NotifyComments ? "Yes" : "No")}");
        sb.AppendLine($"NotifyReplies,{(settings.NotifyReplies ? "Yes" : "No")}");
        sb.AppendLine($"NotifyUglyRocks,{(settings.NotifyUglyRocks ? "Yes" : "No")}");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private async Task<byte[]> GenerateCommentsCsvAsync(Guid userId)
    {
        var comments = await Comments
            .Include(c => c.Post)
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .OrderByDescending(c => c.DateCreated)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("CommentId,PostId,PostTitle,Content,DateCreated");

        foreach (var comment in comments)
        {
            sb.AppendLine($"{comment.CommentId},{comment.PostId},{EscapeCsvField(comment.Post?.Title)},{EscapeCsvField(comment.Content)},{comment.DateCreated:yyyy-MM-dd HH:mm:ss}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private async Task<byte[]> GenerateVotesCsvAsync(Guid userId)
    {
        var votes = await Votes
            .Include(v => v.Post)
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.DateCreated)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("VoteId,PostId,PostTitle,DateCreated");

        foreach (var vote in votes)
        {
            sb.AppendLine($"{vote.VoteId},{vote.PostId},{EscapeCsvField(vote.Post?.Title)},{vote.DateCreated:yyyy-MM-dd HH:mm:ss}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] GenerateReadme(string username)
    {
        var content = $"""
            MyUglyRocks Data Export
            =======================

            This archive contains all your data from MyUglyRocks.

            Export Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC
            Username: {username}

            Contents:
            ---------
            - profile.csv: Your account information
            - settings.csv: Your preferences and settings
            - cycles.csv: All your tumbling cycles
            - stages.csv: All stage runs across all cycles
            - tumblers.csv: Your tumblers and barrels
            - posts.csv: Posts you've shared to the gallery
            - comments.csv: Comments you've made
            - votes.csv: Posts you've voted on

            Data Format:
            ------------
            All CSV files use UTF-8 encoding with comma separators.
            Dates are in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss).

            Questions?
            ----------
            If you have questions about this export, contact support@myuglyrocks.com

            This export was generated in compliance with data protection regulations (GDPR/CCPA).
            """;

        return Encoding.UTF8.GetBytes(content);
    }
}
