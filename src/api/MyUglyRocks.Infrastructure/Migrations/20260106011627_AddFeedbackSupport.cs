using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_post_source_xor",
                table: "posts");

            migrationBuilder.AddColumn<int>(
                name: "feedback_category",
                table: "posts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "post_type",
                table: "posts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Update existing posts to set correct post_type
            // Cycle posts (already default to 0)
            migrationBuilder.Sql("UPDATE posts SET post_type = 0 WHERE cycle_id IS NOT NULL;");

            // Inventory posts
            migrationBuilder.Sql("UPDATE posts SET post_type = 1 WHERE inventory_id IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "ix_posts_feedback_category_status_date",
                table: "posts",
                columns: new[] { "post_type", "feedback_category", "status", "published_date" });

            migrationBuilder.AddCheckConstraint(
                name: "chk_post_source_xor",
                table: "posts",
                sql: "(post_type = 0 AND cycle_id IS NOT NULL AND inventory_id IS NULL) OR\r\n              (post_type = 1 AND cycle_id IS NULL AND inventory_id IS NOT NULL) OR\r\n              (post_type = 2 AND cycle_id IS NULL AND inventory_id IS NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_posts_feedback_category_status_date",
                table: "posts");

            migrationBuilder.DropCheckConstraint(
                name: "chk_post_source_xor",
                table: "posts");

            migrationBuilder.DropColumn(
                name: "feedback_category",
                table: "posts");

            migrationBuilder.DropColumn(
                name: "post_type",
                table: "posts");

            migrationBuilder.AddCheckConstraint(
                name: "chk_post_source_xor",
                table: "posts",
                sql: "(cycle_id IS NOT NULL AND inventory_id IS NULL) OR (cycle_id IS NULL AND inventory_id IS NOT NULL)");
        }
    }
}
