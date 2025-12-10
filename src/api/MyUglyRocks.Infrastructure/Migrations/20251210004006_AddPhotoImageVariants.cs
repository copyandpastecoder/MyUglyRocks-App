using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoImageVariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlurHash",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LargeStorageKey",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LargeUrl",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediumStorageKey",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediumUrl",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailStorageKey",
                table: "photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "photos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlurHash",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "LargeStorageKey",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "LargeUrl",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "MediumStorageKey",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "MediumUrl",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "ThumbnailStorageKey",
                table: "photos");

            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "photos");
        }
    }
}
