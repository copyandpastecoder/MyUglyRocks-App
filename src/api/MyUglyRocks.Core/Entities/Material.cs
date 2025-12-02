namespace MyUglyRocks.Core.Entities;

public enum MaterialCategory
{
    Abrasive = 0,
    Additive = 1,
    Media = 2,
    Cleaning = 3
}

public enum UsageType
{
    Coarse = 0,
    Medium = 1,
    Fine = 2,
    PrePolish = 3,
    Polish = 4,
    Cleaning = 5
}

public class Material : UserAuditedEntity
{
    public required string CommonName { get; set; }
    public MaterialCategory Category { get; set; }
    public string? MaterialType { get; set; }
    public string? MaterialSize { get; set; }
    public UsageType? UsageType { get; set; }
    public int MeshSize { get; set; }
    public int SortOrder { get; set; }
    public bool IsCleaning { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual ICollection<StageMaterial> StageMaterials { get; set; } = [];
    public virtual ICollection<CleaningMaterial> CleaningMaterials { get; set; } = [];
}
