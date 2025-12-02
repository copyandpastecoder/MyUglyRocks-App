namespace MyUglyRocks.Core.Entities;

public class CycleSpecimen
{
    public Guid CycleId { get; set; }
    public Guid SpecimenId { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime DateUpdated { get; set; }

    // Navigation properties
    public virtual Cycle Cycle { get; set; } = null!;
    public virtual Specimen Specimen { get; set; } = null!;
}
