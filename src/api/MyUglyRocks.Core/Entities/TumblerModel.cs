namespace MyUglyRocks.Core.Entities;

public class TumblerModel : BaseEntity
{
    public Guid TumblerModelId { get; set; }

    // Basic info
    public required string Brand { get; set; }
    public required string Model { get; set; }
    public TumblerType TumblerType { get; set; }

    // Capacity
    public decimal? DefaultCapacityLbs { get; set; } // Per-barrel capacity suggestion
    public int DefaultBarrelCount { get; set; } = 1;
    public decimal? MotorCapacityLbs { get; set; } // Total motor capacity (max weight motor can handle)

    // Metadata
    public bool IsCustomEntry { get; set; }
    public int SortOrder { get; set; } = 100;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Tumbler> Tumblers { get; set; } = [];
}
