using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class WaitlistEntryConfiguration : IEntityTypeConfiguration<WaitlistEntry>
{
    public void Configure(EntityTypeBuilder<WaitlistEntry> builder)
    {
        builder.ToTable("WaitlistEntries");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(w => w.Email)
            .IsUnique();

        builder.Property(w => w.IpAddress)
            .HasMaxLength(45); // IPv6 max length

        builder.Property(w => w.UserAgent)
            .HasMaxLength(512);
    }
}
