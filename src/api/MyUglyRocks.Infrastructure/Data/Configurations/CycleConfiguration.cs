using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class CycleConfiguration : IEntityTypeConfiguration<Cycle>
{
    public void Configure(EntityTypeBuilder<Cycle> builder)
    {
        builder.ToTable("cycles");

        builder.HasKey(c => c.CycleId);

        builder.Property(c => c.CycleId)
            .HasColumnName("cycle_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(c => c.StartDate)
            .HasColumnName("start_date")
            .IsRequired();

        builder.Property(c => c.EndDate)
            .HasColumnName("end_date");

        builder.Property(c => c.Status)
            .HasColumnName("status");
        // Note: No database default - entity has C# default of Active

        builder.Property(c => c.DifficultyRating)
            .HasColumnName("difficulty_rating");

        builder.Property(c => c.FinalQuality)
            .HasColumnName("final_quality");

        builder.Property(c => c.AdditionalSpecimens)
            .HasColumnName("additional_specimens");

        builder.Property(c => c.Notes)
            .HasColumnName("notes");

        builder.Property(c => c.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);

        builder.Property(c => c.DateDeleted)
            .HasColumnName("date_deleted");

        builder.Property(c => c.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(c => c.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(c => c.User)
            .WithMany(u => u.Cycles)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(c => c.UserId)
            .HasDatabaseName("ix_cycles_user_id");

        builder.HasIndex(c => c.Status)
            .HasDatabaseName("ix_cycles_status");

        builder.HasIndex(c => new { c.UserId, c.Status })
            .HasDatabaseName("ix_cycles_user_id_status");

        builder.HasIndex(c => c.StartDate)
            .HasDatabaseName("ix_cycles_start_date");
    }
}

public class StageRunConfiguration : IEntityTypeConfiguration<StageRun>
{
    public void Configure(EntityTypeBuilder<StageRun> builder)
    {
        builder.ToTable("stage_runs");

        builder.HasKey(s => s.StageRunId);

        builder.Property(s => s.StageRunId)
            .HasColumnName("stage_run_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.CycleId)
            .HasColumnName("cycle_id")
            .IsRequired();

        builder.Property(s => s.StageName)
            .HasColumnName("stage_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.StartDateTime)
            .HasColumnName("start_date_time")
            .IsRequired();

        builder.Property(s => s.DurationDays)
            .HasColumnName("duration_days")
            .HasDefaultValue(0);

        builder.Property(s => s.DurationHours)
            .HasColumnName("duration_hours")
            .HasDefaultValue(0);

        builder.Property(s => s.EndDateTime)
            .HasColumnName("end_date_time")
            .IsRequired();

        builder.Property(s => s.Status)
            .HasColumnName("status");
        // Note: No database default - entity has C# default of Active, and we need
        // to be able to explicitly set Planned status (CLR default 0) during seeding

        builder.Property(s => s.ReminderEnabled)
            .HasColumnName("reminder_enabled")
            .HasDefaultValue(false);

        builder.Property(s => s.DateReminderSent)
            .HasColumnName("date_reminder_sent");

        builder.Property(s => s.RemindAfterDays)
            .HasColumnName("remind_after_days");

        builder.Property(s => s.RemindAtEndOfStage)
            .HasColumnName("remind_at_end_of_stage");

        builder.Property(s => s.LoadWeightBeforeGrams)
            .HasColumnName("load_weight_before_grams")
            .HasPrecision(10, 2);

        builder.Property(s => s.LoadWeightAfterGrams)
            .HasColumnName("load_weight_after_grams")
            .HasPrecision(10, 2);

        builder.Property(s => s.BarrelRpm)
            .HasColumnName("barrel_rpm")
            .HasPrecision(6, 2);

        builder.Property(s => s.IsRpmEstimated)
            .HasColumnName("is_rpm_estimated");

        builder.Property(s => s.FillLevelPercent)
            .HasColumnName("fill_level_percent");

        builder.Property(s => s.WaterLevel)
            .HasColumnName("water_level");

        builder.Property(s => s.WaterAmountMl)
            .HasColumnName("water_amount_ml");

        builder.Property(s => s.ResultRating)
            .HasColumnName("result_rating");

        builder.Property(s => s.ResultShapeRounding)
            .HasColumnName("result_shape_rounding");

        builder.Property(s => s.ResultScratchLevel)
            .HasColumnName("result_scratch_level");

        builder.Property(s => s.ResultPitting)
            .HasColumnName("result_pitting");

        builder.Property(s => s.ResultShine)
            .HasColumnName("result_shine");

        builder.Property(s => s.IssueScratches)
            .HasColumnName("issue_scratches");

        builder.Property(s => s.IssueChips)
            .HasColumnName("issue_chips");

        builder.Property(s => s.IssueUnderRounded)
            .HasColumnName("issue_under_rounded");

        builder.Property(s => s.IssueContamination)
            .HasColumnName("issue_contamination");

        builder.Property(s => s.LessonsLearned)
            .HasColumnName("lessons_learned");

        builder.Property(s => s.NextAction)
            .HasColumnName("next_action");

        builder.Property(s => s.Notes)
            .HasColumnName("notes");

        builder.Property(s => s.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);

        builder.Property(s => s.DateDeleted)
            .HasColumnName("date_deleted");

        builder.Property(s => s.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(s => s.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(s => s.Cycle)
            .WithMany(c => c.StageRuns)
            .HasForeignKey(s => s.CycleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(s => s.CycleId)
            .HasDatabaseName("ix_stage_runs_cycle_id");

        builder.HasIndex(s => s.Status)
            .HasDatabaseName("ix_stage_runs_status");

        builder.HasIndex(s => s.EndDateTime)
            .HasDatabaseName("ix_stage_runs_end_date_time");
    }
}

public class CleaningRunConfiguration : IEntityTypeConfiguration<CleaningRun>
{
    public void Configure(EntityTypeBuilder<CleaningRun> builder)
    {
        builder.ToTable("cleaning_runs");

        builder.HasKey(cr => cr.CleaningRunId);

        builder.Property(cr => cr.CleaningRunId)
            .HasColumnName("cleaning_run_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(cr => cr.StageRunId)
            .HasColumnName("stage_run_id")
            .IsRequired();

        builder.Property(cr => cr.DurationMinutes)
            .HasColumnName("duration_minutes")
            .IsRequired();

        builder.Property(cr => cr.Purpose)
            .HasColumnName("purpose");

        builder.Property(cr => cr.Status)
            .HasColumnName("status");
        // Note: No database default - entity has C# default of Active

        builder.Property(cr => cr.ReminderEnabled)
            .HasColumnName("reminder_enabled")
            .HasDefaultValue(false);

        builder.Property(cr => cr.DateReminderSent)
            .HasColumnName("date_reminder_sent");

        builder.Property(cr => cr.ResultNotes)
            .HasColumnName("result_notes");

        builder.Property(cr => cr.Notes)
            .HasColumnName("notes");

        builder.Property(cr => cr.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(cr => cr.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships - one-to-one with StageRun
        builder.HasOne(cr => cr.StageRun)
            .WithOne(s => s.CleaningRun)
            .HasForeignKey<CleaningRun>(cr => cr.StageRunId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(cr => cr.StageRunId)
            .IsUnique()
            .HasDatabaseName("ix_cleaning_runs_stage_run_id");
    }
}

public class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.ToTable("photos");

        builder.HasKey(p => p.PhotoId);

        builder.Property(p => p.PhotoId)
            .HasColumnName("photo_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.StageRunId)
            .HasColumnName("stage_run_id")
            .IsRequired();

        builder.Property(p => p.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(p => p.Url)
            .HasColumnName("url")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(p => p.FileName)
            .HasColumnName("file_name")
            .HasMaxLength(255);

        builder.Property(p => p.MimeType)
            .HasColumnName("mime_type")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.FileSizeBytes)
            .HasColumnName("file_size_bytes")
            .IsRequired();

        builder.Property(p => p.Width)
            .HasColumnName("width");

        builder.Property(p => p.Height)
            .HasColumnName("height");

        builder.Property(p => p.PhotoType)
            .HasColumnName("photo_type");

        builder.Property(p => p.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(p => p.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);

        builder.Property(p => p.DateDeleted)
            .HasColumnName("date_deleted");

        builder.Property(p => p.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(p => p.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(p => p.StageRun)
            .WithMany(s => s.Photos)
            .HasForeignKey(p => p.StageRunId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(p => p.StageRunId)
            .HasDatabaseName("ix_photos_stage_run_id");

        builder.HasIndex(p => p.PhotoType)
            .HasDatabaseName("ix_photos_photo_type");
    }
}
