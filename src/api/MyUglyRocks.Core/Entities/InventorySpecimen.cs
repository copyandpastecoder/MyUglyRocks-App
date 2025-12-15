namespace MyUglyRocks.Core.Entities;

public class InventorySpecimen : BaseEntity
{
    public Guid InventorySpecimenId { get; set; }
    public Guid InventoryId { get; set; }
    public Guid? SpecimenId { get; set; }
    public Guid? UserSpecimenId { get; set; }
    public int? EstimatedPercentage { get; set; } // 0-100
    public decimal? WeightGrams { get; set; } // Individual specimen weight
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Inventory Inventory { get; set; } = null!;
    public virtual Specimen? Specimen { get; set; }
    public virtual UserSpecimen? UserSpecimen { get; set; }
}
