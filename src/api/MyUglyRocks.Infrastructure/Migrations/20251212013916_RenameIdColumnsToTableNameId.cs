using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameIdColumnsToTableNameId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "id",
                table: "votes",
                newName: "vote_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "users",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "user_settings",
                newName: "user_settings_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "tumblers",
                newName: "tumbler_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "tumbler_models",
                newName: "tumbler_model_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "stage_runs",
                newName: "stage_run_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "stage_materials",
                newName: "stage_material_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "specimens",
                newName: "specimen_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "refresh_tokens",
                newName: "refresh_token_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "posts",
                newName: "post_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "post_photos",
                newName: "post_photo_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "photos",
                newName: "photo_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "materials",
                newName: "material_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "cycles",
                newName: "cycle_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "comments",
                newName: "comment_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "comment_reports",
                newName: "comment_report_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "cleaning_runs",
                newName: "cleaning_run_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "cleaning_materials",
                newName: "cleaning_material_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "barrels",
                newName: "barrel_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "barrel_nicknames",
                newName: "barrel_nickname_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "vote_id",
                table: "votes",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "user_settings_id",
                table: "user_settings",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "tumbler_id",
                table: "tumblers",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "tumbler_model_id",
                table: "tumbler_models",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "stage_run_id",
                table: "stage_runs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "stage_material_id",
                table: "stage_materials",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "specimen_id",
                table: "specimens",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "refresh_token_id",
                table: "refresh_tokens",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "post_id",
                table: "posts",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "post_photo_id",
                table: "post_photos",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "photo_id",
                table: "photos",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "material_id",
                table: "materials",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "cycle_id",
                table: "cycles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "comment_id",
                table: "comments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "comment_report_id",
                table: "comment_reports",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "cleaning_run_id",
                table: "cleaning_runs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "cleaning_material_id",
                table: "cleaning_materials",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "barrel_id",
                table: "barrels",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "barrel_nickname_id",
                table: "barrel_nicknames",
                newName: "id");
        }
    }
}
