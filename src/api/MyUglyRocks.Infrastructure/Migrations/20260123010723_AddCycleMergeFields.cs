using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCycleMergeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "merged_from_cycle_ids",
                table: "cycles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "merged_into_cycle_id",
                table: "cycles",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_cycles_merged_into_cycle_id",
                table: "cycles",
                column: "merged_into_cycle_id");

            migrationBuilder.AddForeignKey(
                name: "FK_cycles_cycles_merged_into_cycle_id",
                table: "cycles",
                column: "merged_into_cycle_id",
                principalTable: "cycles",
                principalColumn: "cycle_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cycles_cycles_merged_into_cycle_id",
                table: "cycles");

            migrationBuilder.DropIndex(
                name: "ix_cycles_merged_into_cycle_id",
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
