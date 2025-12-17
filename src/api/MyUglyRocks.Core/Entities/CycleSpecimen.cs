namespace MyUglyRocks.Core.Entities;

public class CycleSpecimen
{
    public Guid CycleSpecimenId { get; set; }
    public Guid CycleId { get; set; }
    public Guid? SpecimenId { get; set; }
    public Guid? UserSpecimenId { get; set; }
    public Guid? InventorySpecimenId { get; set; }
    public bool MarkDepletedOnComplete { get; set; } = false;
    /// <summary>If true, copy tagged photos from inventory to the cycle when the first stage is created</summary>
    public bool AddPhotosFromInventory { get; set; } = false;
    /// <summary>Tracks whether photos have already been copied (for deduplication)</summary>
    public bool PhotosCopied { get; set; } = false;
    public DateTime DateCreated { get; set; }
    public DateTime DateUpdated { get; set; }

    // Navigation properties
    public virtual Cycle Cycle { get; set; } = null!;
    public virtual Specimen? Specimen { get; set; }
    public virtual UserSpecimen? UserSpecimen { get; set; }
    public virtual InventorySpecimen? InventorySpecimen { get; set; }
}
