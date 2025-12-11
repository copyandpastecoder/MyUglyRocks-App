using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Configuration;
using Resend;

namespace MyUglyRocks.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IResend resend,
        IOptions<EmailSettings> settings,
        ILogger<EmailService> logger)
    {
        _resend = resend;
        _settings = settings.Value;
        _logger = logger;
    }

    private async Task SendEmailAsync(string to, string subject, string htmlContent, string textContent, CancellationToken cancellationToken)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Email sending disabled. Would have sent: {Subject} to {To}", subject, PiiMaskingHelper.MaskEmail(to));
            return;
        }

        try
        {
            var message = new EmailMessage
            {
                From = $"{_settings.FromName} <{_settings.FromEmail}>",
                To = { to },
                Subject = subject,
                HtmlBody = htmlContent,
                TextBody = textContent
            };

            await _resend.EmailSendAsync(message, cancellationToken);
            _logger.LogInformation("Email sent successfully: {Subject} to {To}", subject, PiiMaskingHelper.MaskEmail(to));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email: {Subject} to {To}", subject, PiiMaskingHelper.MaskEmail(to));
            throw;
        }
    }

    #region Authentication Emails

    public async Task SendVerificationEmailAsync(string to, string userName, string verificationUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Verify your MyUglyRocks account";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            @"<p>Welcome to MyUglyRocks!</p>
              <p>Please verify your email address to complete your registration and start tracking your rock tumbling journey.</p>",
            "Verify Email Address",
            verificationUrl,
            "<p>This link expires in 24 hours.</p><p>Didn't create an account? You can safely ignore this email.</p>"
        );
        var text = $@"Hi {userName},

Welcome to MyUglyRocks!

Please verify your email address to complete your registration:
{verificationUrl}

This link expires in 24 hours.

Didn't create an account? You can safely ignore this email.

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendPasswordResetEmailAsync(string to, string userName, string resetUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Reset your MyUglyRocks password";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            "<p>We received a request to reset your password.</p>",
            "Reset Password",
            resetUrl,
            @"<p>This link expires in 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email. Your password won't be changed until you click the link above and create a new one.</p>"
        );
        var text = $@"Hi {userName},

We received a request to reset your password.

Reset your password here:
{resetUrl}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendPasswordChangedEmailAsync(string to, string userName, DateTime changedAt, CancellationToken cancellationToken = default)
    {
        var subject = "Your MyUglyRocks password was changed";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>Your password was successfully changed on {changedAt:MMMM d, yyyy} at {changedAt:h:mm tt} UTC.</p>
               <p>If you made this change, no further action is needed.</p>
               <hr />
               <p><strong>Didn't make this change?</strong></p>
               <p>Someone may have access to your account. Please reset your password immediately and contact us at support@myuglyrocks.com.</p>",
            "Reset Password Now",
            $"{_settings.BaseUrl}/forgot-password",
            null
        );
        var text = $@"Hi {userName},

Your password was successfully changed on {changedAt:MMMM d, yyyy} at {changedAt:h:mm tt} UTC.

If you made this change, no further action is needed.

---
Didn't make this change?

Someone may have access to your account. Please:
1. Reset your password immediately: {_settings.BaseUrl}/forgot-password
2. Contact us at support@myuglyrocks.com

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(string to, string userName, CancellationToken cancellationToken = default)
    {
        var subject = "Welcome to MyUglyRocks! Here's how to get started";
        var html = BuildEmailTemplate(
            $"Welcome to MyUglyRocks, {userName}!",
            $@"<p>You're officially part of our rock tumbling community. Here's how to get the most out of your experience:</p>
               <hr />
               <p><strong>Step 1: Add Your Tumbler</strong><br />
               Tell us about your equipment so we can track which tumbler you use for each batch.</p>
               <p><strong>Step 2: Start Your First Cycle</strong><br />
               Create a cycle for your current batch of rocks. Add stages as you progress through coarse, medium, and polish.</p>
               <p><strong>Step 3: Document Your Progress</strong><br />
               Upload photos at each stage. When you're done, share your results with the community!</p>
               <hr />
               <p><strong>Helpful Resources:</strong></p>
               <ul>
                 <li><a href=""{_settings.BaseUrl}/learn/specimens"">Browse Specimens</a> - Learn about different rock types and hardness</li>
                 <li><a href=""{_settings.BaseUrl}/learn/materials"">View Materials</a> - Explore grits, polishes, and additives</li>
                 <li><a href=""{_settings.BaseUrl}/gallery"">Explore Gallery</a> - See what others have created</li>
               </ul>",
            "Go to Dashboard",
            $"{_settings.BaseUrl}/dashboard",
            "<p>Happy tumbling!<br />The MyUglyRocks Team</p>"
        );
        var text = $@"Welcome to MyUglyRocks, {userName}!

You're officially part of our rock tumbling community.

---
Step 1: Add Your Tumbler
Tell us about your equipment so we can track which tumbler you use for each batch.

Step 2: Start Your First Cycle
Create a cycle for your current batch of rocks. Add stages as you progress through coarse, medium, and polish.

Step 3: Document Your Progress
Upload photos at each stage. When you're done, share your results with the community!

---
Helpful Resources:
- Browse Specimens: {_settings.BaseUrl}/learn/specimens
- View Materials: {_settings.BaseUrl}/learn/materials
- Explore Gallery: {_settings.BaseUrl}/gallery

Go to Dashboard: {_settings.BaseUrl}/dashboard

Happy tumbling!
The MyUglyRocks Team

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    #endregion

    #region Notification Emails

    public async Task SendStageReminderEmailAsync(string to, string userName, string cycleName, string stageName, string tumblerName, DateTime startedAt, TimeSpan duration, string cycleUrl, CancellationToken cancellationToken = default)
    {
        var subject = $"Your \"{stageName}\" stage is ready to check!";
        var durationStr = FormatDuration(duration);
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>Your tumbler might be ready for the next step!</p>
               <div style=""background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;"">
                 <p><strong>Cycle:</strong> {cycleName}</p>
                 <p><strong>Stage:</strong> {stageName}</p>
                 <p><strong>Tumbler:</strong> {tumblerName}</p>
                 <p><strong>Started:</strong> {startedAt:MMMM d, yyyy} at {startedAt:h:mm tt}</p>
                 <p><strong>Running:</strong> {durationStr}</p>
               </div>
               <p>Time to check your rocks! Open the barrel, rinse them off, and see how they're progressing.</p>
               <hr />
               <p><strong>Quick tips:</strong></p>
               <ul>
                 <li>Check for consistent rounding and smooth surfaces</li>
                 <li>Look for any chips or cracks that might have formed</li>
                 <li>If rocks aren't ready, add more grit and run longer</li>
               </ul>",
            "View This Cycle",
            cycleUrl,
            null
        );
        var text = $@"Hi {userName},

Your tumbler might be ready for the next step!

Cycle: {cycleName}
Stage: {stageName}
Tumbler: {tumblerName}
Started: {startedAt:MMMM d, yyyy} at {startedAt:h:mm tt}
Running: {durationStr}

Time to check your rocks! Open the barrel, rinse them off, and see how they're progressing.

View this cycle: {cycleUrl}

Quick tips:
- Check for consistent rounding and smooth surfaces
- Look for any chips or cracks that might have formed
- If rocks aren't ready, add more grit and run longer

---
{GetFooterText()}
Manage notifications in Settings";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendCommentNotificationEmailAsync(string to, string userName, string commenterName, string postTitle, string commentPreview, string postUrl, CancellationToken cancellationToken = default)
    {
        var subject = $"{commenterName} commented on your post";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>{commenterName} commented on your post:</p>
               <div style=""background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;"">
                 <p><strong>{commenterName}</strong></p>
                 <p>""{TruncateText(commentPreview, 200)}""</p>
                 <p style=""color: #6b7280; font-size: 14px;"">On: {postTitle}</p>
               </div>",
            "View Comment",
            postUrl,
            null
        );
        var text = $@"Hi {userName},

{commenterName} commented on your post:

""{TruncateText(commentPreview, 200)}""

On: {postTitle}

View comment: {postUrl}

---
{GetFooterText()}
Manage notifications in Settings";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendReplyNotificationEmailAsync(string to, string userName, string replierName, string originalComment, string replyPreview, string postTitle, string commentUrl, CancellationToken cancellationToken = default)
    {
        var subject = $"{replierName} replied to your comment";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>{replierName} replied to your comment on ""{postTitle}"":</p>
               <div style=""background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;"">
                 <p style=""color: #6b7280; font-size: 14px;"">Your comment:</p>
                 <p>""{TruncateText(originalComment, 100)}""</p>
                 <hr style=""border-color: #e5e7eb;"" />
                 <p><strong>{replierName} replied:</strong></p>
                 <p>""{TruncateText(replyPreview, 200)}""</p>
               </div>",
            "View Reply",
            commentUrl,
            null
        );
        var text = $@"Hi {userName},

{replierName} replied to your comment on ""{postTitle}"":

Your comment:
""{TruncateText(originalComment, 100)}""

{replierName} replied:
""{TruncateText(replyPreview, 200)}""

View reply: {commentUrl}

---
{GetFooterText()}
Manage notifications in Settings";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendFirstVoteNotificationEmailAsync(string to, string userName, string voterName, string postTitle, string postUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Someone gave your rocks some love!";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>Congratulations!</p>
               <p>{voterName} just gave your post an ""Ugly Rocks"" - our way of saying your tumbling results are awesome!</p>
               <div style=""background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;"">
                 <p style=""font-size: 32px;"">🪨</p>
                 <p><strong>""{postTitle}""</strong></p>
                 <p>1 Ugly Rock</p>
               </div>
               <p>Keep sharing your results - the community loves seeing great polishes!</p>",
            "View Your Post",
            postUrl,
            null
        );
        var text = $@"Hi {userName},

Congratulations!

{voterName} just gave your post an ""Ugly Rocks"" - our way of saying your tumbling results are awesome!

""{postTitle}""
1 Ugly Rock

Keep sharing your results - the community loves seeing great polishes!

View your post: {postUrl}

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendMilestoneNotificationEmailAsync(string to, string userName, string postTitle, int voteCount, string postUrl, CancellationToken cancellationToken = default)
    {
        var subject = $"Your post hit {voteCount} Ugly Rocks!";
        var rockEmojis = string.Join("", Enumerable.Repeat("🪨", Math.Min(voteCount, 10)));
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>Your post is getting popular!</p>
               <div style=""background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;"">
                 <p style=""font-size: 24px;"">{rockEmojis}</p>
                 <p><strong>""{postTitle}""</strong></p>
                 <p>{voteCount} Ugly Rocks!</p>
               </div>
               <p>The community is loving your work. Thanks for sharing!</p>",
            "View Your Post",
            postUrl,
            null
        );
        var text = $@"Hi {userName},

Your post is getting popular!

""{postTitle}""
{voteCount} Ugly Rocks!

The community is loving your work. Thanks for sharing!

View your post: {postUrl}

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    #endregion

    #region Admin Emails

    public async Task SendCommentRemovedEmailAsync(string to, string userName, string postTitle, string commentPreview, string reason, CancellationToken cancellationToken = default)
    {
        var subject = "Your comment was removed from MyUglyRocks";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>Your comment on ""{postTitle}"" was removed by a moderator.</p>
               <div style=""background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;"">
                 <p><strong>Your comment:</strong></p>
                 <p>""{TruncateText(commentPreview, 200)}""</p>
                 <p><strong>Reason:</strong> {reason}</p>
               </div>
               <p>Please review our Community Guidelines to ensure your future comments meet our standards.</p>",
            "View Community Guidelines",
            $"{_settings.BaseUrl}/guidelines",
            "<p>If you believe this was a mistake, please contact us at support@myuglyrocks.com.</p>"
        );
        var text = $@"Hi {userName},

Your comment on ""{postTitle}"" was removed by a moderator.

Your comment:
""{TruncateText(commentPreview, 200)}""

Reason: {reason}

Please review our Community Guidelines to ensure your future comments meet our standards.

If you believe this was a mistake, please contact us at support@myuglyrocks.com.

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendAccountWarningEmailAsync(string to, string userName, string reason, string warningCount, CancellationToken cancellationToken = default)
    {
        var subject = "Warning: Your MyUglyRocks account";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>This is a {warningCount} regarding your account.</p>
               <div style=""background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;"">
                 <p><strong>Reason:</strong> {reason}</p>
               </div>
               <p>Please review our Community Guidelines. Repeated violations may result in account suspension.</p>",
            "View Community Guidelines",
            $"{_settings.BaseUrl}/guidelines",
            "<p>If you have questions, please contact support@myuglyrocks.com.</p>"
        );
        var text = $@"Hi {userName},

This is a {warningCount} regarding your account.

Reason: {reason}

Please review our Community Guidelines. Repeated violations may result in account suspension.

If you have questions, please contact support@myuglyrocks.com.

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    public async Task SendAccountSuspendedEmailAsync(string to, string userName, string reason, string duration, CancellationToken cancellationToken = default)
    {
        var subject = "Your MyUglyRocks account has been suspended";
        var html = BuildEmailTemplate(
            $"Hi {userName},",
            $@"<p>Your MyUglyRocks account has been suspended {duration}.</p>
               <div style=""background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;"">
                 <p><strong>Reason:</strong> {reason}</p>
               </div>
               <p>During suspension:</p>
               <ul>
                 <li>You cannot log in to your account</li>
                 <li>Your public posts are hidden from the gallery</li>
                 <li>Your data remains safe and will be restored after suspension</li>
               </ul>",
            null,
            null,
            "<p>If you believe this was a mistake, you can appeal by emailing support@myuglyrocks.com.</p>"
        );
        var text = $@"Hi {userName},

Your MyUglyRocks account has been suspended {duration}.

Reason: {reason}

During suspension:
- You cannot log in to your account
- Your public posts are hidden from the gallery
- Your data remains safe and will be restored after suspension

If you believe this was a mistake, you can appeal by emailing support@myuglyrocks.com.

---
{GetFooterText()}";

        await SendEmailAsync(to, subject, html, text, cancellationToken);
    }

    #endregion

    #region Helpers

    private string BuildEmailTemplate(string greeting, string body, string? ctaText, string? ctaUrl, string? footer)
    {
        var ctaButton = !string.IsNullOrEmpty(ctaText) && !string.IsNullOrEmpty(ctaUrl)
            ? $@"<div style=""text-align: center; margin: 24px 0;"">
                   <a href=""{ctaUrl}"" style=""background-color: #F59E0B; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;"">{ctaText}</a>
                 </div>"
            : "";

        var footerHtml = !string.IsNullOrEmpty(footer) ? $"<div style=\"margin-top: 24px;\">{footer}</div>" : "";

        return $@"<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width: 600px; margin: 0 auto; background-color: #ffffff;"">
    <tr>
      <td style=""background-color: #78716C; padding: 24px; text-align: center;"">
        <h1 style=""color: #ffffff; margin: 0; font-size: 24px;"">MyUglyRocks</h1>
      </td>
    </tr>
    <tr>
      <td style=""padding: 32px 24px;"">
        <h2 style=""color: #111827; margin: 0 0 16px 0;"">{greeting}</h2>
        <div style=""color: #4b5563; line-height: 1.6;"">{body}</div>
        {ctaButton}
        {footerHtml}
      </td>
    </tr>
    <tr>
      <td style=""background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px;"">
        <p style=""margin: 0 0 8px 0;"">&copy; 2025 MyUglyRocks</p>
        <p style=""margin: 0;"">Questions? Contact support@myuglyrocks.com</p>
      </td>
    </tr>
  </table>
</body>
</html>";
    }

    private static string GetFooterText() => "2025 MyUglyRocks\nQuestions? Contact support@myuglyrocks.com";

    private static string TruncateText(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
            return text;
        return text[..(maxLength - 3)] + "...";
    }

    private static string FormatDuration(TimeSpan duration)
    {
        if (duration.TotalDays >= 1)
        {
            var days = (int)duration.TotalDays;
            var hours = duration.Hours;
            return hours > 0 ? $"{days} day{(days > 1 ? "s" : "")}, {hours} hour{(hours > 1 ? "s" : "")}" : $"{days} day{(days > 1 ? "s" : "")}";
        }
        if (duration.TotalHours >= 1)
        {
            var hours = (int)duration.TotalHours;
            var minutes = duration.Minutes;
            return minutes > 0 ? $"{hours} hour{(hours > 1 ? "s" : "")}, {minutes} minute{(minutes > 1 ? "s" : "")}" : $"{hours} hour{(hours > 1 ? "s" : "")}";
        }
        var mins = (int)duration.TotalMinutes;
        return $"{mins} minute{(mins > 1 ? "s" : "")}";
    }

    #endregion
}
