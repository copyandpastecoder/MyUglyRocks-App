using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IPostService
{
    // Post operations
    Task<IEnumerable<PostListDto>> GetPostsAsync(string? sortBy = null, int skip = 0, int take = 20);
    Task<IEnumerable<PostListDto>> GetFeedbackPostsAsync(string? category = null, string? sortBy = null, int skip = 0, int take = 20);
    Task<PostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null);
    Task<IEnumerable<PostListDto>> GetUserPostsAsync(string username, int skip = 0, int take = 20);
    Task<PostDto> CreatePostAsync(Guid userId, CreatePostRequest request);
    Task<PostDto?> UpdatePostAsync(Guid postId, Guid userId, UpdatePostRequest request);
    Task<bool> DeletePostAsync(Guid postId, Guid userId);

    // Vote operations
    Task<VoteCountDto> GetVoteCountAsync(Guid postId, Guid? userId = null);
    Task<VoteDto?> AddVoteAsync(Guid postId, Guid userId);
    Task<bool> RemoveVoteAsync(Guid postId, Guid userId);

    // Comment operations
    Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid postId);
    Task<CommentDto> AddCommentAsync(Guid postId, Guid userId, CreateCommentRequest request);
    Task<CommentDto?> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId);
    Task<bool> ReportCommentAsync(Guid commentId, Guid userId, ReportCommentRequest request);
}
