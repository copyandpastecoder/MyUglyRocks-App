namespace MyUglyRocks.Core.Entities;

public enum SpecimenMaterialType
{
    Rock = 0,
    Mineral = 1,
    Glass = 2,
    Fossil = 3,
    Other = 4
}

public enum TumblingDifficulty
{
    Easy = 0,
    Medium = 1,
    Hard = 2
}

public class Specimen : UserAuditedEntity
{
    public required string CommonName { get; set; }
    public string? ScientificName { get; set; }
    public string? Alias { get; set; }
    public string? RockFamily { get; set; }
    public string? Species { get; set; }
    public string? Variety { get; set; }
    public SpecimenMaterialType MaterialType { get; set; }
    public decimal? MohsHardnessMin { get; set; }
    public decimal? MohsHardnessMax { get; set; }
    public TumblingDifficulty? TumblingDifficulty { get; set; }
    public string? RecommendedGritSequence { get; set; }
    public string? SpecialConsiderations { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<CycleSpecimen> CycleSpecimens { get; set; } = [];
}
