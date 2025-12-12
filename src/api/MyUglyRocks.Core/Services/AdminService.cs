using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class AdminService : IAdminService
{
    private readonly DbContext _context;

    private DbSet<User> Users => _context.Set<User>();
    private DbSet<Cycle> Cycles => _context.Set<Cycle>();
    private DbSet<Post> Posts => _context.Set<Post>();
    private DbSet<Comment> Comments => _context.Set<Comment>();
    private DbSet<CommentReport> CommentReports => _context.Set<CommentReport>();

    public AdminService(DbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var today = DateTime.UtcNow.Date;

        var totalUsers = await Users.CountAsync();
        var activeUsers = await Users.CountAsync(u => u.IsActive);
        var totalCycles = await Cycles.CountAsync(c => !c.IsDeleted);
        var totalPosts = await Posts.CountAsync(p => !p.IsDeleted);
        var totalComments = await Comments.CountAsync(c => !c.IsDeleted);
        var pendingReports = await CommentReports.CountAsync(r => r.Status == ReportStatus.Pending);
        var usersRegisteredToday = await Users.CountAsync(u => u.DateCreated >= today);
        var postsCreatedToday = await Posts.CountAsync(p => p.DateCreated >= today && !p.IsDeleted);

        return new AdminStatsDto(
            TotalUsers: totalUsers,
            ActiveUsers: activeUsers,
            TotalCycles: totalCycles,
            TotalPosts: totalPosts,
            TotalComments: totalComments,
            PendingReports: pendingReports,
            UsersRegisteredToday: usersRegisteredToday,
            PostsCreatedToday: postsCreatedToday
        );
    }

    public async Task<PaginatedResult<CommentReportListDto>> GetReportsAsync(
        string? status = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = CommentReports
            .Include(r => r.Comment)
                .ThenInclude(c => c.User)
            .Include(r => r.ReportedByUser)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ReportStatus>(status, true, out var reportStatus))
        {
            query = query.Where(r => r.Status == reportStatus);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.DateCreated)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new CommentReportListDto(
                r.Id,
                r.Comment.Content.Length > 100
                    ? r.Comment.Content.Substring(0, 100) + "..."
                    : r.Comment.Content,
                r.Comment.User.Username,
                r.ReportedByUser.Username,
                r.Reason.ToString(),
                r.Status.ToString(),
                r.DateCreated
            ))
            .ToListAsync();

        return new PaginatedResult<CommentReportListDto>(
            Items: items,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize,
            TotalPages: (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<CommentReportDto?> GetReportByIdAsync(Guid reportId)
    {
        var report = await CommentReports
            .Include(r => r.Comment)
                .ThenInclude(c => c.User)
            .Include(r => r.Comment)
                .ThenInclude(c => c.Post)
            .Include(r => r.ReportedByUser)
            .Include(r => r.ResolvedByUser)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null) return null;

        return new CommentReportDto(
            CommentReportId: report.Id,
            CommentId: report.CommentId,
            CommentContent: report.Comment.Content,
            CommentAuthorUsername: report.Comment.User.Username,
            PostId: report.Comment.PostId,
            PostTitle: report.Comment.Post.Title,
            ReportedByUsername: report.ReportedByUser.Username,
            Reason: report.Reason.ToString(),
            Details: report.Details,
            Status: report.Status.ToString(),
            ResolvedByUsername: report.ResolvedByUser?.Username,
            ResolvedDate: report.ResolvedDate,
            ResolutionNotes: report.ResolutionNotes,
            DateCreated: report.DateCreated
        );
    }

    public async Task<CommentReportDto> ResolveReportAsync(
        Guid reportId,
        Guid resolvedByUserId,
        ResolveReportRequest request)
    {
        var report = await CommentReports
            .Include(r => r.Comment)
                .ThenInclude(c => c.User)
            .Include(r => r.Comment)
                .ThenInclude(c => c.Post)
            .Include(r => r.ReportedByUser)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
            throw new InvalidOperationException("Report not found");

        if (!Enum.TryParse<ReportStatus>(request.Status, true, out var status))
            throw new ArgumentException($"Invalid status: {request.Status}");

        report.Status = status;
        report.ResolvedByUserId = resolvedByUserId;
        report.ResolvedDate = DateTime.UtcNow;
        report.ResolutionNotes = request.ResolutionNotes;
        report.DateUpdated = DateTime.UtcNow;

        if (request.DeleteComment)
        {
            report.Comment.IsDeleted = true;
            report.Comment.DateUpdated = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var resolvedByUser = await Users.FindAsync(resolvedByUserId);

        return new CommentReportDto(
            CommentReportId: report.Id,
            CommentId: report.CommentId,
            CommentContent: report.Comment.Content,
            CommentAuthorUsername: report.Comment.User.Username,
            PostId: report.Comment.PostId,
            PostTitle: report.Comment.Post.Title,
            ReportedByUsername: report.ReportedByUser.Username,
            Reason: report.Reason.ToString(),
            Details: report.Details,
            Status: report.Status.ToString(),
            ResolvedByUsername: resolvedByUser?.Username,
            ResolvedDate: report.ResolvedDate,
            ResolutionNotes: report.ResolutionNotes,
            DateCreated: report.DateCreated
        );
    }

    public async Task DeleteCommentAsync(Guid commentId, Guid deletedByUserId)
    {
        var comment = await Comments.FindAsync(commentId);
        if (comment == null)
            throw new InvalidOperationException("Comment not found");

        comment.IsDeleted = true;
        comment.DateUpdated = DateTime.UtcNow;

        // Update comment count on the post
        var post = await Posts.FindAsync(comment.PostId);
        if (post != null)
        {
            post.CommentCount = await Comments.CountAsync(c =>
                c.PostId == post.Id && !c.IsDeleted);
        }

        await _context.SaveChangesAsync();
    }

    public async Task<PaginatedResult<AdminUserListDto>> GetUsersAsync(
        string? search = null,
        string? role = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.DisplayName != null && u.DisplayName.ToLower().Contains(search)));
        }

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var userRole))
        {
            query = query.Where(u => u.Role == userRole);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.DateCreated)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserListDto(
                u.Id,  // UserId
                u.Username,
                u.Email,
                u.DisplayName,
                u.Role.ToString(),
                u.IsActive,
                u.DateCreated,
                u.DateLastLogin
            ))
            .ToListAsync();

        return new PaginatedResult<AdminUserListDto>(
            Items: items,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize,
            TotalPages: (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<AdminUserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        var totalCycles = await Cycles.CountAsync(c => c.UserId == userId && !c.IsDeleted);
        var totalPosts = await Posts.CountAsync(p => p.UserId == userId && !p.IsDeleted);
        var totalComments = await Comments.CountAsync(c => c.UserId == userId && !c.IsDeleted);

        return new AdminUserDto(
            UserId: user.Id,
            Username: user.Username,
            Email: user.Email,
            DisplayName: user.DisplayName,
            Role: user.Role.ToString(),
            IsActive: user.IsActive,
            EmailVerified: user.EmailVerified,
            DateCreated: user.DateCreated,
            DateLastLogin: user.DateLastLogin,
            TotalCycles: totalCycles,
            TotalPosts: totalPosts,
            TotalComments: totalComments
        );
    }

    public async Task<AdminUserDto> ChangeUserRoleAsync(
        Guid userId,
        Guid changedByUserId,
        ChangeUserRoleRequest request)
    {
        var user = await Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
            throw new ArgumentException($"Invalid role: {request.Role}");

        // Prevent changing own role
        if (userId == changedByUserId)
            throw new InvalidOperationException("Cannot change your own role");

        user.Role = newRole;
        user.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (await GetUserByIdAsync(userId))!;
    }

    public async Task BanUserAsync(
        Guid userId,
        Guid bannedByUserId,
        BanUserRequest request)
    {
        var user = await Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        // Prevent banning self
        if (userId == bannedByUserId)
            throw new InvalidOperationException("Cannot ban yourself");

        // Prevent banning admins
        if (user.Role == UserRole.Admin)
            throw new InvalidOperationException("Cannot ban an admin");

        user.IsActive = false;
        user.DateUpdated = DateTime.UtcNow;

        if (request.DeleteContent)
        {
            // Soft delete all user's posts
            var posts = await Posts.Where(p => p.UserId == userId && !p.IsDeleted).ToListAsync();
            foreach (var post in posts)
            {
                post.IsDeleted = true;
                post.DateUpdated = DateTime.UtcNow;
            }

            // Soft delete all user's comments
            var comments = await Comments.Where(c => c.UserId == userId && !c.IsDeleted).ToListAsync();
            foreach (var comment in comments)
            {
                comment.IsDeleted = true;
                comment.DateUpdated = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task UnbanUserAsync(Guid userId, Guid unbannedByUserId)
    {
        var user = await Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        user.IsActive = true;
        user.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }
}
