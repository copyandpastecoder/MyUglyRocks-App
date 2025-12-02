using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FlexibleBarrelConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_Comments_CommentId",
                table: "CommentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_users_ReportedByUserId",
                table: "CommentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_users_ResolvedByUserId",
                table: "CommentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Comments_ParentCommentId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Posts_PostId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_users_UserId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_PostPhotos_Posts_PostId",
                table: "PostPhotos");

            migrationBuilder.DropForeignKey(
                name: "FK_PostPhotos_photos_PhotoId",
                table: "PostPhotos");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_cycles_CycleId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_users_UserId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_stage_runs_barrels_barrel_id",
                table: "stage_runs");

            migrationBuilder.DropForeignKey(
                name: "FK_Votes_Posts_PostId",
                table: "Votes");

            migrationBuilder.DropForeignKey(
                name: "FK_Votes_users_UserId",
                table: "Votes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Votes",
                table: "Votes");

            migrationBuilder.DropIndex(
                name: "ix_stage_runs_barrel_id",
                table: "stage_runs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Posts",
                table: "Posts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Comments",
                table: "Comments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PostPhotos",
                table: "PostPhotos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CommentReports",
                table: "CommentReports");

            migrationBuilder.DropColumn(
                name: "barrel_id",
                table: "stage_runs");

            migrationBuilder.DropColumn(
                name: "is_capacity_metric",
                table: "barrels");

            migrationBuilder.RenameTable(
                name: "Votes",
                newName: "votes");

            migrationBuilder.RenameTable(
                name: "Posts",
                newName: "posts");

            migrationBuilder.RenameTable(
                name: "Comments",
                newName: "comments");

            migrationBuilder.RenameTable(
                name: "PostPhotos",
                newName: "post_photos");

            migrationBuilder.RenameTable(
                name: "CommentReports",
                newName: "comment_reports");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "votes",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "votes",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "votes",
                newName: "post_id");

            migrationBuilder.RenameColumn(
                name: "DateUpdated",
                table: "votes",
                newName: "date_updated");

            migrationBuilder.RenameColumn(
                name: "DateCreated",
                table: "votes",
                newName: "date_created");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_UserId",
                table: "votes",
                newName: "ix_votes_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_PostId_UserId",
                table: "votes",
                newName: "ix_votes_post_user_unique");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "posts",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "posts",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "posts",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "posts",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VoteCount",
                table: "posts",
                newName: "vote_count");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "posts",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "PublishedDate",
                table: "posts",
                newName: "published_date");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "posts",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "DateUpdated",
                table: "posts",
                newName: "date_updated");

            migrationBuilder.RenameColumn(
                name: "DateDeleted",
                table: "posts",
                newName: "date_deleted");

            migrationBuilder.RenameColumn(
                name: "DateCreated",
                table: "posts",
                newName: "date_created");

            migrationBuilder.RenameColumn(
                name: "CycleId",
                table: "posts",
                newName: "cycle_id");

            migrationBuilder.RenameColumn(
                name: "CommentCount",
                table: "posts",
                newName: "comment_count");

            migrationBuilder.RenameIndex(
                name: "IX_Posts_UserId",
                table: "posts",
                newName: "ix_posts_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_Posts_CycleId",
                table: "posts",
                newName: "IX_posts_cycle_id");

            migrationBuilder.RenameColumn(
                name: "Content",
                table: "comments",
                newName: "content");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "comments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "comments",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "comments",
                newName: "post_id");

            migrationBuilder.RenameColumn(
                name: "ParentCommentId",
                table: "comments",
                newName: "parent_comment_id");

            migrationBuilder.RenameColumn(
                name: "IsEdited",
                table: "comments",
                newName: "is_edited");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "comments",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "EditedDate",
                table: "comments",
                newName: "edited_date");

            migrationBuilder.RenameColumn(
                name: "DateUpdated",
                table: "comments",
                newName: "date_updated");

            migrationBuilder.RenameColumn(
                name: "DateDeleted",
                table: "comments",
                newName: "date_deleted");

            migrationBuilder.RenameColumn(
                name: "DateCreated",
                table: "comments",
                newName: "date_created");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_UserId",
                table: "comments",
                newName: "ix_comments_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_PostId",
                table: "comments",
                newName: "ix_comments_post_id");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_ParentCommentId",
                table: "comments",
                newName: "ix_comments_parent_id");

            migrationBuilder.RenameColumn(
                name: "capacity",
                table: "barrels",
                newName: "capacity_lbs");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "post_photos",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "SortOrder",
                table: "post_photos",
                newName: "sort_order");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "post_photos",
                newName: "post_id");

            migrationBuilder.RenameColumn(
                name: "PhotoId",
                table: "post_photos",
                newName: "photo_id");

            migrationBuilder.RenameColumn(
                name: "IsCover",
                table: "post_photos",
                newName: "is_cover");

            migrationBuilder.RenameColumn(
                name: "DateUpdated",
                table: "post_photos",
                newName: "date_updated");

            migrationBuilder.RenameColumn(
                name: "DateCreated",
                table: "post_photos",
                newName: "date_created");

            migrationBuilder.RenameIndex(
                name: "IX_PostPhotos_PostId",
                table: "post_photos",
                newName: "ix_post_photos_post_id");

            migrationBuilder.RenameIndex(
                name: "IX_PostPhotos_PhotoId",
                table: "post_photos",
                newName: "ix_post_photos_photo_id");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "comment_reports",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Reason",
                table: "comment_reports",
                newName: "reason");

            migrationBuilder.RenameColumn(
                name: "Details",
                table: "comment_reports",
                newName: "details");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "comment_reports",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ResolvedDate",
                table: "comment_reports",
                newName: "resolved_date");

            migrationBuilder.RenameColumn(
                name: "ResolvedByUserId",
                table: "comment_reports",
                newName: "resolved_by_user_id");

            migrationBuilder.RenameColumn(
                name: "ResolutionNotes",
                table: "comment_reports",
                newName: "resolution_notes");

            migrationBuilder.RenameColumn(
                name: "ReportedByUserId",
                table: "comment_reports",
                newName: "reported_by_user_id");

            migrationBuilder.RenameColumn(
                name: "DateUpdated",
                table: "comment_reports",
                newName: "date_updated");

            migrationBuilder.RenameColumn(
                name: "DateCreated",
                table: "comment_reports",
                newName: "date_created");

            migrationBuilder.RenameColumn(
                name: "CommentId",
                table: "comment_reports",
                newName: "comment_id");

            migrationBuilder.RenameIndex(
                name: "IX_CommentReports_ResolvedByUserId",
                table: "comment_reports",
                newName: "IX_comment_reports_resolved_by_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_CommentReports_ReportedByUserId",
                table: "comment_reports",
                newName: "IX_comment_reports_reported_by_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_CommentReports_CommentId",
                table: "comment_reports",
                newName: "ix_comment_reports_comment_id");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                table: "votes",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_updated",
                table: "votes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_created",
                table: "votes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<decimal>(
                name: "motor_capacity_lbs",
                table: "tumblers",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "motor_capacity_lbs",
                table: "tumbler_models",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "stage_runs",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "water_amount_ml",
                table: "stage_runs",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "posts",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "posts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                table: "posts",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<int>(
                name: "vote_count",
                table: "posts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<bool>(
                name: "is_deleted",
                table: "posts",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_updated",
                table: "posts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_created",
                table: "posts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<int>(
                name: "comment_count",
                table: "posts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                table: "comments",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<bool>(
                name: "is_edited",
                table: "comments",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<bool>(
                name: "is_deleted",
                table: "comments",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_updated",
                table: "comments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_created",
                table: "comments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                table: "post_photos",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<int>(
                name: "sort_order",
                table: "post_photos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<bool>(
                name: "is_cover",
                table: "post_photos",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_updated",
                table: "post_photos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_created",
                table: "post_photos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "comment_reports",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                table: "comment_reports",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_updated",
                table: "comment_reports",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "date_created",
                table: "comment_reports",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddPrimaryKey(
                name: "PK_votes",
                table: "votes",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_posts",
                table: "posts",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_comments",
                table: "comments",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_post_photos",
                table: "post_photos",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_comment_reports",
                table: "comment_reports",
                column: "id");

            migrationBuilder.CreateTable(
                name: "stage_run_barrels",
                columns: table => new
                {
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrel_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stage_run_barrels", x => new { x.stage_run_id, x.barrel_id });
                    table.ForeignKey(
                        name: "FK_stage_run_barrels_barrels_barrel_id",
                        column: x => x.barrel_id,
                        principalTable: "barrels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stage_run_barrels_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_votes_post_id",
                table: "votes",
                column: "post_id");

            migrationBuilder.CreateIndex(
                name: "ix_posts_published_date",
                table: "posts",
                column: "published_date");

            migrationBuilder.CreateIndex(
                name: "ix_posts_status",
                table: "posts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_posts_status_comment_count",
                table: "posts",
                columns: new[] { "status", "comment_count" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_status_published_date",
                table: "posts",
                columns: new[] { "status", "published_date" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_status_vote_count",
                table: "posts",
                columns: new[] { "status", "vote_count" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_user_status_date",
                table: "posts",
                columns: new[] { "user_id", "status", "published_date" });

            migrationBuilder.CreateIndex(
                name: "ix_comments_post_date",
                table: "comments",
                columns: new[] { "post_id", "date_created" });

            migrationBuilder.CreateIndex(
                name: "ix_comments_post_parent",
                table: "comments",
                columns: new[] { "post_id", "parent_comment_id" });

            migrationBuilder.CreateIndex(
                name: "ix_post_photos_post_sort",
                table: "post_photos",
                columns: new[] { "post_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_comment_reports_comment_reporter",
                table: "comment_reports",
                columns: new[] { "comment_id", "reported_by_user_id" });

            migrationBuilder.CreateIndex(
                name: "ix_comment_reports_status",
                table: "comment_reports",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_comment_reports_status_date",
                table: "comment_reports",
                columns: new[] { "status", "date_created" });

            migrationBuilder.CreateIndex(
                name: "ix_stage_run_barrels_barrel_id",
                table: "stage_run_barrels",
                column: "barrel_id");

            migrationBuilder.AddForeignKey(
                name: "FK_comment_reports_comments_comment_id",
                table: "comment_reports",
                column: "comment_id",
                principalTable: "comments",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_comment_reports_users_reported_by_user_id",
                table: "comment_reports",
                column: "reported_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_comment_reports_users_resolved_by_user_id",
                table: "comment_reports",
                column: "resolved_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_comments_comments_parent_comment_id",
                table: "comments",
                column: "parent_comment_id",
                principalTable: "comments",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_comments_posts_post_id",
                table: "comments",
                column: "post_id",
                principalTable: "posts",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_comments_users_user_id",
                table: "comments",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_post_photos_photos_photo_id",
                table: "post_photos",
                column: "photo_id",
                principalTable: "photos",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_post_photos_posts_post_id",
                table: "post_photos",
                column: "post_id",
                principalTable: "posts",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_posts_cycles_cycle_id",
                table: "posts",
                column: "cycle_id",
                principalTable: "cycles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_posts_users_user_id",
                table: "posts",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_votes_posts_post_id",
                table: "votes",
                column: "post_id",
                principalTable: "posts",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_votes_users_user_id",
                table: "votes",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_comment_reports_comments_comment_id",
                table: "comment_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_comment_reports_users_reported_by_user_id",
                table: "comment_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_comment_reports_users_resolved_by_user_id",
                table: "comment_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_comments_comments_parent_comment_id",
                table: "comments");

            migrationBuilder.DropForeignKey(
                name: "FK_comments_posts_post_id",
                table: "comments");

            migrationBuilder.DropForeignKey(
                name: "FK_comments_users_user_id",
                table: "comments");

            migrationBuilder.DropForeignKey(
                name: "FK_post_photos_photos_photo_id",
                table: "post_photos");

            migrationBuilder.DropForeignKey(
                name: "FK_post_photos_posts_post_id",
                table: "post_photos");

            migrationBuilder.DropForeignKey(
                name: "FK_posts_cycles_cycle_id",
                table: "posts");

            migrationBuilder.DropForeignKey(
                name: "FK_posts_users_user_id",
                table: "posts");

            migrationBuilder.DropForeignKey(
                name: "FK_votes_posts_post_id",
                table: "votes");

            migrationBuilder.DropForeignKey(
                name: "FK_votes_users_user_id",
                table: "votes");

            migrationBuilder.DropTable(
                name: "stage_run_barrels");

            migrationBuilder.DropPrimaryKey(
                name: "PK_votes",
                table: "votes");

            migrationBuilder.DropIndex(
                name: "ix_votes_post_id",
                table: "votes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_posts",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_published_date",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_status",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_status_comment_count",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_status_published_date",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_status_vote_count",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_user_status_date",
                table: "posts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_comments",
                table: "comments");

            migrationBuilder.DropIndex(
                name: "ix_comments_post_date",
                table: "comments");

            migrationBuilder.DropIndex(
                name: "ix_comments_post_parent",
                table: "comments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_post_photos",
                table: "post_photos");

            migrationBuilder.DropIndex(
                name: "ix_post_photos_post_sort",
                table: "post_photos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_comment_reports",
                table: "comment_reports");

            migrationBuilder.DropIndex(
                name: "ix_comment_reports_comment_reporter",
                table: "comment_reports");

            migrationBuilder.DropIndex(
                name: "ix_comment_reports_status",
                table: "comment_reports");

            migrationBuilder.DropIndex(
                name: "ix_comment_reports_status_date",
                table: "comment_reports");

            migrationBuilder.DropColumn(
                name: "motor_capacity_lbs",
                table: "tumblers");

            migrationBuilder.DropColumn(
                name: "motor_capacity_lbs",
                table: "tumbler_models");

            migrationBuilder.DropColumn(
                name: "water_amount_ml",
                table: "stage_runs");

            migrationBuilder.RenameTable(
                name: "votes",
                newName: "Votes");

            migrationBuilder.RenameTable(
                name: "posts",
                newName: "Posts");

            migrationBuilder.RenameTable(
                name: "comments",
                newName: "Comments");

            migrationBuilder.RenameTable(
                name: "post_photos",
                newName: "PostPhotos");

            migrationBuilder.RenameTable(
                name: "comment_reports",
                newName: "CommentReports");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Votes",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Votes",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "post_id",
                table: "Votes",
                newName: "PostId");

            migrationBuilder.RenameColumn(
                name: "date_updated",
                table: "Votes",
                newName: "DateUpdated");

            migrationBuilder.RenameColumn(
                name: "date_created",
                table: "Votes",
                newName: "DateCreated");

            migrationBuilder.RenameIndex(
                name: "ix_votes_user_id",
                table: "Votes",
                newName: "IX_Votes_UserId");

            migrationBuilder.RenameIndex(
                name: "ix_votes_post_user_unique",
                table: "Votes",
                newName: "IX_Votes_PostId_UserId");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "Posts",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Posts",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Posts",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Posts",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vote_count",
                table: "Posts",
                newName: "VoteCount");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Posts",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "published_date",
                table: "Posts",
                newName: "PublishedDate");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "Posts",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "date_updated",
                table: "Posts",
                newName: "DateUpdated");

            migrationBuilder.RenameColumn(
                name: "date_deleted",
                table: "Posts",
                newName: "DateDeleted");

            migrationBuilder.RenameColumn(
                name: "date_created",
                table: "Posts",
                newName: "DateCreated");

            migrationBuilder.RenameColumn(
                name: "cycle_id",
                table: "Posts",
                newName: "CycleId");

            migrationBuilder.RenameColumn(
                name: "comment_count",
                table: "Posts",
                newName: "CommentCount");

            migrationBuilder.RenameIndex(
                name: "ix_posts_user_id",
                table: "Posts",
                newName: "IX_Posts_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_posts_cycle_id",
                table: "Posts",
                newName: "IX_Posts_CycleId");

            migrationBuilder.RenameColumn(
                name: "content",
                table: "Comments",
                newName: "Content");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Comments",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Comments",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "post_id",
                table: "Comments",
                newName: "PostId");

            migrationBuilder.RenameColumn(
                name: "parent_comment_id",
                table: "Comments",
                newName: "ParentCommentId");

            migrationBuilder.RenameColumn(
                name: "is_edited",
                table: "Comments",
                newName: "IsEdited");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "Comments",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "edited_date",
                table: "Comments",
                newName: "EditedDate");

            migrationBuilder.RenameColumn(
                name: "date_updated",
                table: "Comments",
                newName: "DateUpdated");

            migrationBuilder.RenameColumn(
                name: "date_deleted",
                table: "Comments",
                newName: "DateDeleted");

            migrationBuilder.RenameColumn(
                name: "date_created",
                table: "Comments",
                newName: "DateCreated");

            migrationBuilder.RenameIndex(
                name: "ix_comments_user_id",
                table: "Comments",
                newName: "IX_Comments_UserId");

            migrationBuilder.RenameIndex(
                name: "ix_comments_post_id",
                table: "Comments",
                newName: "IX_Comments_PostId");

            migrationBuilder.RenameIndex(
                name: "ix_comments_parent_id",
                table: "Comments",
                newName: "IX_Comments_ParentCommentId");

            migrationBuilder.RenameColumn(
                name: "capacity_lbs",
                table: "barrels",
                newName: "capacity");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "PostPhotos",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "sort_order",
                table: "PostPhotos",
                newName: "SortOrder");

            migrationBuilder.RenameColumn(
                name: "post_id",
                table: "PostPhotos",
                newName: "PostId");

            migrationBuilder.RenameColumn(
                name: "photo_id",
                table: "PostPhotos",
                newName: "PhotoId");

            migrationBuilder.RenameColumn(
                name: "is_cover",
                table: "PostPhotos",
                newName: "IsCover");

            migrationBuilder.RenameColumn(
                name: "date_updated",
                table: "PostPhotos",
                newName: "DateUpdated");

            migrationBuilder.RenameColumn(
                name: "date_created",
                table: "PostPhotos",
                newName: "DateCreated");

            migrationBuilder.RenameIndex(
                name: "ix_post_photos_post_id",
                table: "PostPhotos",
                newName: "IX_PostPhotos_PostId");

            migrationBuilder.RenameIndex(
                name: "ix_post_photos_photo_id",
                table: "PostPhotos",
                newName: "IX_PostPhotos_PhotoId");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "CommentReports",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "reason",
                table: "CommentReports",
                newName: "Reason");

            migrationBuilder.RenameColumn(
                name: "details",
                table: "CommentReports",
                newName: "Details");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "CommentReports",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "resolved_date",
                table: "CommentReports",
                newName: "ResolvedDate");

            migrationBuilder.RenameColumn(
                name: "resolved_by_user_id",
                table: "CommentReports",
                newName: "ResolvedByUserId");

            migrationBuilder.RenameColumn(
                name: "resolution_notes",
                table: "CommentReports",
                newName: "ResolutionNotes");

            migrationBuilder.RenameColumn(
                name: "reported_by_user_id",
                table: "CommentReports",
                newName: "ReportedByUserId");

            migrationBuilder.RenameColumn(
                name: "date_updated",
                table: "CommentReports",
                newName: "DateUpdated");

            migrationBuilder.RenameColumn(
                name: "date_created",
                table: "CommentReports",
                newName: "DateCreated");

            migrationBuilder.RenameColumn(
                name: "comment_id",
                table: "CommentReports",
                newName: "CommentId");

            migrationBuilder.RenameIndex(
                name: "IX_comment_reports_resolved_by_user_id",
                table: "CommentReports",
                newName: "IX_CommentReports_ResolvedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_comment_reports_reported_by_user_id",
                table: "CommentReports",
                newName: "IX_CommentReports_ReportedByUserId");

            migrationBuilder.RenameIndex(
                name: "ix_comment_reports_comment_id",
                table: "CommentReports",
                newName: "IX_CommentReports_CommentId");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Votes",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateUpdated",
                table: "Votes",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateCreated",
                table: "Votes",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "stage_runs",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AddColumn<Guid>(
                name: "barrel_id",
                table: "stage_runs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Posts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Posts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Posts",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AlterColumn<int>(
                name: "VoteCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                table: "Posts",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateUpdated",
                table: "Posts",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateCreated",
                table: "Posts",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "CommentCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Comments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AlterColumn<bool>(
                name: "IsEdited",
                table: "Comments",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                table: "Comments",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateUpdated",
                table: "Comments",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateCreated",
                table: "Comments",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AddColumn<bool>(
                name: "is_capacity_metric",
                table: "barrels",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "PostPhotos",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AlterColumn<int>(
                name: "SortOrder",
                table: "PostPhotos",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<bool>(
                name: "IsCover",
                table: "PostPhotos",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateUpdated",
                table: "PostPhotos",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateCreated",
                table: "PostPhotos",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "CommentReports",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "CommentReports",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateUpdated",
                table: "CommentReports",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateCreated",
                table: "CommentReports",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Votes",
                table: "Votes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Posts",
                table: "Posts",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Comments",
                table: "Comments",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PostPhotos",
                table: "PostPhotos",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CommentReports",
                table: "CommentReports",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "ix_stage_runs_barrel_id",
                table: "stage_runs",
                column: "barrel_id");

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_Comments_CommentId",
                table: "CommentReports",
                column: "CommentId",
                principalTable: "Comments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_users_ReportedByUserId",
                table: "CommentReports",
                column: "ReportedByUserId",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_users_ResolvedByUserId",
                table: "CommentReports",
                column: "ResolvedByUserId",
                principalTable: "users",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Comments_ParentCommentId",
                table: "Comments",
                column: "ParentCommentId",
                principalTable: "Comments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Posts_PostId",
                table: "Comments",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_users_UserId",
                table: "Comments",
                column: "UserId",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PostPhotos_Posts_PostId",
                table: "PostPhotos",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PostPhotos_photos_PhotoId",
                table: "PostPhotos",
                column: "PhotoId",
                principalTable: "photos",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_cycles_CycleId",
                table: "Posts",
                column: "CycleId",
                principalTable: "cycles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_users_UserId",
                table: "Posts",
                column: "UserId",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_stage_runs_barrels_barrel_id",
                table: "stage_runs",
                column: "barrel_id",
                principalTable: "barrels",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Votes_Posts_PostId",
                table: "Votes",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Votes_users_UserId",
                table: "Votes",
                column: "UserId",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
