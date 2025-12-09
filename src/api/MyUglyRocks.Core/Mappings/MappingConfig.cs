using Mapster;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Mappings;

public static class MappingConfig
{
    public static void Configure()
    {
        // User mappings
        TypeAdapterConfig<User, UserDto>.NewConfig()
            .Map(dest => dest.Role, src => src.Role.ToString());

        // Tumbler mappings
        TypeAdapterConfig<Tumbler, TumblerDto>.NewConfig()
            .Map(dest => dest.TumblerType, src => src.TumblerType.ToString())
            .Map(dest => dest.MotorCapacityLbs, src => src.MotorCapacityLbs ?? (src.TumblerModel != null ? src.TumblerModel.MotorCapacityLbs : null))
            .Map(dest => dest.IsMotorCapacityEditable, src => src.TumblerModel == null || src.TumblerModel.IsCustomEntry);

        TypeAdapterConfig<Tumbler, TumblerListDto>.NewConfig()
            .Map(dest => dest.TumblerType, src => src.TumblerType.ToString())
            .Map(dest => dest.BarrelCount, src => src.Barrels.Count);

        TypeAdapterConfig<CreateTumblerRequest, Tumbler>.NewConfig()
            .Map(dest => dest.TumblerType, src => Enum.Parse<TumblerType>(src.TumblerType, true))
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.DateCreated)
            .Ignore(dest => dest.DateUpdated)
            .Ignore(dest => dest.UserId)
            .Ignore(dest => dest.Barrels);

        // Barrel mappings
        TypeAdapterConfig<Barrel, BarrelDto>.NewConfig()
            .Map(dest => dest.IsMounted, src => src.StageRunBarrels.Any(srb => srb.StageRun != null && srb.StageRun.Status == StageRunStatus.Active));

        TypeAdapterConfig<CreateBarrelRequest, Barrel>.NewConfig()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.DateCreated)
            .Ignore(dest => dest.DateUpdated)
            .Ignore(dest => dest.TumblerId);

        // TumblerModel mappings
        TypeAdapterConfig<TumblerModel, TumblerModelDto>.NewConfig()
            .Map(dest => dest.TumblerType, src => src.TumblerType.ToString());

        // Cycle mappings
        TypeAdapterConfig<Cycle, CycleDto>.NewConfig()
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.Specimens, src => src.CycleSpecimens.Select(cs => cs.Specimen));

        TypeAdapterConfig<Cycle, CycleListDto>.NewConfig()
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.StageCount, src => src.StageRuns.Count)
            .Map(dest => dest.ActiveStageCount, src => src.StageRuns.Count(s => s.Status == StageRunStatus.Active))
            .Map(dest => dest.IsOverdue, src => src.StageRuns.Any(s => s.Status == StageRunStatus.Active && s.EndDateTime < DateTime.UtcNow));

        TypeAdapterConfig<CreateCycleRequest, Cycle>.NewConfig()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.DateCreated)
            .Ignore(dest => dest.DateUpdated)
            .Ignore(dest => dest.UserId)
            .Ignore(dest => dest.Status)
            .Ignore(dest => dest.EndDate)
            .Ignore(dest => dest.FinalQuality)
            .Ignore(dest => dest.IsDeleted)
            .Ignore(dest => dest.DateDeleted);

        // StageRun mappings
        TypeAdapterConfig<StageRun, StageRunDto>.NewConfig()
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.WaterLevel, src => src.WaterLevel != null ? src.WaterLevel.ToString() : null)
            .Map(dest => dest.NextAction, src => src.NextAction != null ? src.NextAction.ToString() : null)
            .Map(dest => dest.Materials, src => src.StageMaterials)
            .Map(dest => dest.Barrels, src => src.StageRunBarrels.Where(srb => srb.Barrel != null).Select(srb => srb.Barrel));

        TypeAdapterConfig<StageRun, StageRunSummaryDto>.NewConfig()
            .Map(dest => dest.Status, src => src.Status.ToString());

        TypeAdapterConfig<CreateStageRunRequest, StageRun>.NewConfig()
            .Map(dest => dest.WaterLevel, src => !string.IsNullOrEmpty(src.WaterLevel)
                ? Enum.Parse<WaterLevel>(src.WaterLevel, true)
                : (WaterLevel?)null)
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.DateCreated)
            .Ignore(dest => dest.DateUpdated)
            .Ignore(dest => dest.CycleId)
            .Ignore(dest => dest.Status)
            .Ignore(dest => dest.EndDateTime)
            .Ignore(dest => dest.IsDeleted)
            .Ignore(dest => dest.DateDeleted)
            .Ignore(dest => dest.StageRunBarrels);

        // CleaningRun mappings
        TypeAdapterConfig<CleaningRun, CleaningRunDto>.NewConfig()
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.Purpose, src => src.Purpose != null ? src.Purpose.ToString() : null)
            .Map(dest => dest.Materials, src => src.CleaningMaterials);

        TypeAdapterConfig<CreateCleaningRunRequest, CleaningRun>.NewConfig()
            .Map(dest => dest.Purpose, src => !string.IsNullOrEmpty(src.Purpose)
                ? Enum.Parse<CleaningPurpose>(src.Purpose, true)
                : (CleaningPurpose?)null)
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.DateCreated)
            .Ignore(dest => dest.DateUpdated)
            .Ignore(dest => dest.StageRunId)
            .Ignore(dest => dest.Status);

        // Material mappings
        TypeAdapterConfig<StageMaterial, StageMaterialDto>.NewConfig()
            .Map(dest => dest.MaterialName, src => src.Material != null ? src.Material.CommonName : null);

        TypeAdapterConfig<CleaningMaterial, CleaningMaterialDto>.NewConfig()
            .Map(dest => dest.MaterialName, src => src.Material != null ? src.Material.CommonName : null);

        TypeAdapterConfig<Material, MaterialDto>.NewConfig()
            .Map(dest => dest.Category, src => src.Category.ToString())
            .Map(dest => dest.UsageType, src => src.UsageType != null ? src.UsageType.ToString() : null);

        // Photo mappings
        TypeAdapterConfig<Photo, PhotoDto>.NewConfig()
            .Map(dest => dest.PhotoType, src => src.PhotoType.ToString());

        // Specimen mappings (simple DTO for embedding in cycles)
        TypeAdapterConfig<Specimen, SpecimenDto>.NewConfig()
            .Map(dest => dest.MaterialType, src => src.MaterialType.ToString())
            .Map(dest => dest.TumblingDifficulty, src => src.TumblingDifficulty != null
                ? src.TumblingDifficulty.ToString()
                : null);

        // Specimen detail mapping (for reference data API)
        TypeAdapterConfig<Specimen, SpecimenDetailDto>.NewConfig()
            .Map(dest => dest.MaterialType, src => src.MaterialType.ToString())
            .Map(dest => dest.TumblingDifficulty, src => src.TumblingDifficulty != null
                ? src.TumblingDifficulty.ToString()
                : null);

        TypeAdapterConfig<Specimen, SpecimenListDto>.NewConfig()
            .Map(dest => dest.MaterialType, src => src.MaterialType.ToString())
            .Map(dest => dest.TumblingDifficulty, src => src.TumblingDifficulty != null
                ? src.TumblingDifficulty.ToString()
                : null);

        // Material list mapping
        TypeAdapterConfig<Material, MaterialListDto>.NewConfig()
            .Map(dest => dest.Category, src => src.Category.ToString())
            .Map(dest => dest.UsageType, src => src.UsageType != null ? src.UsageType.ToString() : null);

        // Material detail mapping (for reference data API)
        TypeAdapterConfig<Material, MaterialDetailDto>.NewConfig()
            .Map(dest => dest.Category, src => src.Category.ToString())
            .Map(dest => dest.UsageType, src => src.UsageType != null ? src.UsageType.ToString() : null);
    }
}
