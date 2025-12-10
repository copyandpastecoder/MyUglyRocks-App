namespace MyUglyRocks.Core.Entities;

public class RefreshToken : BaseEntity
{
    public Guid RefreshTokenId { get; set; }
    public Guid UserId { get; set; }
    public required string Token { get; set; }
    public DateTime DateExpires { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? DateRevoked { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
    public string? DeviceInfo { get; set; }
    public string? IpAddress { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual RefreshToken? ReplacedByToken { get; set; }
}
