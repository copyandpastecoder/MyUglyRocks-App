using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Configuration;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;
    private readonly EmailSettings _emailSettings;

    public NotificationService(
        AppDbContext context,
        IBackgroundJobClient backgroundJobs,
        IEmailService emailService,
        IOptions<EmailSettings> emailSettings,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _backgroundJobs = backgroundJobs;
        _emailService = emailService;
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    #region Stage Reminders

    public Task ScheduleStageReminderAsync(Guid stageId, DateTime reminderTime, CancellationToken cancellationToken = default)
    {
        var delay = reminderTime - DateTime.UtcNow;
        if (delay <= TimeSpan.Zero)
        {
            // If reminder time has passed, send immediately
            _backgroundJobs.Enqueue<NotificationService>(s => s.SendStageReminderAsync(stageId, CancellationToken.None));
        }
        else
        {
            // Schedule for future
            _backgroundJobs.Schedule<NotificationService>(
                s => s.SendStageReminderAsync(stageId, CancellationToken.None),
                delay);
        }

        _logger.LogInformation("Scheduled stage reminder for stage {StageId} at {ReminderTime}", stageId, reminderTime);
        return Task.CompletedTask;
    }

    public Task CancelStageReminderAsync(Guid stageId, CancellationToken cancellationToken = default)
    {
        // Note: Hangfire doesn't easily support canceling by custom ID
        // A more robust solution would store job IDs in the database
        // For now, we rely on the job checking if it should still send
        _logger.LogInformation("Stage reminder cancellation requested for stage {StageId}", stageId);
        return Task.CompletedTask;
    }

    public async Task SendStageReminderAsync(Guid stageId, CancellationToken cancellationToken)
    {
        var stage = await _context.StageRuns
            .Include(s => s.StageRunBarrels)
                .ThenInclude(srb => srb.Barrel)
                    .ThenInclude(b => b.Tumbler)
            .Include(s => s.Cycle)
                .ThenInclude(c => c.User)
                    .ThenInclude(u => u.Settings)
            .FirstOrDefaultAsync(s => s.Id == stageId, cancellationToken);

        if (stage == null)
        {
            _logger.LogWarning("Stage {StageId} not found for reminder", stageId);
            return;
        }

        // Check if reminder already sent
        if (stage.DateReminderSent.HasValue)
        {
            _logger.LogInformation("Reminder already sent for stage {StageId}", stageId);
            return;
        }

        // Check if stage is still active
        if (stage.Status != Core.Entities.StageRunStatus.Active)
        {
            _logger.LogInformation("Stage {StageId} is no longer active, skipping reminder", stageId);
            return;
        }

        // Check user notification preferences
        var user = stage.Cycle.User;
        var settings = user.Settings;
        if (settings != null && !settings.NotifyStageReminders)
        {
            _logger.LogInformation("User {UserId} has stage reminders disabled", user.Id);
            return;
        }

        // Send the email
        try
        {
            var emailService = _emailService;
            var cycleUrl = $"{_emailSettings.BaseUrl}/cycles/{stage.CycleId}";
            var duration = DateTime.UtcNow - stage.StartDateTime;

            var tumbler = stage.StageRunBarrels.FirstOrDefault()?.Barrel?.Tumbler;
            var tumblerName = tumbler != null
                ? $"{tumbler.Brand} {tumbler.Model}".Trim()
                : "Unknown Tumbler";

            await emailService.SendStageReminderEmailAsync(
                user.Email,
                user.DisplayName ?? user.Username,
                stage.Cycle.Name,
                stage.StageName,
                tumblerName,
                stage.StartDateTime,
                duration,
                cycleUrl,
                cancellationToken);

            // Mark reminder as sent
            stage.DateReminderSent = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Stage reminder sent for stage {StageId} to user {UserId}", stageId, user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send stage reminder for stage {StageId}", stageId);
            throw;
        }
    }

    #endregion

    #region Comment Notifications

    public Task NotifyCommentAddedAsync(Guid postId, Guid commentId, Guid commenterId, CancellationToken cancellationToken = default)
    {
        _backgroundJobs.Enqueue<NotificationService>(s => s.SendCommentNotificationAsync(postId, commentId, commenterId, CancellationToken.None));
        return Task.CompletedTask;
    }

    public async Task SendCommentNotificationAsync(Guid postId, Guid commentId, Guid commenterId, CancellationToken cancellationToken)
    {
        var post = await _context.Posts
            .Include(p => p.User)
                .ThenInclude(u => u.Settings)
            .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

        if (post == null)
        {
            _logger.LogWarning("Post {PostId} not found for comment notification", postId);
            return;
        }

        // Don't notify if user commented on their own post
        if (post.UserId == commenterId)
        {
            _logger.LogInformation("User commented on their own post, skipping notification");
            return;
        }

        // Check user notification preferences
        var postOwner = post.User;
        var settings = postOwner.Settings;
        if (settings != null && !settings.NotifyComments)
        {
            _logger.LogInformation("User {UserId} has comment notifications disabled", postOwner.Id);
            return;
        }

        var comment = await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == commentId, cancellationToken);

        if (comment == null)
        {
            _logger.LogWarning("Comment {CommentId} not found", commentId);
            return;
        }

        try
        {
            var emailService = _emailService;
            var postUrl = $"{_emailSettings.BaseUrl}/gallery/{postId}#comment-{commentId}";

            await emailService.SendCommentNotificationEmailAsync(
                postOwner.Email,
                postOwner.DisplayName ?? postOwner.Username,
                comment.User.DisplayName ?? comment.User.Username,
                post.Title,
                comment.Content,
                postUrl,
                cancellationToken);

            _logger.LogInformation("Comment notification sent for comment {CommentId} to user {UserId}", commentId, postOwner.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send comment notification for comment {CommentId}", commentId);
            throw;
        }
    }

    #endregion

    #region Reply Notifications

    public Task NotifyReplyAddedAsync(Guid parentCommentId, Guid replyId, Guid replierId, CancellationToken cancellationToken = default)
    {
        _backgroundJobs.Enqueue<NotificationService>(s => s.SendReplyNotificationAsync(parentCommentId, replyId, replierId, CancellationToken.None));
        return Task.CompletedTask;
    }

    public async Task SendReplyNotificationAsync(Guid parentCommentId, Guid replyId, Guid replierId, CancellationToken cancellationToken)
    {
        var parentComment = await _context.Comments
            .Include(c => c.User)
                .ThenInclude(u => u.Settings)
            .Include(c => c.Post)
            .FirstOrDefaultAsync(c => c.Id == parentCommentId, cancellationToken);

        if (parentComment == null)
        {
            _logger.LogWarning("Parent comment {CommentId} not found for reply notification", parentCommentId);
            return;
        }

        // Don't notify if user replied to their own comment
        if (parentComment.UserId == replierId)
        {
            _logger.LogInformation("User replied to their own comment, skipping notification");
            return;
        }

        // Check user notification preferences
        var commentOwner = parentComment.User;
        var settings = commentOwner.Settings;
        if (settings != null && !settings.NotifyReplies)
        {
            _logger.LogInformation("User {UserId} has reply notifications disabled", commentOwner.Id);
            return;
        }

        var reply = await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == replyId, cancellationToken);

        if (reply == null)
        {
            _logger.LogWarning("Reply {ReplyId} not found", replyId);
            return;
        }

        try
        {
            var emailService = _emailService;
            var commentUrl = $"{_emailSettings.BaseUrl}/gallery/{parentComment.PostId}#comment-{replyId}";

            await emailService.SendReplyNotificationEmailAsync(
                commentOwner.Email,
                commentOwner.DisplayName ?? commentOwner.Username,
                reply.User.DisplayName ?? reply.User.Username,
                parentComment.Content,
                reply.Content,
                parentComment.Post.Title,
                commentUrl,
                cancellationToken);

            _logger.LogInformation("Reply notification sent for reply {ReplyId} to user {UserId}", replyId, commentOwner.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send reply notification for reply {ReplyId}", replyId);
            throw;
        }
    }

    #endregion

    #region Vote Notifications

    public Task NotifyVoteAddedAsync(Guid postId, Guid voterId, CancellationToken cancellationToken = default)
    {
        _backgroundJobs.Enqueue<NotificationService>(s => s.SendFirstVoteNotificationAsync(postId, voterId, CancellationToken.None));
        return Task.CompletedTask;
    }

    public async Task SendFirstVoteNotificationAsync(Guid postId, Guid voterId, CancellationToken cancellationToken)
    {
        var post = await _context.Posts
            .Include(p => p.User)
                .ThenInclude(u => u.Settings)
            .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

        if (post == null)
        {
            _logger.LogWarning("Post {PostId} not found for vote notification", postId);
            return;
        }

        // Only notify on first vote
        if (post.VoteCount != 1)
        {
            _logger.LogInformation("Post {PostId} has {VoteCount} votes, skipping first vote notification", postId, post.VoteCount);
            return;
        }

        // Don't notify if user voted on their own post
        if (post.UserId == voterId)
        {
            _logger.LogInformation("User voted on their own post, skipping notification");
            return;
        }

        // Check user notification preferences
        var postOwner = post.User;
        var settings = postOwner.Settings;
        if (settings != null && !settings.NotifyUglyRocks)
        {
            _logger.LogInformation("User {UserId} has vote notifications disabled", postOwner.Id);
            return;
        }

        var voter = await _context.Users.FindAsync(new object[] { voterId }, cancellationToken);
        if (voter == null)
        {
            _logger.LogWarning("Voter {VoterId} not found", voterId);
            return;
        }

        try
        {
            var emailService = _emailService;
            var postUrl = $"{_emailSettings.BaseUrl}/gallery/{postId}";

            await emailService.SendFirstVoteNotificationEmailAsync(
                postOwner.Email,
                postOwner.DisplayName ?? postOwner.Username,
                voter.DisplayName ?? voter.Username,
                post.Title,
                postUrl,
                cancellationToken);

            _logger.LogInformation("First vote notification sent for post {PostId} to user {UserId}", postId, postOwner.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send first vote notification for post {PostId}", postId);
            throw;
        }
    }

    #endregion

    #region Milestone Notifications

    public Task CheckVoteMilestonesAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        _backgroundJobs.Enqueue<NotificationService>(s => s.SendMilestoneNotificationIfNeededAsync(postId, CancellationToken.None));
        return Task.CompletedTask;
    }

    public async Task SendMilestoneNotificationIfNeededAsync(Guid postId, CancellationToken cancellationToken)
    {
        var milestones = new[] { 10, 25, 50, 100, 250, 500, 1000 };

        var post = await _context.Posts
            .Include(p => p.User)
                .ThenInclude(u => u.Settings)
            .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

        if (post == null)
        {
            _logger.LogWarning("Post {PostId} not found for milestone check", postId);
            return;
        }

        // Check if current vote count matches a milestone
        if (!milestones.Contains(post.VoteCount))
        {
            return;
        }

        // Check user notification preferences
        var postOwner = post.User;
        var settings = postOwner.Settings;
        if (settings != null && !settings.NotifyUglyRocks)
        {
            _logger.LogInformation("User {UserId} has vote notifications disabled", postOwner.Id);
            return;
        }

        try
        {
            var emailService = _emailService;
            var postUrl = $"{_emailSettings.BaseUrl}/gallery/{postId}";

            await emailService.SendMilestoneNotificationEmailAsync(
                postOwner.Email,
                postOwner.DisplayName ?? postOwner.Username,
                post.Title,
                post.VoteCount,
                postUrl,
                cancellationToken);

            _logger.LogInformation("Milestone notification sent for post {PostId} at {VoteCount} votes", postId, post.VoteCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send milestone notification for post {PostId}", postId);
            throw;
        }
    }

    #endregion

}
