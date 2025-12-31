using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOriginalPhotoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add original photo fields to photos table
            migrationBuilder.AddColumn<string>(
                name: "OriginalStorageKey",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalUrl",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalMimeType",
                table: "photos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "OriginalFileSizeBytes",
                table: "photos",
                type: "bigint",
                nullable: true);

            // Add original photo fields to inventory_photos table
            migrationBuilder.AddColumn<string>(
                name: "OriginalStorageKey",
                table: "inventory_photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalUrl",
                table: "inventory_photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalMimeType",
                table: "inventory_photos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "OriginalFileSizeBytes",
                table: "inventory_photos",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop original photo fields from photos table
            migrationBuilder.DropColumn(
                name: "OriginalStorageKey",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "OriginalUrl",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "OriginalMimeType",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "OriginalFileSizeBytes",
                table: "photos");

            // Drop original photo fields from inventory_photos table
            migrationBuilder.DropColumn(
                name: "OriginalStorageKey",
                table: "inventory_photos");

            migrationBuilder.DropColumn(
                name: "OriginalUrl",
                table: "inventory_photos");

            migrationBuilder.DropColumn(
                name: "OriginalMimeType",
                table: "inventory_photos");

            migrationBuilder.DropColumn(
                name: "OriginalFileSizeBytes",
                table: "inventory_photos");
        }
    }
}
