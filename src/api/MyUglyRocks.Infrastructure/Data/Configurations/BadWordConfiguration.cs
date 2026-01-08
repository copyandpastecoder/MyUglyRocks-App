using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class BadWordConfiguration : IEntityTypeConfiguration<BadWord>
{
    public void Configure(EntityTypeBuilder<BadWord> builder)
    {
        builder.ToTable("bad_words");

        builder.HasKey(bw => bw.BadWordId);

        builder.Property(bw => bw.BadWordId)
            .HasColumnName("bad_word_id")
            .ValueGeneratedOnAdd();

        builder.Property(bw => bw.Word)
            .HasColumnName("word")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(bw => bw.Notes)
            .HasColumnName("notes")
            .HasMaxLength(500);

        builder.Property(bw => bw.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(bw => bw.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Unique index on word for fast lookups and prevent duplicates
        builder.HasIndex(bw => bw.Word)
            .IsUnique()
            .HasDatabaseName("ix_bad_words_word");
    }
}
