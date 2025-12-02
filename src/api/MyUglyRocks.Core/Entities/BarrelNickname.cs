namespace MyUglyRocks.Core.Entities;

public class BarrelNickname : BaseEntity
{
    public required string Name { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? UserCreated { get; set; }
    public Guid? UserUpdated { get; set; }

    // Navigation properties
    public virtual User? CreatedByUser { get; set; }
    public virtual User? UpdatedByUser { get; set; }
}
