using Mapster;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class PostService : IPostService
{
    private readonly DbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ICacheService _cache;

    private const string PostsCacheKeyPrefix = "posts:";
    private const string PostsListCacheKey = "posts:list:";
    private static readonly TimeSpan ListCacheDuration = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan DetailCacheDuration = TimeSpan.FromMinutes(15);

    public PostService(DbContext context, INotificationService notificationService, ICacheService cache)
    {
        _context = context;
        _notificationService = notificationService;
        _cache = cache;
    }

    #region Post Operations

    public async Task<IEnumerable<PostListDto>> GetPostsAsync(string? sortBy = null, int skip = 0, int take = 20)
    {
        // Cache only the first page of results
        var isFirstPage = skip == 0 && take <= 20;
        var sortKey = sortBy?.ToLower() ?? "newest";
        var cacheKey = $"{PostsListCacheKey}{sortKey}";

        if (isFirstPage)
        {
            var cached = await _cache.GetAsync<List<PostListDto>>(cacheKey);
            if (cached != null)
                return cached;
        }

        var query = _context.Set<Post>()
            .Include(p => p.User)
            .Include(p => p.PostPhotos)
                .ThenInclude(pp => pp.Photo)
            .Where(p => p.Status == PostStatus.Published);

        query = sortBy?.ToLower() switch
        {
            "votes" => query.OrderByDescending(p => p.VoteCount),
            "comments" => query.OrderByDescending(p => p.CommentCount),
            _ => query.OrderByDescending(p => p.PublishedDate)
        };

        var posts = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var result = posts.Select(MapToListDto).ToList();

        // Cache first page results
        if (isFirstPage)
        {
            await _cache.SetAsync(cacheKey, result, ListCacheDuration);
        }

        return result;
    }

    public async Task<PostDto?> GetPostByIdAsync(Guid id, Guid? currentUserId = null)
    {
        var cacheKey = $"{PostsCacheKeyPrefix}{id}";
        var cached = await _cache.GetAsync<PostDto>(cacheKey);
        if (cached != null)
            return cached;

        var post = await _context.Set<Post>()
            .Include(p => p.User)
            .Include(p => p.Cycle)
                .ThenInclude(c => c.StageRuns)
            .Include(p => p.PostPhotos)
                .ThenInclude(pp => pp.Photo)
            .FirstOrDefaultAsync(p => p.Id == id && p.Status == PostStatus.Published);

        if (post == null) return null;

        var result = MapToDto(post);
        await _cache.SetAsync(cacheKey, result, DetailCacheDuration);
        return result;
    }

    public async Task<IEnumerable<PostListDto>> GetUserPostsAsync(string username, int skip = 0, int take = 20)
    {
        var posts = await _context.Set<Post>()
            .Include(p => p.User)
            .Include(p => p.PostPhotos)
                .ThenInclude(pp => pp.Photo)
            .Where(p => p.User.Username == username && p.Status == PostStatus.Published)
            .OrderByDescending(p => p.PublishedDate)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return posts.Select(MapToListDto);
    }

    public async Task<PostDto> CreatePostAsync(Guid userId, CreatePostRequest request)
    {
        var cycle = await _context.Set<Cycle>()
            .Include(c => c.StageRuns)
            .FirstOrDefaultAsync(c => c.Id == request.CycleId && c.UserId == userId);

        if (cycle == null)
            throw new InvalidOperationException("Cycle not found or doesn't belong to user");

        if (cycle.Status != CycleStatus.Completed)
            throw new InvalidOperationException("Can only share completed cycles");

        var post = new Post
        {
            UserId = userId,
            CycleId = request.CycleId,
            Title = request.Title,
            Description = request.Description,
            Status = PostStatus.Published,
            PublishedDate = DateTime.UtcNow
        };

        _context.Set<Post>().Add(post);

        // Add photos if any
        if (request.PhotoIds.Count > 0)
        {
            var photos = await _context.Set<Photo>()
                .Where(p => request.PhotoIds.Contains(p.Id))
                .ToListAsync();

            var sortOrder = 0;
            foreach (var photoId in request.PhotoIds)
            {
                var photo = photos.FirstOrDefault(p => p.Id == photoId);
                if (photo != null)
                {
                    var postPhoto = new PostPhoto
                    {
                        PostId = post.Id,
                        PhotoId = photoId,
                        SortOrder = sortOrder++,
                        IsCover = photoId == request.CoverPhotoId || (request.CoverPhotoId == null && sortOrder == 1)
                    };
                    _context.Set<PostPhoto>().Add(postPhoto);
                }
            }
        }

        await _context.SaveChangesAsync();

        // Invalidate post list caches
        await InvalidatePostListCachesAsync();

        return (await GetPostByIdAsync(post.Id))!;
    }

    public async Task<PostDto?> UpdatePostAsync(Guid id, Guid userId, UpdatePostRequest request)
    {
        var post = await _context.Set<Post>()
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (post == null) return null;

        post.Title = request.Title;
        post.Description = request.Description;

        await _context.SaveChangesAsync();

        // Invalidate caches
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{id}");
        await InvalidatePostListCachesAsync();

        return await GetPostByIdAsync(id);
    }

    public async Task<bool> DeletePostAsync(Guid id, Guid userId)
    {
        var post = await _context.Set<Post>()
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (post == null) return false;

        _context.Set<Post>().Remove(post); // Uses soft delete
        await _context.SaveChangesAsync();

        // Invalidate caches
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{id}");
        await InvalidatePostListCachesAsync();

        return true;
    }

    #endregion

    #region Vote Operations

    public async Task<VoteCountDto> GetVoteCountAsync(Guid postId, Guid? userId = null)
    {
        var count = await _context.Set<Vote>().CountAsync(v => v.PostId == postId);
        var userHasVoted = userId.HasValue &&
            await _context.Set<Vote>().AnyAsync(v => v.PostId == postId && v.UserId == userId.Value);

        return new VoteCountDto
        {
            PostId = postId,
            Count = count,
            UserHasVoted = userHasVoted
        };
    }

    public async Task<VoteDto?> AddVoteAsync(Guid postId, Guid userId)
    {
        var exists = await _context.Set<Vote>()
            .AnyAsync(v => v.PostId == postId && v.UserId == userId);

        if (exists) return null;

        var vote = new Vote
        {
            PostId = postId,
            UserId = userId
        };

        _context.Set<Vote>().Add(vote);

        // Increment post vote count
        var post = await _context.Set<Post>().FindAsync(postId);
        if (post != null) post.VoteCount++;

        await _context.SaveChangesAsync();

        // Invalidate caches (vote count affects "votes" sort)
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{postId}");
        await _cache.RemoveAsync($"{PostsListCacheKey}votes");

        // Send notifications (first vote and milestones)
        await _notificationService.NotifyVoteAddedAsync(postId, userId);
        await _notificationService.CheckVoteMilestonesAsync(postId);

        return vote.Adapt<VoteDto>();
    }

    public async Task<bool> RemoveVoteAsync(Guid postId, Guid userId)
    {
        var vote = await _context.Set<Vote>()
            .FirstOrDefaultAsync(v => v.PostId == postId && v.UserId == userId);

        if (vote == null) return false;

        _context.Set<Vote>().Remove(vote);

        // Decrement post vote count
        var post = await _context.Set<Post>().FindAsync(postId);
        if (post != null && post.VoteCount > 0) post.VoteCount--;

        await _context.SaveChangesAsync();

        // Invalidate caches (vote count affects "votes" sort)
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{postId}");
        await _cache.RemoveAsync($"{PostsListCacheKey}votes");

        return true;
    }

    #endregion

    #region Comment Operations

    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid postId)
    {
        var comments = await _context.Set<Comment>()
            .Include(c => c.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .Where(c => c.PostId == postId && c.ParentCommentId == null)
            .OrderBy(c => c.DateCreated)
            .ToListAsync();

        return comments.Select(MapCommentToDto);
    }

    public async Task<CommentDto> AddCommentAsync(Guid postId, Guid userId, CreateCommentRequest request)
    {
        var comment = new Comment
        {
            PostId = postId,
            UserId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = request.Content
        };

        _context.Set<Comment>().Add(comment);

        // Increment post comment count
        var post = await _context.Set<Post>().FindAsync(postId);
        if (post != null) post.CommentCount++;

        await _context.SaveChangesAsync();

        // Invalidate caches (comment count affects "comments" sort)
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{postId}");
        await _cache.RemoveAsync($"{PostsListCacheKey}comments");

        // Send notifications
        if (request.ParentCommentId.HasValue)
        {
            // Reply notification
            await _notificationService.NotifyReplyAddedAsync(request.ParentCommentId.Value, comment.Id, userId);
        }
        else
        {
            // New comment notification to post owner
            await _notificationService.NotifyCommentAddedAsync(postId, comment.Id, userId);
        }

        // Reload with user
        var savedComment = await _context.Set<Comment>()
            .Include(c => c.User)
            .FirstAsync(c => c.Id == comment.Id);

        return MapCommentToDto(savedComment);
    }

    public async Task<CommentDto?> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request)
    {
        var comment = await _context.Set<Comment>()
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId);

        if (comment == null) return null;

        comment.Content = request.Content;
        comment.IsEdited = true;
        comment.EditedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapCommentToDto(comment);
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Set<Comment>()
            .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId);

        if (comment == null) return false;

        var postId = comment.PostId;

        _context.Set<Comment>().Remove(comment); // Uses soft delete

        // Decrement post comment count
        var post = await _context.Set<Post>().FindAsync(postId);
        if (post != null && post.CommentCount > 0) post.CommentCount--;

        await _context.SaveChangesAsync();

        // Invalidate caches (comment count affects "comments" sort)
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{postId}");
        await _cache.RemoveAsync($"{PostsListCacheKey}comments");

        return true;
    }

    public async Task<bool> ReportCommentAsync(Guid commentId, Guid userId, ReportCommentRequest request)
    {
        var comment = await _context.Set<Comment>().FindAsync(commentId);
        if (comment == null) return false;

        if (!Enum.TryParse<ReportReason>(request.Reason, true, out var reason))
            reason = ReportReason.Other;

        var report = new CommentReport
        {
            CommentId = commentId,
            ReportedByUserId = userId,
            Reason = reason,
            Details = request.Details
        };

        _context.Set<CommentReport>().Add(report);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Mapping Helpers

    private static PostListDto MapToListDto(Post post)
    {
        var coverPhoto = post.PostPhotos.FirstOrDefault(pp => pp.IsCover) ?? post.PostPhotos.FirstOrDefault();

        return new PostListDto
        {
            PostId = post.Id,
            Title = post.Title,
            Description = post.Description,
            PublishedDate = post.PublishedDate,
            VoteCount = post.VoteCount,
            CommentCount = post.CommentCount,
            CoverPhotoUrl = coverPhoto?.Photo?.Url,
            PhotoCount = post.PostPhotos.Count,
            Author = new PostAuthorDto
            {
                UserId = post.User.Id,
                Username = post.User.Username,
                DisplayName = post.User.DisplayName,
                AvatarUrl = post.User.AvatarUrl
            }
        };
    }

    private static PostDto MapToDto(Post post)
    {
        return new PostDto
        {
            PostId = post.Id,
            UserId = post.UserId,
            CycleId = post.CycleId,
            Title = post.Title,
            Description = post.Description,
            Status = post.Status.ToString(),
            PublishedDate = post.PublishedDate,
            VoteCount = post.VoteCount,
            CommentCount = post.CommentCount,
            Author = new PostAuthorDto
            {
                UserId = post.User.Id,
                Username = post.User.Username,
                DisplayName = post.User.DisplayName,
                AvatarUrl = post.User.AvatarUrl
            },
            Cycle = new CyclePreviewDto
            {
                CycleId = post.Cycle.Id,
                Name = post.Cycle.Name,
                Status = post.Cycle.Status.ToString(),
                StartDate = post.Cycle.StartDate,
                EndDate = post.Cycle.EndDate,
                Goal = post.Cycle.Goal,
                DifficultyRating = post.Cycle.DifficultyRating,
                FinalQuality = post.Cycle.FinalQuality,
                StageCount = post.Cycle.StageRuns.Count
            },
            Photos = post.PostPhotos.OrderBy(pp => pp.SortOrder).Select(pp => new PostPhotoDto
            {
                PostPhotoId = pp.Id,
                PhotoId = pp.PhotoId,
                Url = pp.Photo.Url,
                SortOrder = pp.SortOrder,
                IsCover = pp.IsCover
            })
        };
    }

    private static CommentDto MapCommentToDto(Comment comment)
    {
        return new CommentDto
        {
            CommentId = comment.Id,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            Content = comment.Content,
            IsEdited = comment.IsEdited,
            EditedDate = comment.EditedDate,
            DateCreated = comment.DateCreated,
            Author = new CommentAuthorDto
            {
                UserId = comment.User.Id,
                Username = comment.User.Username,
                DisplayName = comment.User.DisplayName,
                AvatarUrl = comment.User.AvatarUrl
            },
            Replies = comment.Replies?.Select(MapCommentToDto) ?? []
        };
    }

    private async Task InvalidatePostListCachesAsync()
    {
        await _cache.RemoveAsync($"{PostsListCacheKey}newest");
        await _cache.RemoveAsync($"{PostsListCacheKey}votes");
        await _cache.RemoveAsync($"{PostsListCacheKey}comments");
    }

    #endregion
}
