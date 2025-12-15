namespace MyUglyRocks.Core.Entities;

public class InventorySpecimen : BaseEntity
{
    public Guid InventorySpecimenId { get; set; }
    public Guid InventoryId { get; set; }
    public Guid? SpecimenId { get; set; }
    public Guid? UserSpecimenId { get; set; }
    public decimal? WeightGrams { get; set; } // Individual specimen weight
    public decimal? Cost { get; set; } // Cost for this specimen
    public InventoryCondition? Condition { get; set; } // Condition of this specimen
    public int? QualityRating { get; set; } // Quality 1-5 stars
    public string? SizeCategories { get; set; } // Comma-separated size categories
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Inventory Inventory { get; set; } = null!;
    public virtual Specimen? Specimen { get; set; }
    public virtual UserSpecimen? UserSpecimen { get; set; }
}
