using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrphanedColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove orphaned columns from stage_runs
            migrationBuilder.DropColumn(
                name: "barrel_rpm",
                table: "stage_runs");

            migrationBuilder.DropColumn(
                name: "is_rpm_estimated",
                table: "stage_runs");

            // Remove orphaned columns from barrels
            migrationBuilder.DropColumn(
                name: "date_last_deep_clean",
                table: "barrels");

            migrationBuilder.DropColumn(
                name: "contamination_notes",
                table: "barrels");

            // Remove orphaned Notes column from stage_materials
            migrationBuilder.DropColumn(
                name: "notes",
                table: "stage_materials");

            // Remove orphaned Notes column from cleaning_materials
            migrationBuilder.DropColumn(
                name: "notes",
                table: "cleaning_materials");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore stage_runs columns
            migrationBuilder.AddColumn<decimal>(
                name: "barrel_rpm",
                table: "stage_runs",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_rpm_estimated",
                table: "stage_runs",
                type: "boolean",
                nullable: true);

            // Restore barrels columns
            migrationBuilder.AddColumn<DateOnly>(
                name: "date_last_deep_clean",
                table: "barrels",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "contamination_notes",
                table: "barrels",
                type: "text",
                nullable: true);

            // Restore stage_materials Notes column
            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "stage_materials",
                type: "text",
                nullable: true);

            // Restore cleaning_materials Notes column
            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "cleaning_materials",
                type: "text",
                nullable: true);
        }
    }
}
