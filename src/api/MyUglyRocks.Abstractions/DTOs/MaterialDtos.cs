namespace MyUglyRocks.Abstractions.DTOs;

public record MaterialDetailDto
{
    public Guid Id { get; init; }
    public required string CommonName { get; init; }
    public string Category { get; init; } = "Abrasive";
    public string? MaterialType { get; init; }
    public string? MaterialSize { get; init; }
    public string? UsageType { get; init; }
    public int MeshSize { get; init; }
    public int SortOrder { get; init; }
    public bool IsCleaning { get; init; }
    public string? Notes { get; init; }
}

public record MaterialListDto
{
    public Guid Id { get; init; }
    public required string CommonName { get; init; }
    public string Category { get; init; } = "Abrasive";
    public string? MaterialType { get; init; }
    public string? UsageType { get; init; }
    public int MeshSize { get; init; }
    public int SortOrder { get; init; }
}

public record MaterialSearchRequest
{
    public string? Query { get; init; }
    public string? Category { get; init; }
    public string? UsageType { get; init; }
}

public record CreateMaterialRequest
{
    public required string CommonName { get; init; }
    public string Category { get; init; } = "Abrasive";
    public string? MaterialType { get; init; }
    public string? MaterialSize { get; init; }
    public string? UsageType { get; init; }
    public int MeshSize { get; init; }
    public int SortOrder { get; init; }
    public bool IsCleaning { get; init; }
    public string? Notes { get; init; }
}

public record UpdateMaterialRequest
{
    public required string CommonName { get; init; }
    public string Category { get; init; } = "Abrasive";
    public string? MaterialType { get; init; }
    public string? MaterialSize { get; init; }
    public string? UsageType { get; init; }
    public int MeshSize { get; init; }
    public int SortOrder { get; init; }
    public bool IsCleaning { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; } = true;
}
