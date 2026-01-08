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
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventoryPhotos)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventorySpecimens)
                    .ThenInclude(s => s.Specimen)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventorySpecimens)
                    .ThenInclude(s => s.UserSpecimen)
            .Where(p => p.Status == PostStatus.Published 
                && (p.PostType == PostType.Cycle || p.PostType == PostType.Inventory));

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

    public async Task<IEnumerable<PostListDto>> GetFeedbackPostsAsync(string? category = null, string? sortBy = null, int skip = 0, int take = 20)
    {
        // Cache only the first page of results
        var isFirstPage = skip == 0 && take <= 20;
        var sortKey = sortBy?.ToLower() ?? "newest";
        var categoryKey = category?.ToLower() ?? "all";
        var cacheKey = $"{PostsListCacheKey}feedback:{categoryKey}:{sortKey}";

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
            .Where(p => p.PostType == PostType.Feedback && p.Status == PostStatus.Published);

        // Filter by category if provided
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<FeedbackCategory>(category, true, out var feedbackCategory))
        {
            query = query.Where(p => p.FeedbackCategory == feedbackCategory);
        }

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

    public async Task<PostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        var cacheKey = $"{PostsCacheKeyPrefix}{postId}";
        var cached = await _cache.GetAsync<PostDto>(cacheKey);
        if (cached != null)
            return cached;

        var post = await _context.Set<Post>()
            .Include(p => p.User)
            .Include(p => p.Cycle)
                .ThenInclude(c => c!.StageRuns.Where(sr => !sr.IsDeleted))
                    .ThenInclude(sr => sr.StageRunBarrels)
                        .ThenInclude(srb => srb.Barrel)
                            .ThenInclude(b => b.Tumbler)
            .Include(p => p.Cycle)
                .ThenInclude(c => c!.StageRuns.Where(sr => !sr.IsDeleted))
                    .ThenInclude(sr => sr.Photos.Where(ph => !ph.IsDeleted))
            .Include(p => p.Cycle)
                .ThenInclude(c => c!.CycleSpecimens)
                    .ThenInclude(cs => cs.Specimen)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventorySpecimens)
                    .ThenInclude(s => s.Specimen)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventorySpecimens)
                    .ThenInclude(s => s.UserSpecimen)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventoryPhotos)
            .Include(p => p.PostPhotos)
                .ThenInclude(pp => pp.Photo)
            .FirstOrDefaultAsync(p => p.PostId == postId && p.Status == PostStatus.Published);

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
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventoryPhotos)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventorySpecimens)
                    .ThenInclude(s => s.Specimen)
            .Include(p => p.Inventory)
                .ThenInclude(i => i!.InventorySpecimens)
                    .ThenInclude(s => s.UserSpecimen)
            .Where(p => p.User.Username == username && p.Status == PostStatus.Published)
            .OrderByDescending(p => p.PublishedDate)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return posts.Select(MapToListDto);
    }

    public async Task<PostDto> CreatePostAsync(Guid userId, CreatePostRequest request)
    {
        // Validate post type based on provided fields
        var hasCycleId = request.CycleId.HasValue;
        var hasInventoryId = request.InventoryId.HasValue;
        var hasFeedbackCategory = !string.IsNullOrEmpty(request.FeedbackCategory);

        // Exactly one of the three types must be specified
        if ((hasCycleId && hasInventoryId) || (hasCycleId && hasFeedbackCategory) || (hasInventoryId && hasFeedbackCategory))
            throw new InvalidOperationException("Only one of CycleId, InventoryId, or FeedbackCategory can be provided");

        if (!hasCycleId && !hasInventoryId && !hasFeedbackCategory)
            throw new InvalidOperationException("Either CycleId, InventoryId, or FeedbackCategory must be provided");

        Post post;

        if (hasFeedbackCategory)
        {
            // Feedback post
            if (!Enum.TryParse<FeedbackCategory>(request.FeedbackCategory, true, out var feedbackCategory))
                throw new InvalidOperationException($"Invalid feedback category: {request.FeedbackCategory}");

            post = new Post
            {
                UserId = userId,
                PostType = PostType.Feedback,
                FeedbackCategory = feedbackCategory,
                Title = request.Title,
                Description = request.Description,
                Status = PostStatus.Published,
                PublishedDate = DateTime.UtcNow
            };
        }
        else if (request.CycleId.HasValue)
        {
            var cycle = await _context.Set<Cycle>()
                .Include(c => c.StageRuns)
                .FirstOrDefaultAsync(c => c.CycleId == request.CycleId && c.UserId == userId);

            if (cycle == null)
                throw new InvalidOperationException("Cycle not found or doesn't belong to user");

            // Check if a post already exists for this cycle
            var existingCyclePost = await _context.Set<Post>()
                .AnyAsync(p => p.CycleId == request.CycleId && !p.IsDeleted);

            if (existingCyclePost)
                throw new InvalidOperationException("A gallery post already exists for this cycle");

            post = new Post
            {
                UserId = userId,
                PostType = PostType.Cycle,
                CycleId = request.CycleId,
                Title = request.Title,
                Description = request.Description,
                Status = PostStatus.Published,
                PublishedDate = DateTime.UtcNow
            };
        }
        else
        {
            var inventory = await _context.Set<Inventory>()
                .Include(i => i.InventoryPhotos)
                .FirstOrDefaultAsync(i => i.InventoryId == request.InventoryId && i.UserId == userId && !i.IsDeleted);

            if (inventory == null)
                throw new InvalidOperationException("Inventory not found or doesn't belong to user");

            // Check if inventory has photos
            if (!inventory.InventoryPhotos.Any())
                throw new InvalidOperationException("Inventory must have at least one photo to share");

            // Check if a post already exists for this inventory
            var existingInventoryPost = await _context.Set<Post>()
                .AnyAsync(p => p.InventoryId == request.InventoryId && !p.IsDeleted);

            if (existingInventoryPost)
                throw new InvalidOperationException("A gallery post already exists for this inventory");

            post = new Post
            {
                UserId = userId,
                PostType = PostType.Inventory,
                InventoryId = request.InventoryId,
                Title = request.Title,
                Description = request.Description,
                Status = PostStatus.Published,
                PublishedDate = DateTime.UtcNow
            };
        }

        _context.Set<Post>().Add(post);

        // Save post first to get the ID in the database
        await _context.SaveChangesAsync();

        // Add photos if any
        if (request.PhotoIds.Count > 0)
        {
            var photos = await _context.Set<Photo>()
                .Where(p => request.PhotoIds.Contains(p.PhotoId))
                .ToListAsync();

            var sortOrder = 0;
            foreach (var photoId in request.PhotoIds)
            {
                var photo = photos.FirstOrDefault(p => p.PhotoId == photoId);
                if (photo != null)
                {
                    var postPhoto = new PostPhoto
                    {
                        PostId = post.PostId,
                        PhotoId = photoId,
                        SortOrder = sortOrder++,
                        IsCover = photoId == request.CoverPhotoId || (request.CoverPhotoId == null && sortOrder == 1)
                    };
                    _context.Set<PostPhoto>().Add(postPhoto);
                }
            }

            await _context.SaveChangesAsync();
        }

        // Invalidate post list caches
        await InvalidatePostListCachesAsync();

        return (await GetPostByIdAsync(post.PostId))!;
    }

    public async Task<PostDto?> UpdatePostAsync(Guid postId, Guid userId, UpdatePostRequest request)
    {
        var post = await _context.Set<Post>()
            .Include(p => p.PostPhotos)
            .FirstOrDefaultAsync(p => p.PostId == postId && p.UserId == userId);

        if (post == null) return null;

        post.Title = request.Title;
        post.Description = request.Description;

        // Update photos if provided
        if (request.PhotoIds != null)
        {
            // Validate all photos belong to the post's cycle/inventory
            if (post.CycleId.HasValue)
            {
                var cyclePhotoIds = await _context.Set<Photo>()
                    .Where(p => p.StageRun.CycleId == post.CycleId && p.ProcessingStatus == PhotoProcessingStatus.Completed)
                    .Select(p => p.PhotoId)
                    .ToListAsync();

                if (!request.PhotoIds.All(id => cyclePhotoIds.Contains(Guid.Parse(id))))
                    throw new InvalidOperationException("Some photos don't belong to this cycle");
            }
            else if (post.InventoryId.HasValue)
            {
                var inventoryPhotoIds = await _context.Set<InventoryPhoto>()
                    .Where(ip => ip.InventoryId == post.InventoryId)
                    .Select(ip => ip.InventoryPhotoId)
                    .ToListAsync();

                if (!request.PhotoIds.All(id => inventoryPhotoIds.Contains(Guid.Parse(id))))
                    throw new InvalidOperationException("Some photos don't belong to this inventory");
            }

            // Remove old photo associations
            _context.Set<PostPhoto>().RemoveRange(post.PostPhotos);

            // Add new photo associations
            foreach (var photoId in request.PhotoIds)
            {
                post.PostPhotos.Add(new PostPhoto
                {
                    PostId = postId,
                    PhotoId = Guid.Parse(photoId)
                });
            }

            // Note: Cover photo is determined by the first photo in PostPhotos, not a separate field
        }

        await _context.SaveChangesAsync();

        // Invalidate caches
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{postId}");
        await InvalidatePostListCachesAsync();

        return await GetPostByIdAsync(postId);
    }

    public async Task<bool> DeletePostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Set<Post>()
            .FirstOrDefaultAsync(p => p.PostId == postId && p.UserId == userId);

        if (post == null) return false;

        _context.Set<Post>().Remove(post); // Uses soft delete
        await _context.SaveChangesAsync();

        // Invalidate caches
        await _cache.RemoveAsync($"{PostsCacheKeyPrefix}{postId}");
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
            await _notificationService.NotifyReplyAddedAsync(request.ParentCommentId.Value, comment.CommentId, userId);
        }
        else
        {
            // New comment notification to post owner
            await _notificationService.NotifyCommentAddedAsync(postId, comment.CommentId, userId);
        }

        // Reload with user
        var savedComment = await _context.Set<Comment>()
            .Include(c => c.User)
            .FirstAsync(c => c.CommentId == comment.CommentId);

        return MapCommentToDto(savedComment);
    }

    public async Task<CommentDto?> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request)
    {
        var comment = await _context.Set<Comment>()
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.CommentId == commentId && c.UserId == userId);

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
            .FirstOrDefaultAsync(c => c.CommentId == commentId && c.UserId == userId);

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
        var postType = post.PostType.ToString();

        // Get cover photo and photo count - different sources for cycle vs inventory posts
        string? coverPhotoUrl = null;
        string? coverPhotoThumbnailUrl = null;
        string? coverPhotoBlurHash = null;
        int photoCount = 0;

        // Get inventory-specific fields if this is an inventory post
        string? sourceType = null;
        IEnumerable<string> specimenNames = [];
        IEnumerable<string> sizeCategories = [];

        if (post.Inventory != null)
        {
            // Inventory post - use InventoryPhotos
            var inventoryPhotos = post.Inventory.InventoryPhotos
                .Where(p => p.ProcessingStatus == PhotoProcessingStatus.Completed)
                .OrderBy(p => p.SortOrder)
                .ToList();
            var coverPhoto = inventoryPhotos.FirstOrDefault(p => p.IsCover) ?? inventoryPhotos.FirstOrDefault();

            coverPhotoUrl = coverPhoto?.ThumbnailUrl ?? coverPhoto?.Url;
            coverPhotoThumbnailUrl = coverPhoto?.ThumbnailUrl;
            coverPhotoBlurHash = coverPhoto?.BlurHash;
            photoCount = inventoryPhotos.Count;

            sourceType = post.Inventory.SourceType.ToString();
            specimenNames = post.Inventory.InventorySpecimens
                .Select(s => s.Specimen?.CommonName ?? s.UserSpecimen?.CommonName ?? "")
                .Where(n => !string.IsNullOrEmpty(n))
                .ToList();
            sizeCategories = !string.IsNullOrEmpty(post.Inventory.SizeCategories)
                ? post.Inventory.SizeCategories.Split(',', StringSplitOptions.RemoveEmptyEntries)
                : [];
        }
        else
        {
            // Cycle post - use PostPhotos
            var coverPhoto = post.PostPhotos.FirstOrDefault(pp => pp.IsCover) ?? post.PostPhotos.FirstOrDefault();
            coverPhotoUrl = coverPhoto?.Photo?.ThumbnailUrl ?? coverPhoto?.Photo?.Url;
            coverPhotoThumbnailUrl = coverPhoto?.Photo?.ThumbnailUrl;
            coverPhotoBlurHash = coverPhoto?.Photo?.BlurHash;
            photoCount = post.PostPhotos.Count;
        }

        return new PostListDto
        {
            PostId = post.PostId,
            PostType = postType,
            FeedbackCategory = post.FeedbackCategory?.ToString(),
            Title = post.Title,
            Description = post.Description,
            PublishedDate = post.PublishedDate,
            VoteCount = post.VoteCount,
            CommentCount = post.CommentCount,
            CoverPhotoUrl = coverPhotoUrl,
            CoverPhotoThumbnailUrl = coverPhotoThumbnailUrl,
            CoverPhotoBlurHash = coverPhotoBlurHash,
            PhotoCount = photoCount,
            Author = new PostAuthorDto
            {
                UserId = post.User.UserId,
                Username = post.User.Username,
                DisplayName = null,
                AvatarUrl = post.User.AvatarUrl
            },
            SourceType = sourceType,
            SpecimenNames = specimenNames,
            SizeCategories = sizeCategories
        };
    }

    private static PostDto MapToDto(Post post)
    {
        var postType = post.PostType.ToString();

        CyclePreviewDto? cyclePreview = null;
        InventoryPreviewDto? inventoryPreview = null;

        if (post.Cycle != null)
        {
            var cycle = post.Cycle;
            var stageRuns = cycle.StageRuns.ToList();

            // Calculate elapsed days
            var endDate = cycle.EndDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var elapsedDays = endDate.DayNumber - cycle.StartDate.DayNumber;

            // Calculate total runtime hours from stage runs
            var totalRuntimeHours = stageRuns
                .Where(sr => sr.Status == StageRunStatus.Completed)
                .Sum(sr => ((long)sr.DurationDays * 24) + sr.DurationHours);

            // Get tumbler/barrel from most recent stage
            var mostRecentStage = stageRuns
                .OrderByDescending(sr => sr.StartDateTime)
                .FirstOrDefault();
            var mostRecentBarrel = mostRecentStage?.StageRunBarrels.FirstOrDefault()?.Barrel;

            // Get specimen names
            var specimenNames = cycle.CycleSpecimens
                .Select(cs => cs.Specimen?.CommonName ?? "")
                .Where(n => !string.IsNullOrEmpty(n))
                .ToList();

            // Get tumbler name (Brand + Model)
            string? tumblerName = null;
            if (mostRecentBarrel?.Tumbler != null)
            {
                tumblerName = !string.IsNullOrEmpty(mostRecentBarrel.Tumbler.Model)
                    ? $"{mostRecentBarrel.Tumbler.Brand} {mostRecentBarrel.Tumbler.Model}"
                    : mostRecentBarrel.Tumbler.Brand;
            }

            // Count photos across all stages
            var photoCount = stageRuns.Sum(sr => sr.Photos.Count());

            cyclePreview = new CyclePreviewDto
            {
                CycleId = cycle.CycleId,
                Name = cycle.Name,
                Status = cycle.Status.ToString(),
                StartDate = cycle.StartDate,
                EndDate = cycle.EndDate,
                DifficultyRating = cycle.DifficultyRating,
                FinalQuality = cycle.FinalQuality,
                StageCount = stageRuns.Count,
                ElapsedDays = elapsedDays,
                TotalRuntimeHours = checked((int)totalRuntimeHours),
                PhotoCount = photoCount,
                TumblerName = tumblerName,
                BarrelName = mostRecentBarrel?.Nickname,
                SpecimenNames = specimenNames
            };
        }
        else if (post.Inventory != null)
        {
            var inventory = post.Inventory;

            var specimenNames = inventory.InventorySpecimens
                .Select(s => s.Specimen?.CommonName ?? s.UserSpecimen?.CommonName ?? "")
                .Where(n => !string.IsNullOrEmpty(n))
                .ToList();

            var sizeCategories = !string.IsNullOrEmpty(inventory.SizeCategories)
                ? inventory.SizeCategories.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                : new List<string>();

            inventoryPreview = new InventoryPreviewDto
            {
                InventoryId = inventory.InventoryId,
                Name = inventory.Name,
                SourceType = inventory.SourceType.ToString(),
                SourceName = inventory.SourceName,
                SourceLocation = inventory.SourceLocation,
                AcquiredDate = inventory.AcquiredDate,
                SpecimenNames = specimenNames,
                SizeCategories = sizeCategories,
                PhotoCount = inventory.InventoryPhotos.Count
            };
        }

        // Get photos - different sources for cycle vs inventory posts
        IEnumerable<PostPhotoDto> photos;
        if (post.Inventory != null)
        {
            // Inventory post - use InventoryPhotos
            photos = post.Inventory.InventoryPhotos
                .Where(p => p.ProcessingStatus == PhotoProcessingStatus.Completed)
                .OrderBy(p => p.SortOrder)
                .Select(p => new PostPhotoDto
                {
                    PostId = post.PostId,
                    PhotoId = p.InventoryPhotoId,
                    Url = p.Url,
                    SortOrder = p.SortOrder,
                    IsCover = p.IsCover,
                    ThumbnailUrl = p.ThumbnailUrl,
                    MediumUrl = p.MediumUrl,
                    LargeUrl = p.LargeUrl,
                    BlurHash = p.BlurHash,
                    Width = p.Width,
                    Height = p.Height
                });
        }
        else
        {
            // Cycle post - use PostPhotos
            photos = post.PostPhotos.OrderBy(pp => pp.SortOrder).Select(pp => new PostPhotoDto
            {
                PostId = pp.PostId,
                PhotoId = pp.PhotoId,
                Url = pp.Photo.Url,
                SortOrder = pp.SortOrder,
                IsCover = pp.IsCover,
                ThumbnailUrl = pp.Photo.ThumbnailUrl,
                MediumUrl = pp.Photo.MediumUrl,
                LargeUrl = pp.Photo.LargeUrl,
                BlurHash = pp.Photo.BlurHash,
                Width = pp.Photo.Width,
                Height = pp.Photo.Height
            });
        }

        return new PostDto
        {
            PostId = post.PostId,
            UserId = post.UserId,
            CycleId = post.CycleId,
            InventoryId = post.InventoryId,
            PostType = postType,
            FeedbackCategory = post.FeedbackCategory?.ToString(),
            Title = post.Title,
            Description = post.Description,
            Status = post.Status.ToString(),
            PublishedDate = post.PublishedDate,
            VoteCount = post.VoteCount,
            CommentCount = post.CommentCount,
            Author = new PostAuthorDto
            {
                UserId = post.User.UserId,
                Username = post.User.Username,
                DisplayName = null,
                AvatarUrl = post.User.AvatarUrl
            },
            Cycle = cyclePreview,
            Inventory = inventoryPreview,
            Photos = photos
        };
    }

    private static CommentDto MapCommentToDto(Comment comment)
    {
        return new CommentDto
        {
            CommentId = comment.CommentId,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            Content = comment.Content,
            IsEdited = comment.IsEdited,
            EditedDate = comment.EditedDate,
            DateCreated = comment.DateCreated,
            Author = new CommentAuthorDto
            {
                UserId = comment.User.UserId,
                Username = comment.User.Username,
                DisplayName = null,
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
        
        // Invalidate feedback caches for all categories and sort orders
        var feedbackCategories = new[] { "all", "general", "cycles", "inventory", "tumblers", "gallery", "materials", "specimens", "faq", "settings" };
        var sortOrders = new[] { "newest", "votes", "comments" };
        
        foreach (var category in feedbackCategories)
        {
            foreach (var sort in sortOrders)
            {
                await _cache.RemoveAsync($"{PostsListCacheKey}feedback:{category}:{sort}");
            }
        }
    }

    #endregion
}
