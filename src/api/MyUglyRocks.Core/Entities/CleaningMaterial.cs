namespace MyUglyRocks.Core.Entities;

public class CleaningMaterial : BaseEntity, IWeightable
{
    public Guid CleaningRunId { get; set; }
    public Guid MaterialId { get; set; }
    public decimal? DisplayAmount { get; set; }
    public string? DisplayUnit { get; set; }
    public decimal? AmountGrams { get; set; }
    public decimal? AmountMilliliters { get; set; }
    public int SortOrder { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual CleaningRun CleaningRun { get; set; } = null!;
    public virtual Material Material { get; set; } = null!;
}
