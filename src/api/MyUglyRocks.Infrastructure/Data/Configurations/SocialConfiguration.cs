using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("posts");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("post_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(p => p.CycleId)
            .HasColumnName("cycle_id")
            .IsRequired();

        builder.Property(p => p.Title)
            .HasColumnName("title")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasColumnName("description");

        builder.Property(p => p.Status)
            .HasColumnName("status")
            .HasDefaultValue(PostStatus.Published);

        builder.Property(p => p.PublishedDate)
            .HasColumnName("published_date")
            .IsRequired();

        builder.Property(p => p.VoteCount)
            .HasColumnName("vote_count")
            .HasDefaultValue(0);

        builder.Property(p => p.CommentCount)
            .HasColumnName("comment_count")
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
        builder.HasOne(p => p.User)
            .WithMany(u => u.Posts)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Cycle)
            .WithMany()
            .HasForeignKey(p => p.CycleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes for gallery queries
        builder.HasIndex(p => p.UserId)
            .HasDatabaseName("ix_posts_user_id");

        builder.HasIndex(p => p.Status)
            .HasDatabaseName("ix_posts_status");

        builder.HasIndex(p => p.PublishedDate)
            .HasDatabaseName("ix_posts_published_date");

        // Composite index for gallery sorting (most common query)
        builder.HasIndex(p => new { p.Status, p.PublishedDate })
            .HasDatabaseName("ix_posts_status_published_date");

        // Index for vote sorting
        builder.HasIndex(p => new { p.Status, p.VoteCount })
            .HasDatabaseName("ix_posts_status_vote_count");

        // Index for comment sorting
        builder.HasIndex(p => new { p.Status, p.CommentCount })
            .HasDatabaseName("ix_posts_status_comment_count");

        // Index for user posts lookup
        builder.HasIndex(p => new { p.UserId, p.Status, p.PublishedDate })
            .HasDatabaseName("ix_posts_user_status_date");
    }
}

public class PostPhotoConfiguration : IEntityTypeConfiguration<PostPhoto>
{
    public void Configure(EntityTypeBuilder<PostPhoto> builder)
    {
        builder.ToTable("post_photos");

        builder.HasKey(pp => pp.Id);

        builder.Property(pp => pp.Id)
            .HasColumnName("post_photo_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(pp => pp.PostId)
            .HasColumnName("post_id")
            .IsRequired();

        builder.Property(pp => pp.PhotoId)
            .HasColumnName("photo_id")
            .IsRequired();

        builder.Property(pp => pp.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(pp => pp.IsCover)
            .HasColumnName("is_cover")
            .HasDefaultValue(false);

        builder.Property(pp => pp.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(pp => pp.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(pp => pp.Post)
            .WithMany(p => p.PostPhotos)
            .HasForeignKey(pp => pp.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pp => pp.Photo)
            .WithMany()
            .HasForeignKey(pp => pp.PhotoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(pp => pp.PostId)
            .HasDatabaseName("ix_post_photos_post_id");

        builder.HasIndex(pp => pp.PhotoId)
            .HasDatabaseName("ix_post_photos_photo_id");

        // Composite for sorted photos query
        builder.HasIndex(pp => new { pp.PostId, pp.SortOrder })
            .HasDatabaseName("ix_post_photos_post_sort");
    }
}

public class VoteConfiguration : IEntityTypeConfiguration<Vote>
{
    public void Configure(EntityTypeBuilder<Vote> builder)
    {
        builder.ToTable("votes");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Id)
            .HasColumnName("vote_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(v => v.PostId)
            .HasColumnName("post_id")
            .IsRequired();

        builder.Property(v => v.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(v => v.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(v => v.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(v => v.Post)
            .WithMany(p => p.Votes)
            .HasForeignKey(v => v.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint - one vote per user per post
        builder.HasIndex(v => new { v.PostId, v.UserId })
            .IsUnique()
            .HasDatabaseName("ix_votes_post_user_unique");

        // Index for checking if user has voted
        builder.HasIndex(v => v.UserId)
            .HasDatabaseName("ix_votes_user_id");

        // Index for counting votes on a post
        builder.HasIndex(v => v.PostId)
            .HasDatabaseName("ix_votes_post_id");
    }
}

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("comments");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("comment_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.PostId)
            .HasColumnName("post_id")
            .IsRequired();

        builder.Property(c => c.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(c => c.ParentCommentId)
            .HasColumnName("parent_comment_id");

        builder.Property(c => c.Content)
            .HasColumnName("content")
            .IsRequired();

        builder.Property(c => c.IsEdited)
            .HasColumnName("is_edited")
            .HasDefaultValue(false);

        builder.Property(c => c.EditedDate)
            .HasColumnName("edited_date");

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
        builder.HasOne(c => c.Post)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index for loading comments on a post
        builder.HasIndex(c => c.PostId)
            .HasDatabaseName("ix_comments_post_id");

        // Index for user's comments
        builder.HasIndex(c => c.UserId)
            .HasDatabaseName("ix_comments_user_id");

        // Index for loading replies
        builder.HasIndex(c => c.ParentCommentId)
            .HasDatabaseName("ix_comments_parent_id");

        // Composite for sorted comments query
        builder.HasIndex(c => new { c.PostId, c.DateCreated })
            .HasDatabaseName("ix_comments_post_date");

        // Index for fetching top-level comments only
        builder.HasIndex(c => new { c.PostId, c.ParentCommentId })
            .HasDatabaseName("ix_comments_post_parent");
    }
}

public class CommentReportConfiguration : IEntityTypeConfiguration<CommentReport>
{
    public void Configure(EntityTypeBuilder<CommentReport> builder)
    {
        builder.ToTable("comment_reports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasColumnName("comment_report_id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.CommentId)
            .HasColumnName("comment_id")
            .IsRequired();

        builder.Property(r => r.ReportedByUserId)
            .HasColumnName("reported_by_user_id")
            .IsRequired();

        builder.Property(r => r.Reason)
            .HasColumnName("reason")
            .IsRequired();

        builder.Property(r => r.Details)
            .HasColumnName("details");

        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasDefaultValue(ReportStatus.Pending);

        builder.Property(r => r.ResolvedByUserId)
            .HasColumnName("resolved_by_user_id");

        builder.Property(r => r.ResolvedDate)
            .HasColumnName("resolved_date");

        builder.Property(r => r.ResolutionNotes)
            .HasColumnName("resolution_notes");

        builder.Property(r => r.DateCreated)
            .HasColumnName("date_created")
            .HasDefaultValueSql("now()");

        builder.Property(r => r.DateUpdated)
            .HasColumnName("date_updated")
            .HasDefaultValueSql("now()");

        // Relationships
        builder.HasOne(r => r.Comment)
            .WithMany(c => c.Reports)
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ReportedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReportedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ResolvedByUser)
            .WithMany()
            .HasForeignKey(r => r.ResolvedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Index for moderation queue (pending reports)
        builder.HasIndex(r => r.Status)
            .HasDatabaseName("ix_comment_reports_status");

        // Index for reports on a specific comment
        builder.HasIndex(r => r.CommentId)
            .HasDatabaseName("ix_comment_reports_comment_id");

        // Composite for moderation queue sorted by date
        builder.HasIndex(r => new { r.Status, r.DateCreated })
            .HasDatabaseName("ix_comment_reports_status_date");

        // Index to prevent duplicate reports from same user
        builder.HasIndex(r => new { r.CommentId, r.ReportedByUserId })
            .HasDatabaseName("ix_comment_reports_comment_reporter");
    }
}
