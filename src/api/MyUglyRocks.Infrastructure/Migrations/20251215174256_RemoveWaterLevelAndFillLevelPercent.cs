using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveWaterLevelAndFillLevelPercent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fill_level_percent",
                table: "stage_runs");

            migrationBuilder.DropColumn(
                name: "water_level",
                table: "stage_runs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "fill_level_percent",
                table: "stage_runs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "water_level",
                table: "stage_runs",
                type: "integer",
                nullable: true);
        }
    }
}
