using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Abstractions.Helpers;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    #region Posts

    /// <summary>
    /// Get public gallery posts
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PostListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PostListDto>>> GetPosts(
        [FromQuery] string? sort = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
    {
        // Validate sort parameter against whitelist
        sort = PaginationHelper.ValidatePostSort(sort);

        // Validate pagination parameters to prevent resource exhaustion
        skip = PaginationHelper.ClampSkip(skip);
        take = PaginationHelper.ClampTake(take);

        var posts = await _postService.GetPostsAsync(sort, skip, take);
        return Ok(posts);
    }

    /// <summary>
    /// Get feedback posts with optional category filter
    /// </summary>
    [HttpGet("feedback")]
    [ProducesResponseType(typeof(IEnumerable<PostListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PostListDto>>> GetFeedbackPosts(
        [FromQuery] string? category = null,
        [FromQuery] string? sort = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
    {
        // Validate sort parameter against whitelist
        sort = PaginationHelper.ValidatePostSort(sort);

        // Validate pagination parameters to prevent resource exhaustion
        skip = PaginationHelper.ClampSkip(skip);
        take = PaginationHelper.ClampTake(take);

        var posts = await _postService.GetFeedbackPostsAsync(category, sort, skip, take);
        return Ok(posts);
    }

    /// <summary>
    /// Get post by ID
    /// </summary>
    [HttpGet("{postId:guid}")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostDto>> GetPost(Guid postId)
    {
        var post = await _postService.GetPostByIdAsync(postId, GetCurrentUserId());
        if (post == null) return NotFound();
        return Ok(post);
    }

    /// <summary>
    /// Get posts by username
    /// </summary>
    [HttpGet("user/{username}")]
    [ProducesResponseType(typeof(IEnumerable<PostListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PostListDto>>> GetUserPosts(
        string username,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
    {
        // Validate username format
        if (!PaginationHelper.IsValidUsername(username, out var usernameError))
            return BadRequest(new { error = usernameError });

        // Validate pagination parameters to prevent resource exhaustion
        skip = PaginationHelper.ClampSkip(skip);
        take = PaginationHelper.ClampTake(take);

        var posts = await _postService.GetUserPostsAsync(username, skip, take);
        return Ok(posts);
    }

    /// <summary>
    /// Create a new post from a completed cycle
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PostDto>> CreatePost([FromBody] CreatePostRequest request, [FromServices] ILogger<PostsController> logger)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            logger.LogInformation("Creating post for cycle {CycleId} with {PhotoCount} photos", request.CycleId, request.PhotoIds.Count);
            var post = await _postService.CreatePostAsync(userId.Value, request);
            return CreatedAtAction(nameof(GetPost), new { postId = post.PostId }, post);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation while creating post for cycle {CycleId}", request.CycleId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating post for cycle {CycleId}", request.CycleId);
            throw;
        }
    }

    /// <summary>
    /// Update a post
    /// </summary>
    [HttpPut("{postId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PostDto>> UpdatePost(Guid postId, [FromBody] UpdatePostRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var post = await _postService.UpdatePostAsync(postId, userId.Value, request);
        if (post == null) return NotFound();
        return Ok(post);
    }

    /// <summary>
    /// Delete a post
    /// </summary>
    [HttpDelete("{postId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeletePost(Guid postId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var deleted = await _postService.DeletePostAsync(postId, userId.Value);
        if (!deleted) return NotFound();
        return NoContent();
    }

    #endregion

    #region Votes

    /// <summary>
    /// Get vote count for a post
    /// </summary>
    [HttpGet("{postId:guid}/votes")]
    [ProducesResponseType(typeof(VoteCountDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<VoteCountDto>> GetVotes(Guid postId)
    {
        var voteCount = await _postService.GetVoteCountAsync(postId, GetCurrentUserId());
        return Ok(voteCount);
    }

    /// <summary>
    /// Add a vote to a post ("Ugly Rocks!")
    /// </summary>
    [HttpPost("{postId:guid}/vote")]
    [Authorize]
    [ProducesResponseType(typeof(VoteDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<VoteDto>> AddVote(Guid postId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var vote = await _postService.AddVoteAsync(postId, userId.Value);
        if (vote == null) return Conflict(new { message = "Already voted" });
        return StatusCode(StatusCodes.Status201Created, vote);
    }

    /// <summary>
    /// Remove a vote from a post
    /// </summary>
    [HttpDelete("{postId:guid}/vote")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RemoveVote(Guid postId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var removed = await _postService.RemoveVoteAsync(postId, userId.Value);
        if (!removed) return NotFound();
        return NoContent();
    }

    #endregion

    #region Comments

    /// <summary>
    /// Get comments for a post
    /// </summary>
    [HttpGet("{postId:guid}/comments")]
    [ProducesResponseType(typeof(IEnumerable<CommentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(Guid postId)
    {
        var comments = await _postService.GetCommentsAsync(postId);
        return Ok(comments);
    }

    /// <summary>
    /// Add a comment to a post
    /// </summary>
    [HttpPost("{postId:guid}/comments")]
    [Authorize]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CommentDto>> AddComment(Guid postId, [FromBody] CreateCommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var comment = await _postService.AddCommentAsync(postId, userId.Value, request);
        return StatusCode(StatusCodes.Status201Created, comment);
    }

    /// <summary>
    /// Update a comment
    /// </summary>
    [HttpPut("comments/{commentId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CommentDto>> UpdateComment(Guid commentId, [FromBody] UpdateCommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var comment = await _postService.UpdateCommentAsync(commentId, userId.Value, request);
        if (comment == null) return NotFound();
        return Ok(comment);
    }

    /// <summary>
    /// Delete a comment
    /// </summary>
    [HttpDelete("comments/{commentId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var deleted = await _postService.DeleteCommentAsync(commentId, userId.Value);
        if (!deleted) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Report a comment
    /// </summary>
    [HttpPost("comments/{commentId:guid}/report")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReportComment(Guid commentId, [FromBody] ReportCommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var reported = await _postService.ReportCommentAsync(commentId, userId.Value, request);
        if (!reported) return NotFound();
        return NoContent();
    }

    #endregion
}
