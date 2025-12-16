using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.ToTable("inventory");

        builder.HasKey(i => i.InventoryId);

        builder.Property(i => i.InventoryId)
            .HasColumnName("inventory_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(i => i.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(i => i.AcquiredDate)
            .HasColumnName("acquired_date")
            .IsRequired();

        builder.Property(i => i.InventorySourceId)
            .HasColumnName("inventory_source_id");

        // Legacy fields - kept for migration, will be removed after migration
        builder.Property(i => i.SourceType)
            .HasColumnName("source_type");

        builder.Property(i => i.SourceName)
            .HasColumnName("source_name")
            .HasMaxLength(255);

        builder.Property(i => i.SourceLocation)
            .HasColumnName("source_location")
            .HasMaxLength(255);

        builder.Property(i => i.SourceUrl)
            .HasColumnName("source_url")
            .HasMaxLength(500);

        builder.Property(i => i.TotalWeightGrams)
            .HasColumnName("total_weight_grams")
            .HasPrecision(10, 2);

        builder.Property(i => i.RemainingWeightGrams)
            .HasColumnName("remaining_weight_grams")
            .HasPrecision(10, 2);

        builder.Property(i => i.DisplayUnit)
            .HasColumnName("display_unit")
            .HasMaxLength(10)
            .HasDefaultValue("g");

        builder.Property(i => i.Cost)
            .HasColumnName("cost")
            .HasPrecision(10, 2);

        builder.Property(i => i.SizeCategories)
            .HasColumnName("size_categories")
            .HasMaxLength(255);

        builder.Property(i => i.QualityRating)
            .HasColumnName("quality_rating");

        builder.Property(i => i.Status)
            .HasColumnName("status");

        builder.Property(i => i.StorageLocation)
            .HasColumnName("storage_location")
            .HasMaxLength(255);

        builder.Property(i => i.Notes)
            .HasColumnName("notes");

        builder.Property(i => i.IsFavorite)
            .HasColumnName("is_favorite")
            .HasDefaultValue(false);

        builder.Property(i => i.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);

        builder.Property(i => i.DateDeleted)
            .HasColumnName("date_deleted");

        builder.Property(i => i.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(i => i.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.InventorySource)
            .WithMany(s => s.Inventories)
            .HasForeignKey(i => i.InventorySourceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(i => i.UserId)
            .HasDatabaseName("ix_inventory_user_id");

        builder.HasIndex(i => i.Status)
            .HasDatabaseName("ix_inventory_status");

        builder.HasIndex(i => new { i.UserId, i.Status })
            .HasDatabaseName("ix_inventory_user_id_status");

        builder.HasIndex(i => i.AcquiredDate)
            .HasDatabaseName("ix_inventory_acquired_date");

        builder.HasIndex(i => i.IsFavorite)
            .HasDatabaseName("ix_inventory_is_favorite");

        builder.HasIndex(i => i.InventorySourceId)
            .HasDatabaseName("ix_inventory_source_id");
    }
}

public class InventorySpecimenConfiguration : IEntityTypeConfiguration<InventorySpecimen>
{
    public void Configure(EntityTypeBuilder<InventorySpecimen> builder)
    {
        builder.ToTable("inventory_specimens");

        builder.HasKey(i => i.InventorySpecimenId);

        builder.Property(i => i.InventorySpecimenId)
            .HasColumnName("inventory_specimen_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.InventoryId)
            .HasColumnName("inventory_id")
            .IsRequired();

        builder.Property(i => i.SpecimenId)
            .HasColumnName("specimen_id");

        builder.Property(i => i.UserSpecimenId)
            .HasColumnName("user_specimen_id");

        builder.Property(i => i.WeightGrams)
            .HasColumnName("weight_grams")
            .HasPrecision(10, 2);

        builder.Property(i => i.Cost)
            .HasColumnName("cost")
            .HasPrecision(10, 2);

        builder.Property(i => i.Condition)
            .HasColumnName("condition");

        builder.Property(i => i.QualityRating)
            .HasColumnName("quality_rating");

        builder.Property(i => i.SizeCategories)
            .HasColumnName("size_categories")
            .HasMaxLength(255);

        builder.Property(i => i.Notes)
            .HasColumnName("notes");

        builder.Property(i => i.Status)
            .HasColumnName("status")
            .HasDefaultValue(InventoryStatus.Available);

        builder.Property(i => i.StorageLocation)
            .HasColumnName("storage_location")
            .HasMaxLength(255);

        builder.Property(i => i.Url)
            .HasColumnName("url")
            .HasMaxLength(500);

        builder.Property(i => i.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(i => i.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(i => i.Inventory)
            .WithMany(inv => inv.InventorySpecimens)
            .HasForeignKey(i => i.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Specimen)
            .WithMany()
            .HasForeignKey(i => i.SpecimenId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.UserSpecimen)
            .WithMany(us => us.InventorySpecimens)
            .HasForeignKey(i => i.UserSpecimenId)
            .OnDelete(DeleteBehavior.SetNull);

        // XOR constraint: exactly one specimen type must be set
        builder.ToTable(t => t.HasCheckConstraint(
            "chk_inventory_specimen_xor",
            "(specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR (specimen_id IS NULL AND user_specimen_id IS NOT NULL)"));

        // Indexes
        builder.HasIndex(i => i.InventoryId)
            .HasDatabaseName("ix_inventory_specimens_inventory_id");

        builder.HasIndex(i => i.SpecimenId)
            .HasDatabaseName("ix_inventory_specimens_specimen_id");

        builder.HasIndex(i => i.UserSpecimenId)
            .HasDatabaseName("ix_inventory_specimens_user_specimen_id");

        builder.HasIndex(i => i.Status)
            .HasDatabaseName("ix_inventory_specimens_status");

        builder.HasIndex(i => new { i.InventoryId, i.Status })
            .HasDatabaseName("ix_inventory_specimens_inventory_status");
    }
}

public class InventoryPhotoConfiguration : IEntityTypeConfiguration<InventoryPhoto>
{
    public void Configure(EntityTypeBuilder<InventoryPhoto> builder)
    {
        builder.ToTable("inventory_photos");

        builder.HasKey(p => p.InventoryPhotoId);

        builder.Property(p => p.InventoryPhotoId)
            .HasColumnName("inventory_photo_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.InventoryId)
            .HasColumnName("inventory_id")
            .IsRequired();

        builder.Property(p => p.InventorySpecimenId)
            .HasColumnName("inventory_specimen_id");

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

        builder.Property(p => p.Caption)
            .HasColumnName("caption")
            .HasMaxLength(500);

        builder.Property(p => p.IsCover)
            .HasColumnName("is_cover")
            .HasDefaultValue(false);

        builder.Property(p => p.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(p => p.ProcessingStatus)
            .HasColumnName("processing_status");

        builder.Property(p => p.ProcessingError)
            .HasColumnName("processing_error")
            .HasMaxLength(1000);

        builder.Property(p => p.ThumbnailUrl)
            .HasColumnName("thumbnail_url")
            .HasMaxLength(500);

        builder.Property(p => p.MediumUrl)
            .HasColumnName("medium_url")
            .HasMaxLength(500);

        builder.Property(p => p.LargeUrl)
            .HasColumnName("large_url")
            .HasMaxLength(500);

        builder.Property(p => p.BlurHash)
            .HasColumnName("blur_hash");

        builder.Property(p => p.ThumbnailStorageKey)
            .HasColumnName("thumbnail_storage_key")
            .HasMaxLength(500);

        builder.Property(p => p.MediumStorageKey)
            .HasColumnName("medium_storage_key")
            .HasMaxLength(500);

        builder.Property(p => p.LargeStorageKey)
            .HasColumnName("large_storage_key")
            .HasMaxLength(500);

        builder.Property(p => p.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(p => p.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(p => p.Inventory)
            .WithMany(i => i.InventoryPhotos)
            .HasForeignKey(p => p.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.InventorySpecimen)
            .WithMany()
            .HasForeignKey(p => p.InventorySpecimenId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(p => p.InventoryId)
            .HasDatabaseName("ix_inventory_photos_inventory_id");

        builder.HasIndex(p => p.InventorySpecimenId)
            .HasDatabaseName("ix_inventory_photos_inventory_specimen_id");

        builder.HasIndex(p => p.IsCover)
            .HasDatabaseName("ix_inventory_photos_is_cover");
    }
}

public class UserSpecimenConfiguration : IEntityTypeConfiguration<UserSpecimen>
{
    public void Configure(EntityTypeBuilder<UserSpecimen> builder)
    {
        builder.ToTable("user_specimens");

        builder.HasKey(us => us.UserSpecimenId);

        builder.Property(us => us.UserSpecimenId)
            .HasColumnName("user_specimen_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(us => us.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(us => us.CommonName)
            .HasColumnName("common_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(us => us.ScientificName)
            .HasColumnName("scientific_name")
            .HasMaxLength(100);

        builder.Property(us => us.Alias)
            .HasColumnName("alias")
            .HasMaxLength(255);

        builder.Property(us => us.RockFamily)
            .HasColumnName("rock_family")
            .HasMaxLength(100);

        builder.Property(us => us.Species)
            .HasColumnName("species")
            .HasMaxLength(100);

        builder.Property(us => us.Variety)
            .HasColumnName("variety")
            .HasMaxLength(100);

        builder.Property(us => us.MaterialType)
            .HasColumnName("material_type");

        builder.Property(us => us.MohsHardnessMin)
            .HasColumnName("mohs_hardness_min")
            .HasPrecision(3, 1);

        builder.Property(us => us.MohsHardnessMax)
            .HasColumnName("mohs_hardness_max")
            .HasPrecision(3, 1);

        builder.Property(us => us.TumblingDifficulty)
            .HasColumnName("tumbling_difficulty");

        builder.Property(us => us.RecommendedGritSequence)
            .HasColumnName("recommended_grit_sequence")
            .HasMaxLength(255);

        builder.Property(us => us.SpecialConsiderations)
            .HasColumnName("special_considerations");

        builder.Property(us => us.Notes)
            .HasColumnName("notes");

        builder.Property(us => us.IsPublic)
            .HasColumnName("is_public")
            .HasDefaultValue(false);

        builder.Property(us => us.BasedOnSpecimenId)
            .HasColumnName("based_on_specimen_id");

        builder.Property(us => us.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);

        builder.Property(us => us.DateDeleted)
            .HasColumnName("date_deleted");

        builder.Property(us => us.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(us => us.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(us => us.User)
            .WithMany()
            .HasForeignKey(us => us.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(us => us.BasedOnSpecimen)
            .WithMany()
            .HasForeignKey(us => us.BasedOnSpecimenId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(us => us.UserId)
            .HasDatabaseName("ix_user_specimens_user_id");

        builder.HasIndex(us => us.IsPublic)
            .HasDatabaseName("ix_user_specimens_is_public");

        builder.HasIndex(us => new { us.UserId, us.CommonName })
            .HasDatabaseName("ix_user_specimens_user_id_common_name");
    }
}
