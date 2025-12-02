namespace MyUglyRocks.Abstractions.DTOs;

public record SpecimenDetailDto
{
    public Guid Id { get; init; }
    public required string CommonName { get; init; }
    public string? ScientificName { get; init; }
    public string? Alias { get; init; }
    public string? RockFamily { get; init; }
    public string? Species { get; init; }
    public string? Variety { get; init; }
    public string MaterialType { get; init; } = "Rock";
    public decimal? MohsHardnessMin { get; init; }
    public decimal? MohsHardnessMax { get; init; }
    public string? TumblingDifficulty { get; init; }
    public string? RecommendedGritSequence { get; init; }
    public string? SpecialConsiderations { get; init; }
    public string? Notes { get; init; }
}

public record SpecimenListDto
{
    public Guid Id { get; init; }
    public required string CommonName { get; init; }
    public string? Alias { get; init; }
    public string? Variety { get; init; }
    public string? RockFamily { get; init; }
    public string MaterialType { get; init; } = "Rock";
    public decimal? MohsHardnessMin { get; init; }
    public decimal? MohsHardnessMax { get; init; }
    public string? TumblingDifficulty { get; init; }
}

public record SpecimenSearchRequest
{
    public string? Query { get; init; }
    public string? MaterialType { get; init; }
    public string? Difficulty { get; init; }
    public decimal? MinHardness { get; init; }
    public decimal? MaxHardness { get; init; }
}

public record CreateSpecimenRequest
{
    public required string CommonName { get; init; }
    public string? ScientificName { get; init; }
    public string? Alias { get; init; }
    public string? RockFamily { get; init; }
    public string? Species { get; init; }
    public string? Variety { get; init; }
    public string MaterialType { get; init; } = "Rock";
    public decimal? MohsHardnessMin { get; init; }
    public decimal? MohsHardnessMax { get; init; }
    public string? TumblingDifficulty { get; init; }
    public string? RecommendedGritSequence { get; init; }
    public string? SpecialConsiderations { get; init; }
    public string? Notes { get; init; }
}

public record UpdateSpecimenRequest
{
    public required string CommonName { get; init; }
    public string? ScientificName { get; init; }
    public string? Alias { get; init; }
    public string? RockFamily { get; init; }
    public string? Species { get; init; }
    public string? Variety { get; init; }
    public string MaterialType { get; init; } = "Rock";
    public decimal? MohsHardnessMin { get; init; }
    public decimal? MohsHardnessMax { get; init; }
    public string? TumblingDifficulty { get; init; }
    public string? RecommendedGritSequence { get; init; }
    public string? SpecialConsiderations { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; } = true;
}
