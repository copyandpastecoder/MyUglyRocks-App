using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCleaningRunNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "notes",
                table: "cleaning_runs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "cleaning_runs",
                type: "text",
                nullable: true);
        }
    }
}
