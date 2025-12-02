namespace MyUglyRocks.Abstractions.Interfaces;

public interface IEmailService
{
    // Authentication emails
    Task SendVerificationEmailAsync(string to, string userName, string verificationUrl, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string to, string userName, string resetUrl, CancellationToken cancellationToken = default);
    Task SendPasswordChangedEmailAsync(string to, string userName, DateTime changedAt, CancellationToken cancellationToken = default);
    Task SendWelcomeEmailAsync(string to, string userName, CancellationToken cancellationToken = default);

    // Notification emails
    Task SendStageReminderEmailAsync(string to, string userName, string cycleName, string stageName, string tumblerName, DateTime startedAt, TimeSpan duration, string cycleUrl, CancellationToken cancellationToken = default);
    Task SendCommentNotificationEmailAsync(string to, string userName, string commenterName, string postTitle, string commentPreview, string postUrl, CancellationToken cancellationToken = default);
    Task SendReplyNotificationEmailAsync(string to, string userName, string replierName, string originalComment, string replyPreview, string postTitle, string commentUrl, CancellationToken cancellationToken = default);
    Task SendFirstVoteNotificationEmailAsync(string to, string userName, string voterName, string postTitle, string postUrl, CancellationToken cancellationToken = default);
    Task SendMilestoneNotificationEmailAsync(string to, string userName, string postTitle, int voteCount, string postUrl, CancellationToken cancellationToken = default);

    // Admin emails
    Task SendCommentRemovedEmailAsync(string to, string userName, string postTitle, string commentPreview, string reason, CancellationToken cancellationToken = default);
    Task SendAccountWarningEmailAsync(string to, string userName, string reason, string warningCount, CancellationToken cancellationToken = default);
    Task SendAccountSuspendedEmailAsync(string to, string userName, string reason, string duration, CancellationToken cancellationToken = default);
}
