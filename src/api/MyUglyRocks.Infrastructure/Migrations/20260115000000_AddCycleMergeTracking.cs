using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCycleMergeTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add MergedFromCycleIds column (JSON array of source cycle IDs)
            migrationBuilder.AddColumn<string>(
                name: "merged_from_cycle_ids",
                table: "cycles",
                type: "text",
                nullable: true);

            // Add MergedIntoCycleId column (target cycle ID)
            migrationBuilder.AddColumn<Guid>(
                name: "merged_into_cycle_id",
                table: "cycles",
                type: "uuid",
                nullable: true);

            // Add foreign key constraint
            migrationBuilder.AddForeignKey(
                name: "fk_cycles_merged_into_cycle",
                table: "cycles",
                column: "merged_into_cycle_id",
                principalTable: "cycles",
                principalColumn: "cycle_id",
                onDelete: ReferentialAction.SetNull);

            // Add index for querying merged cycles
            migrationBuilder.CreateIndex(
                name: "ix_cycles_merged_into_cycle_id",
                table: "cycles",
                column: "merged_into_cycle_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_cycles_merged_into_cycle_id",
                table: "cycles");

            migrationBuilder.DropForeignKey(
                name: "fk_cycles_merged_into_cycle",
                table: "cycles");

            migrationBuilder.DropColumn(
                name: "merged_from_cycle_ids",
                table: "cycles");

            migrationBuilder.DropColumn(
                name: "merged_into_cycle_id",
                table: "cycles");
        }
    }
}
