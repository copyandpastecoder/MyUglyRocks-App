using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class InventorySourceConfiguration : IEntityTypeConfiguration<InventorySource>
{
    public void Configure(EntityTypeBuilder<InventorySource> builder)
    {
        builder.ToTable("inventory_sources");

        builder.HasKey(s => s.InventorySourceId);

        builder.Property(s => s.InventorySourceId)
            .HasColumnName("inventory_source_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(s => s.SourceType)
            .HasColumnName("source_type")
            .IsRequired();

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(s => s.Location)
            .HasColumnName("location")
            .HasMaxLength(255);

        builder.Property(s => s.Phone)
            .HasColumnName("phone")
            .HasMaxLength(50);

        builder.Property(s => s.Url)
            .HasColumnName("url")
            .HasMaxLength(500);

        builder.Property(s => s.ContactName)
            .HasColumnName("contact_name")
            .HasMaxLength(255);

        builder.Property(s => s.Notes)
            .HasColumnName("notes");

        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(s => s.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(s => s.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique index: (user_id, source_type, LOWER(TRIM(name)))
        // Prevents duplicate sources per user - case-insensitive
        builder.HasIndex(s => new { s.UserId, s.SourceType, s.Name })
            .HasDatabaseName("ix_inventory_sources_user_type_name")
            .IsUnique();

        // Index for filtering active sources
        builder.HasIndex(s => new { s.UserId, s.IsActive })
            .HasDatabaseName("ix_inventory_sources_user_active");

        // CHECK constraint: name must not be blank
        builder.ToTable(t => t.HasCheckConstraint(
            "chk_inventory_sources_name_not_blank",
            "TRIM(name) <> ''"));
    }
}
