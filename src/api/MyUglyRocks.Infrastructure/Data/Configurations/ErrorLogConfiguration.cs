using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class ErrorLogConfiguration : IEntityTypeConfiguration<ErrorLog>
{
    public void Configure(EntityTypeBuilder<ErrorLog> builder)
    {
        builder.ToTable("error_logs");

        builder.HasKey(e => e.ErrorLogId);

        builder.Property(e => e.ErrorLogId)
            .HasColumnName("error_log_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.CorrelationId)
            .HasColumnName("correlation_id")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(e => e.ExceptionType)
            .HasColumnName("exception_type")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.Message)
            .HasColumnName("message")
            .IsRequired();

        builder.Property(e => e.StackTrace)
            .HasColumnName("stack_trace");

        builder.Property(e => e.Severity)
            .HasColumnName("severity")
            .HasDefaultValue(ErrorSeverity.Error);

        builder.Property(e => e.HttpMethod)
            .HasColumnName("http_method")
            .HasMaxLength(10);

        builder.Property(e => e.HttpPath)
            .HasColumnName("http_path")
            .HasMaxLength(2048);

        builder.Property(e => e.HttpQueryString)
            .HasColumnName("http_query_string");

        builder.Property(e => e.HttpStatusCode)
            .HasColumnName("http_status_code");

        builder.Property(e => e.UserId)
            .HasColumnName("user_id");

        builder.Property(e => e.IpAddress)
            .HasColumnName("ip_address")
            .HasMaxLength(45); // IPv6 max length

        builder.Property(e => e.UserAgent)
            .HasColumnName("user_agent")
            .HasMaxLength(512);

        builder.Property(e => e.RequestHeaders)
            .HasColumnName("request_headers");

        builder.Property(e => e.InnerException)
            .HasColumnName("inner_exception");

        builder.Property(e => e.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(e => e.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes for performance
        builder.HasIndex(e => e.CorrelationId)
            .HasDatabaseName("ix_error_logs_correlation_id");

        builder.HasIndex(e => e.Severity)
            .HasDatabaseName("ix_error_logs_severity");

        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("ix_error_logs_user_id");

        builder.HasIndex(e => e.DateCreated)
            .HasDatabaseName("ix_error_logs_date_created")
            .IsDescending(); // Most recent first

        // Composite index for common "critical errors in last 24h" queries
        builder.HasIndex(e => new { e.Severity, e.DateCreated })
            .HasDatabaseName("ix_error_logs_severity_date")
            .IsDescending(false, true); // Severity ascending, DateCreated descending

        // Index for path filtering (e.g., all errors on /api/cycles)
        builder.HasIndex(e => e.HttpPath)
            .HasDatabaseName("ix_error_logs_http_path");
    }
}
