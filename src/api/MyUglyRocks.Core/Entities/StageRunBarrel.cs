namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Join table for many-to-many relationship between StageRun and Barrel.
/// Allows a single stage to use multiple barrels simultaneously.
/// </summary>
public class StageRunBarrel
{
    public Guid StageRunId { get; set; }
    public Guid BarrelId { get; set; }

    // Navigation properties
    public virtual StageRun StageRun { get; set; } = null!;
    public virtual Barrel Barrel { get; set; } = null!;
}
