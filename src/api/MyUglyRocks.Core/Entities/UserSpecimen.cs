namespace MyUglyRocks.Core.Entities;

public class UserSpecimen : SoftDeletableEntity
{
    public Guid UserSpecimenId { get; set; }
    public Guid UserId { get; set; }
    public required string CommonName { get; set; }
    public string? ScientificName { get; set; }
    public string? Alias { get; set; }
    public string? RockFamily { get; set; }
    public string? Species { get; set; }
    public string? Variety { get; set; }
    public SpecimenMaterialType MaterialType { get; set; } = SpecimenMaterialType.Rock;
    public decimal? MohsHardnessMin { get; set; }
    public decimal? MohsHardnessMax { get; set; }
    public TumblingDifficulty? TumblingDifficulty { get; set; }
    public string? RecommendedGritSequence { get; set; }
    public string? SpecialConsiderations { get; set; }
    public string? Notes { get; set; }
    public bool IsPublic { get; set; }
    public Guid? BasedOnSpecimenId { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Specimen? BasedOnSpecimen { get; set; }
    public virtual ICollection<CycleSpecimen> CycleSpecimens { get; set; } = [];
    public virtual ICollection<InventorySpecimen> InventorySpecimens { get; set; } = [];
}
