namespace MyUglyRocks.Core.Entities;

public enum TumblerType
{
    Rotary = 0,
    Vibratory = 1
}

public class Tumbler : BaseEntity
{
    // Foreign keys
    public Guid? UserId { get; set; }
    public Guid? TumblerModelId { get; set; }

    // Basic info
    public required string Brand { get; set; }
    public string? Model { get; set; }
    public TumblerType TumblerType { get; set; } = TumblerType.Rotary;

    // Capacity override (only for DIY/Generic/Other/MJR models)
    public decimal? MotorCapacityLbs { get; set; } // Overrides TumblerModel.MotorCapacityLbs if allowed

    // Metadata
    public bool IsGeneric { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual TumblerModel? TumblerModel { get; set; }
    public virtual ICollection<Barrel> Barrels { get; set; } = [];
}
