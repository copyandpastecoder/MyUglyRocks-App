namespace MyUglyRocks.Abstractions.Interfaces;

public interface INotificationService
{
    // Schedule stage reminder
    Task ScheduleStageReminderAsync(Guid stageId, DateTime reminderTime, CancellationToken cancellationToken = default);
    Task CancelStageReminderAsync(Guid stageId, CancellationToken cancellationToken = default);

    // Immediate notifications
    Task NotifyCommentAddedAsync(Guid postId, Guid commentId, Guid commenterId, CancellationToken cancellationToken = default);
    Task NotifyReplyAddedAsync(Guid parentCommentId, Guid replyId, Guid replierId, CancellationToken cancellationToken = default);
    Task NotifyVoteAddedAsync(Guid postId, Guid voterId, CancellationToken cancellationToken = default);

    // Milestone checks (called after vote added)
    Task CheckVoteMilestonesAsync(Guid postId, CancellationToken cancellationToken = default);
}
