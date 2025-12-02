namespace MyUglyRocks.Core.Entities;

public class StageMaterial : BaseEntity, IWeightable
{
    public Guid StageRunId { get; set; }
    public Guid MaterialId { get; set; }
    public decimal? DisplayAmount { get; set; }
    public string? DisplayUnit { get; set; }
    public decimal? AmountGrams { get; set; }
    public decimal? AmountMilliliters { get; set; }
    public int SortOrder { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual StageRun StageRun { get; set; } = null!;
    public virtual Material Material { get; set; } = null!;
}
