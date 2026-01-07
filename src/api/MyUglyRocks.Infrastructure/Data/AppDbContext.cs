using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Auth entities
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<InvitationCode> InvitationCodes => Set<InvitationCode>();

    // Tumbler entities
    public DbSet<TumblerModel> TumblerModels => Set<TumblerModel>();
    public DbSet<Tumbler> Tumblers => Set<Tumbler>();
    public DbSet<Barrel> Barrels => Set<Barrel>();
    public DbSet<BarrelNickname> BarrelNicknames => Set<BarrelNickname>();

    // Cycle entities
    public DbSet<Cycle> Cycles => Set<Cycle>();
    public DbSet<StageRun> StageRuns => Set<StageRun>();
    public DbSet<StageRunBarrel> StageRunBarrels => Set<StageRunBarrel>();
    public DbSet<CleaningRun> CleaningRuns => Set<CleaningRun>();
    public DbSet<Photo> Photos => Set<Photo>();

    // Reference data entities
    public DbSet<Specimen> Specimens => Set<Specimen>();
    public DbSet<CycleSpecimen> CycleSpecimens => Set<CycleSpecimen>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<StageMaterial> StageMaterials => Set<StageMaterial>();
    public DbSet<CleaningMaterial> CleaningMaterials => Set<CleaningMaterial>();

    // Inventory entities
    public DbSet<Inventory> Inventory => Set<Inventory>();
    public DbSet<InventorySource> InventorySources => Set<InventorySource>();
    public DbSet<InventorySpecimen> InventorySpecimens => Set<InventorySpecimen>();
    public DbSet<InventoryPhoto> InventoryPhotos => Set<InventoryPhoto>();

    // User specimens
    public DbSet<UserSpecimen> UserSpecimens => Set<UserSpecimen>();

    // Social entities
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostPhoto> PostPhotos => Set<PostPhoto>();
    public DbSet<Vote> Votes => Set<Vote>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<CommentReport> CommentReports => Set<CommentReport>();

    // Waitlist
    public DbSet<WaitlistEntry> WaitlistEntries => Set<WaitlistEntry>();

    // Analytics
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    // Error Logging
    public DbSet<ErrorLog> ErrorLogs => Set<ErrorLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Configure self-referencing FK for RefreshToken
        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.ReplacedByToken)
            .WithMany()
            .HasForeignKey(rt => rt.ReplacedByTokenId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configure global query filter for soft deletes
        modelBuilder.Entity<Cycle>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<StageRun>().HasQueryFilter(s => !s.IsDeleted);
        modelBuilder.Entity<Photo>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Post>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Comment>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<Inventory>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<UserSpecimen>().HasQueryFilter(us => !us.IsDeleted);

        // Configure UserSession entity
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.UserSessionId);
            entity.Property(e => e.UserSessionId)
                .HasColumnName("user_session_id")
                .HasDefaultValueSql("gen_random_uuid()");

            // Essential indexes only (Phase 1)
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionStart);

            // Field length constraints
            entity.Property(e => e.UserAgent).HasMaxLength(512);
            entity.Property(e => e.BrowserName).HasMaxLength(64);
            entity.Property(e => e.BrowserVersion).HasMaxLength(64);
            entity.Property(e => e.OsName).HasMaxLength(64);
            entity.Property(e => e.OsVersion).HasMaxLength(64);
            entity.Property(e => e.Country).HasMaxLength(2);
            entity.Property(e => e.Timezone).HasMaxLength(64);
            entity.Property(e => e.Language).HasMaxLength(16);
            entity.Property(e => e.ReferrerDomain).HasMaxLength(128);
        });

    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.DateCreated = DateTime.UtcNow;
                    entry.Entity.DateUpdated = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.DateUpdated = DateTime.UtcNow;
                    break;
            }
        }

        // Handle soft deletes
        foreach (var entry in ChangeTracker.Entries<ISoftDeletable>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DateDeleted = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
