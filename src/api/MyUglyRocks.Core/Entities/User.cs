namespace MyUglyRocks.Core.Entities;

public enum UserRole
{
    User = 0,
    Moderator = 1,
    Admin = 2
}

public class User : BaseEntity
{
    public Guid UserId { get; set; }
    public required string Email { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public bool EmailVerified { get; set; }
    public DateTime? DateEmailVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DateLastLogin { get; set; }
    public DateTime? DatePasswordChanged { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEndTime { get; set; }
    public string? UnlockToken { get; set; }
    public DateTime? UnlockTokenExpiry { get; set; }
    public bool OnboardingCompleted { get; set; }
    public DateTime? DateOnboardingCompleted { get; set; }

    // Navigation properties
    public virtual UserSettings? Settings { get; set; }
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public virtual ICollection<Tumbler> Tumblers { get; set; } = [];
    public virtual ICollection<Cycle> Cycles { get; set; } = [];
    public virtual ICollection<Post> Posts { get; set; } = [];
    public virtual ICollection<UserSession> Sessions { get; set; } = [];
}
