using Hangfire.Dashboard;

namespace MyUglyRocks.Api.Authorization;

/// <summary>
/// Authorization filter for Hangfire dashboard.
/// Restricts access to authenticated Admin users only.
/// </summary>
public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Require authentication
        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        // Require Admin role
        return httpContext.User.IsInRole("Admin");
    }
}
