using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventorySpecimenToCycleSpecimen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "inventory_specimen_id",
                table: "cycle_specimens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "mark_depleted_on_complete",
                table: "cycle_specimens",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_cycle_specimens_inventory_specimen_id",
                table: "cycle_specimens",
                column: "inventory_specimen_id");

            migrationBuilder.AddForeignKey(
                name: "FK_cycle_specimens_inventory_specimens_inventory_specimen_id",
                table: "cycle_specimens",
                column: "inventory_specimen_id",
                principalTable: "inventory_specimens",
                principalColumn: "inventory_specimen_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cycle_specimens_inventory_specimens_inventory_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.DropIndex(
                name: "ix_cycle_specimens_inventory_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.DropColumn(
                name: "inventory_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.DropColumn(
                name: "mark_depleted_on_complete",
                table: "cycle_specimens");
        }
    }
}
