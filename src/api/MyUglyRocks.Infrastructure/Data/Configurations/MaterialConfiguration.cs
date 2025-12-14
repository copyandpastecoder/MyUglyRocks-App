using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class SpecimenConfiguration : IEntityTypeConfiguration<Specimen>
{
    public void Configure(EntityTypeBuilder<Specimen> builder)
    {
        builder.ToTable("specimens");

        builder.HasKey(s => s.SpecimenId);

        builder.Property(s => s.SpecimenId)
            .HasColumnName("specimen_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.CommonName)
            .HasColumnName("common_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.ScientificName)
            .HasColumnName("scientific_name")
            .HasMaxLength(100);

        builder.Property(s => s.Alias)
            .HasColumnName("alias")
            .HasMaxLength(255);

        builder.Property(s => s.RockFamily)
            .HasColumnName("rock_family")
            .HasMaxLength(100);

        builder.Property(s => s.Species)
            .HasColumnName("species")
            .HasMaxLength(100);

        builder.Property(s => s.Variety)
            .HasColumnName("variety")
            .HasMaxLength(100);

        builder.Property(s => s.MaterialType)
            .HasColumnName("material_type")
            .HasDefaultValue(SpecimenMaterialType.Rock);

        builder.Property(s => s.MohsHardnessMin)
            .HasColumnName("mohs_hardness_min")
            .HasPrecision(3, 1);

        builder.Property(s => s.MohsHardnessMax)
            .HasColumnName("mohs_hardness_max")
            .HasPrecision(3, 1);

        builder.Property(s => s.TumblingDifficulty)
            .HasColumnName("tumbling_difficulty");

        builder.Property(s => s.RecommendedGritSequence)
            .HasColumnName("recommended_grit_sequence");

        builder.Property(s => s.SpecialConsiderations)
            .HasColumnName("special_considerations");

        builder.Property(s => s.Notes)
            .HasColumnName("notes");

        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(s => s.UserCreated)
            .HasColumnName("user_created")
            .IsRequired();

        builder.Property(s => s.UserUpdated)
            .HasColumnName("user_updated")
            .IsRequired();

        builder.Property(s => s.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(s => s.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(s => s.CreatedByUser)
            .WithMany()
            .HasForeignKey(s => s.UserCreated)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.UpdatedByUser)
            .WithMany()
            .HasForeignKey(s => s.UserUpdated)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(s => s.CommonName)
            .HasDatabaseName("ix_specimens_common_name");

        builder.HasIndex(s => s.IsActive)
            .HasDatabaseName("ix_specimens_is_active");

        builder.HasIndex(s => s.UserCreated)
            .HasDatabaseName("ix_specimens_user_created");
    }
}

public class CycleSpecimenConfiguration : IEntityTypeConfiguration<CycleSpecimen>
{
    public void Configure(EntityTypeBuilder<CycleSpecimen> builder)
    {
        builder.ToTable("cycle_specimens");

        builder.HasKey(cs => cs.CycleSpecimenId);

        builder.Property(cs => cs.CycleSpecimenId)
            .HasColumnName("cycle_specimen_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(cs => cs.CycleId)
            .HasColumnName("cycle_id")
            .IsRequired();

        builder.Property(cs => cs.SpecimenId)
            .HasColumnName("specimen_id");

        builder.Property(cs => cs.UserSpecimenId)
            .HasColumnName("user_specimen_id");

        builder.Property(cs => cs.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(cs => cs.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(cs => cs.Cycle)
            .WithMany(c => c.CycleSpecimens)
            .HasForeignKey(cs => cs.CycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cs => cs.Specimen)
            .WithMany(s => s.CycleSpecimens)
            .HasForeignKey(cs => cs.SpecimenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cs => cs.UserSpecimen)
            .WithMany(us => us.CycleSpecimens)
            .HasForeignKey(cs => cs.UserSpecimenId)
            .OnDelete(DeleteBehavior.SetNull);

        // XOR constraint: exactly one specimen type must be set
        builder.ToTable(t => t.HasCheckConstraint(
            "chk_cycle_specimen_xor",
            "(specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR (specimen_id IS NULL AND user_specimen_id IS NOT NULL)"));

        // Indexes
        builder.HasIndex(cs => cs.CycleId)
            .HasDatabaseName("ix_cycle_specimens_cycle_id");

        builder.HasIndex(cs => cs.SpecimenId)
            .HasDatabaseName("ix_cycle_specimens_specimen_id");

        builder.HasIndex(cs => cs.UserSpecimenId)
            .HasDatabaseName("ix_cycle_specimens_user_specimen_id");
    }
}

public class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("materials");

        builder.HasKey(m => m.MaterialId);

        builder.Property(m => m.MaterialId)
            .HasColumnName("material_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(m => m.CommonName)
            .HasColumnName("common_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(m => m.Category)
            .HasColumnName("category");

        builder.Property(m => m.MaterialType)
            .HasColumnName("material_type")
            .HasMaxLength(100);

        builder.Property(m => m.MaterialSize)
            .HasColumnName("material_size")
            .HasMaxLength(50);

        builder.Property(m => m.UsageType)
            .HasColumnName("usage_type");

        builder.Property(m => m.MeshSize)
            .HasColumnName("mesh_size")
            .HasDefaultValue(0);

        builder.Property(m => m.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(m => m.IsCleaning)
            .HasColumnName("is_cleaning")
            .HasDefaultValue(false);

        builder.Property(m => m.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(m => m.Notes)
            .HasColumnName("notes");

        builder.Property(m => m.UserCreated)
            .HasColumnName("user_created")
            .IsRequired();

        builder.Property(m => m.UserUpdated)
            .HasColumnName("user_updated")
            .IsRequired();

        builder.Property(m => m.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(m => m.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(m => m.CreatedByUser)
            .WithMany()
            .HasForeignKey(m => m.UserCreated)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.UpdatedByUser)
            .WithMany()
            .HasForeignKey(m => m.UserUpdated)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(m => m.Category)
            .HasDatabaseName("ix_materials_category");

        builder.HasIndex(m => m.IsActive)
            .HasDatabaseName("ix_materials_is_active");

        builder.HasIndex(m => m.IsCleaning)
            .HasDatabaseName("ix_materials_is_cleaning");
    }
}

public class StageMaterialConfiguration : IEntityTypeConfiguration<StageMaterial>
{
    public void Configure(EntityTypeBuilder<StageMaterial> builder)
    {
        builder.ToTable("stage_materials");

        builder.HasKey(sm => sm.StageMaterialId);

        builder.Property(sm => sm.StageMaterialId)
            .HasColumnName("stage_material_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(sm => sm.StageRunId)
            .HasColumnName("stage_run_id")
            .IsRequired();

        builder.Property(sm => sm.MaterialId)
            .HasColumnName("material_id")
            .IsRequired();

        builder.Property(sm => sm.DisplayAmount)
            .HasColumnName("display_amount")
            .HasPrecision(10, 2);

        builder.Property(sm => sm.DisplayUnit)
            .HasColumnName("display_unit")
            .HasMaxLength(20);

        builder.Property(sm => sm.AmountGrams)
            .HasColumnName("amount_grams")
            .HasPrecision(10, 2);

        builder.Property(sm => sm.AmountMilliliters)
            .HasColumnName("amount_milliliters")
            .HasPrecision(10, 2);

        builder.Property(sm => sm.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(sm => sm.Notes)
            .HasColumnName("notes");

        builder.Property(sm => sm.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(sm => sm.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(sm => sm.StageRun)
            .WithMany(s => s.StageMaterials)
            .HasForeignKey(sm => sm.StageRunId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sm => sm.Material)
            .WithMany(m => m.StageMaterials)
            .HasForeignKey(sm => sm.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(sm => sm.StageRunId)
            .HasDatabaseName("ix_stage_materials_stage_run_id");

        builder.HasIndex(sm => sm.MaterialId)
            .HasDatabaseName("ix_stage_materials_material_id");
    }
}

public class CleaningMaterialConfiguration : IEntityTypeConfiguration<CleaningMaterial>
{
    public void Configure(EntityTypeBuilder<CleaningMaterial> builder)
    {
        builder.ToTable("cleaning_materials");

        builder.HasKey(cm => cm.CleaningMaterialId);

        builder.Property(cm => cm.CleaningMaterialId)
            .HasColumnName("cleaning_material_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(cm => cm.CleaningRunId)
            .HasColumnName("cleaning_run_id")
            .IsRequired();

        builder.Property(cm => cm.MaterialId)
            .HasColumnName("material_id")
            .IsRequired();

        builder.Property(cm => cm.DisplayAmount)
            .HasColumnName("display_amount")
            .HasPrecision(10, 2);

        builder.Property(cm => cm.DisplayUnit)
            .HasColumnName("display_unit")
            .HasMaxLength(20);

        builder.Property(cm => cm.AmountGrams)
            .HasColumnName("amount_grams")
            .HasPrecision(10, 2);

        builder.Property(cm => cm.AmountMilliliters)
            .HasColumnName("amount_milliliters")
            .HasPrecision(10, 2);

        builder.Property(cm => cm.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(cm => cm.Notes)
            .HasColumnName("notes");

        builder.Property(cm => cm.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(cm => cm.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(cm => cm.CleaningRun)
            .WithMany(cr => cr.CleaningMaterials)
            .HasForeignKey(cm => cm.CleaningRunId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cm => cm.Material)
            .WithMany(m => m.CleaningMaterials)
            .HasForeignKey(cm => cm.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(cm => cm.CleaningRunId)
            .HasDatabaseName("ix_cleaning_materials_cleaning_run_id");

        builder.HasIndex(cm => cm.MaterialId)
            .HasDatabaseName("ix_cleaning_materials_material_id");
    }
}

public class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.ToTable("user_settings");

        // UserId is both PK and FK (1:1 with User)
        builder.HasKey(us => us.UserId);

        builder.Property(us => us.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(us => us.MeasurementSystem)
            .HasColumnName("measurement_system")
            .HasDefaultValue(MeasurementSystem.Imperial);

        builder.Property(us => us.DateFormat)
            .HasColumnName("date_format")
            .HasDefaultValue(DateFormat.MMDDYYYY);

        builder.Property(us => us.TimeFormat)
            .HasColumnName("time_format")
            .HasDefaultValue(TimeFormat.TwelveHour);

        builder.Property(us => us.Timezone)
            .HasColumnName("timezone")
            .HasMaxLength(50)
            .HasDefaultValue("UTC");

        builder.Property(us => us.FirstDayOfWeek)
            .HasColumnName("first_day_of_week")
            .HasDefaultValue(FirstDayOfWeek.Sunday);

        builder.Property(us => us.ShowRelativeTimes)
            .HasColumnName("show_relative_times")
            .HasDefaultValue(true);

        builder.Property(us => us.FontSize)
            .HasColumnName("font_size")
            .HasDefaultValue(FontSize.Medium);

        builder.Property(us => us.Density)
            .HasColumnName("density")
            .HasDefaultValue(Density.Comfortable);

        builder.Property(us => us.DefaultHomeSection)
            .HasColumnName("default_home_section")
            .HasDefaultValue(DefaultHomeSection.ActiveCycles);

        builder.Property(us => us.NotifyStageReminders)
            .HasColumnName("notify_stage_reminders")
            .HasDefaultValue(true);

        builder.Property(us => us.NotifyComments)
            .HasColumnName("notify_comments")
            .HasDefaultValue(true);

        builder.Property(us => us.NotifyReplies)
            .HasColumnName("notify_replies")
            .HasDefaultValue(true);

        builder.Property(us => us.NotifyUglyRocks)
            .HasColumnName("notify_ugly_rocks")
            .HasDefaultValue(true);

        builder.Property(us => us.NotifyRecipeCloned)
            .HasColumnName("notify_recipe_cloned")
            .HasDefaultValue(true);

        builder.Property(us => us.QuietHoursEnabled)
            .HasColumnName("quiet_hours_enabled")
            .HasDefaultValue(false);

        builder.Property(us => us.QuietHoursStart)
            .HasColumnName("quiet_hours_start");

        builder.Property(us => us.QuietHoursEnd)
            .HasColumnName("quiet_hours_end");

        builder.Property(us => us.DigestFrequency)
            .HasColumnName("digest_frequency")
            .HasDefaultValue(DigestFrequency.Weekly);

        builder.Property(us => us.PhotoUploadQuality)
            .HasColumnName("photo_upload_quality")
            .HasDefaultValue(PhotoUploadQuality.Balanced);

        builder.Property(us => us.AddWatermark)
            .HasColumnName("add_watermark")
            .HasDefaultValue(false);

        builder.Property(us => us.AutoFillFromLastRun)
            .HasColumnName("auto_fill_from_last_run")
            .HasDefaultValue(true);

        builder.Property(us => us.DefaultPostVisibility)
            .HasColumnName("default_post_visibility")
            .HasDefaultValue(PostVisibility.Private);

        builder.Property(us => us.Theme)
            .HasColumnName("theme")
            .HasMaxLength(50)
            .HasDefaultValue("lapis-lazuli");

        builder.Property(us => us.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(us => us.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Note: No additional index needed for UserId since it's the primary key
    }
}
