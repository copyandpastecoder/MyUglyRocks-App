using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.UserId);

        builder.Property(u => u.UserId)
            .HasColumnName("user_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(u => u.Username)
            .HasColumnName("username")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(u => u.PasswordHash)
            .HasColumnName("password_hash")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(u => u.Bio)
            .HasColumnName("bio");

        builder.Property(u => u.AvatarUrl)
            .HasColumnName("avatar_url")
            .HasMaxLength(500);

        builder.Property(u => u.Role)
            .HasColumnName("role")
            .HasDefaultValue(UserRole.User);

        builder.Property(u => u.EmailVerified)
            .HasColumnName("email_verified")
            .HasDefaultValue(false);

        builder.Property(u => u.DateEmailVerified)
            .HasColumnName("date_email_verified");

        builder.Property(u => u.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(u => u.DateLastLogin)
            .HasColumnName("date_last_login");

        builder.Property(u => u.DatePasswordChanged)
            .HasColumnName("date_password_changed");

        builder.Property(u => u.FailedLoginAttempts)
            .HasColumnName("failed_login_attempts")
            .HasDefaultValue(0);

        builder.Property(u => u.LockoutEndTime)
            .HasColumnName("lockout_end_time");

        builder.Property(u => u.UnlockToken)
            .HasColumnName("unlock_token")
            .HasMaxLength(128);

        builder.Property(u => u.UnlockTokenExpiry)
            .HasColumnName("unlock_token_expiry");

        builder.Property(u => u.OnboardingCompleted)
            .HasColumnName("onboarding_completed")
            .HasDefaultValue(false);

        builder.Property(u => u.DateOnboardingCompleted)
            .HasColumnName("date_onboarding_completed");

        builder.Property(u => u.InvitedByUserId)
            .HasColumnName("invited_by_user_id");

        builder.Property(u => u.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(u => u.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(u => u.Settings)
            .WithOne(s => s.User)
            .HasForeignKey<UserSettings>(s => s.UserId);

        builder.HasOne(u => u.InvitedByUser)
            .WithMany(u => u.InvitedUsers)
            .HasForeignKey(u => u.InvitedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("ix_users_email");

        builder.HasIndex(u => u.Username)
            .IsUnique()
            .HasDatabaseName("ix_users_username");

        builder.HasIndex(u => u.LockoutEndTime)
            .HasDatabaseName("ix_users_lockout_end_time");
    }
}
