using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class TumblerConfiguration : IEntityTypeConfiguration<Tumbler>
{
    public void Configure(EntityTypeBuilder<Tumbler> builder)
    {
        builder.ToTable("tumblers");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasColumnName("tumbler_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.UserId)
            .HasColumnName("user_id");

        builder.Property(t => t.TumblerModelId)
            .HasColumnName("tumbler_model_id");

        builder.Property(t => t.Brand)
            .HasColumnName("brand")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(t => t.Model)
            .HasColumnName("model")
            .HasMaxLength(100);

        builder.Property(t => t.TumblerType)
            .HasColumnName("tumbler_type");

        builder.Property(t => t.MotorCapacityLbs)
            .HasColumnName("motor_capacity_lbs")
            .HasPrecision(6, 2);

        builder.Property(t => t.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(t => t.IsGeneric)
            .HasColumnName("is_generic")
            .HasDefaultValue(false);

        builder.Property(t => t.Notes)
            .HasColumnName("notes");

        builder.Property(t => t.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(t => t.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(t => t.User)
            .WithMany(u => u.Tumblers)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.TumblerModel)
            .WithMany(tm => tm.Tumblers)
            .HasForeignKey(t => t.TumblerModelId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(t => t.UserId)
            .HasDatabaseName("ix_tumblers_user_id");

        builder.HasIndex(t => t.IsActive)
            .HasDatabaseName("ix_tumblers_is_active");

        builder.HasIndex(t => t.IsGeneric)
            .HasDatabaseName("ix_tumblers_is_generic");
    }
}

public class TumblerModelConfiguration : IEntityTypeConfiguration<TumblerModel>
{
    public void Configure(EntityTypeBuilder<TumblerModel> builder)
    {
        builder.ToTable("tumbler_models");

        builder.HasKey(tm => tm.Id);

        builder.Property(tm => tm.Id)
            .HasColumnName("tumbler_model_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(tm => tm.Brand)
            .HasColumnName("brand")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(tm => tm.Model)
            .HasColumnName("model")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(tm => tm.TumblerType)
            .HasColumnName("tumbler_type");

        builder.Property(tm => tm.DefaultCapacityLbs)
            .HasColumnName("default_capacity_lbs")
            .HasPrecision(5, 2);

        builder.Property(tm => tm.DefaultBarrelCount)
            .HasColumnName("default_barrel_count")
            .HasDefaultValue(1);

        builder.Property(tm => tm.MotorCapacityLbs)
            .HasColumnName("motor_capacity_lbs")
            .HasPrecision(6, 2);

        builder.Property(tm => tm.IsCustomEntry)
            .HasColumnName("is_custom_entry")
            .HasDefaultValue(false);

        builder.Property(tm => tm.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(100);

        builder.Property(tm => tm.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(tm => tm.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(tm => tm.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Indexes
        builder.HasIndex(tm => tm.Brand)
            .HasDatabaseName("ix_tumbler_models_brand");

        builder.HasIndex(tm => new { tm.IsActive, tm.SortOrder })
            .HasDatabaseName("ix_tumbler_models_is_active_sort_order");
    }
}

public class BarrelConfiguration : IEntityTypeConfiguration<Barrel>
{
    public void Configure(EntityTypeBuilder<Barrel> builder)
    {
        builder.ToTable("barrels");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasColumnName("barrel_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(b => b.TumblerId)
            .HasColumnName("tumbler_id")
            .IsRequired();

        builder.Property(b => b.BarrelNumber)
            .HasColumnName("barrel_number")
            .IsRequired();

        builder.Property(b => b.Nickname)
            .HasColumnName("nickname")
            .HasMaxLength(100);

        builder.Property(b => b.CapacityLbs)
            .HasColumnName("capacity_lbs")
            .HasPrecision(5, 2);

        builder.Property(b => b.DefaultGritAmountGrams)
            .HasColumnName("default_grit_amount_grams")
            .HasPrecision(10, 2);

        builder.Property(b => b.IsDedicated)
            .HasColumnName("is_dedicated")
            .HasDefaultValue(false);

        builder.Property(b => b.DedicatedStages)
            .HasColumnName("dedicated_stages")
            .HasColumnType("varchar(100)[]");

        builder.Property(b => b.DateLastDeepClean)
            .HasColumnName("date_last_deep_clean");

        builder.Property(b => b.ContaminationNotes)
            .HasColumnName("contamination_notes");

        builder.Property(b => b.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(b => b.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(b => b.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(b => b.Tumbler)
            .WithMany(t => t.Barrels)
            .HasForeignKey(b => b.TumblerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(b => b.TumblerId)
            .HasDatabaseName("ix_barrels_tumbler_id");

        builder.HasIndex(b => b.IsActive)
            .HasDatabaseName("ix_barrels_is_active");
    }
}

public class BarrelNicknameConfiguration : IEntityTypeConfiguration<BarrelNickname>
{
    public void Configure(EntityTypeBuilder<BarrelNickname> builder)
    {
        builder.ToTable("barrel_nicknames");

        builder.HasKey(bn => bn.Id);

        builder.Property(bn => bn.Id)
            .HasColumnName("barrel_nickname_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(bn => bn.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(bn => bn.Category)
            .HasColumnName("category")
            .HasMaxLength(50);

        builder.Property(bn => bn.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(bn => bn.UserCreated)
            .HasColumnName("user_created");

        builder.Property(bn => bn.UserUpdated)
            .HasColumnName("user_updated");

        builder.Property(bn => bn.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(bn => bn.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Indexes
        builder.HasIndex(bn => bn.Name)
            .IsUnique()
            .HasDatabaseName("ix_barrel_nicknames_name");

        builder.HasIndex(bn => bn.IsActive)
            .HasDatabaseName("ix_barrel_nicknames_is_active");
    }
}

public class StageRunBarrelConfiguration : IEntityTypeConfiguration<StageRunBarrel>
{
    public void Configure(EntityTypeBuilder<StageRunBarrel> builder)
    {
        builder.ToTable("stage_run_barrels");

        // Composite primary key
        builder.HasKey(srb => new { srb.StageRunId, srb.BarrelId });

        builder.Property(srb => srb.StageRunId)
            .HasColumnName("stage_run_id");

        builder.Property(srb => srb.BarrelId)
            .HasColumnName("barrel_id");

        // Relationships
        builder.HasOne(srb => srb.StageRun)
            .WithMany(s => s.StageRunBarrels)
            .HasForeignKey(srb => srb.StageRunId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(srb => srb.Barrel)
            .WithMany(b => b.StageRunBarrels)
            .HasForeignKey(srb => srb.BarrelId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(srb => srb.BarrelId)
            .HasDatabaseName("ix_stage_run_barrels_barrel_id");
    }
}
