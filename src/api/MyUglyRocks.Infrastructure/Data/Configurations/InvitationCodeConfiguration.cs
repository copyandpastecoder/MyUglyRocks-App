using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class InvitationCodeConfiguration : IEntityTypeConfiguration<InvitationCode>
{
    public void Configure(EntityTypeBuilder<InvitationCode> builder)
    {
        builder.ToTable("invitation_codes");

        builder.HasKey(ic => ic.InvitationCodeId);

        builder.Property(ic => ic.InvitationCodeId)
            .HasColumnName("invitation_code_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(ic => ic.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(ic => ic.CreatedByUserId)
            .HasColumnName("created_by_user_id")
            .IsRequired();

        builder.Property(ic => ic.UsedByUserId)
            .HasColumnName("used_by_user_id");

        builder.Property(ic => ic.DateUsed)
            .HasColumnName("date_used");

        builder.Property(ic => ic.DateExpires)
            .HasColumnName("date_expires");

        builder.Property(ic => ic.IsRevoked)
            .HasColumnName("is_revoked")
            .HasDefaultValue(false);

        builder.Property(ic => ic.DateRevoked)
            .HasColumnName("date_revoked");

        builder.Property(ic => ic.RevokedByUserId)
            .HasColumnName("revoked_by_user_id");

        builder.Property(ic => ic.Description)
            .HasColumnName("description")
            .HasMaxLength(500);

        builder.Property(ic => ic.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(ic => ic.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(ic => ic.CreatedByUser)
            .WithMany(u => u.CreatedInvitationCodes)
            .HasForeignKey(ic => ic.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ic => ic.UsedByUser)
            .WithMany()
            .HasForeignKey(ic => ic.UsedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(ic => ic.RevokedByUser)
            .WithMany()
            .HasForeignKey(ic => ic.RevokedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(ic => ic.Code)
            .IsUnique()
            .HasDatabaseName("ix_invitation_codes_code");

        builder.HasIndex(ic => ic.CreatedByUserId)
            .HasDatabaseName("ix_invitation_codes_created_by_user_id");

        builder.HasIndex(ic => ic.UsedByUserId)
            .HasDatabaseName("ix_invitation_codes_used_by_user_id");

        builder.HasIndex(ic => new { ic.IsRevoked, ic.DateExpires })
            .HasDatabaseName("ix_invitation_codes_revoked_expires")
            .HasFilter("is_revoked = false");

        builder.HasIndex(ic => ic.DateCreated)
            .HasDatabaseName("ix_invitation_codes_date_created");
    }
}
