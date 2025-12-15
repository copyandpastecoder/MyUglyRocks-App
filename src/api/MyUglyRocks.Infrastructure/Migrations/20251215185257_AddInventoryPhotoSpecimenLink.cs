using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryPhotoSpecimenLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "inventory_specimen_id",
                table: "inventory_photos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_inventory_photos_inventory_specimen_id",
                table: "inventory_photos",
                column: "inventory_specimen_id");

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_photos_inventory_specimens_inventory_specimen_id",
                table: "inventory_photos",
                column: "inventory_specimen_id",
                principalTable: "inventory_specimens",
                principalColumn: "inventory_specimen_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_photos_inventory_specimens_inventory_specimen_id",
                table: "inventory_photos");

            migrationBuilder.DropIndex(
                name: "ix_inventory_photos_inventory_specimen_id",
                table: "inventory_photos");

            migrationBuilder.DropColumn(
                name: "inventory_specimen_id",
                table: "inventory_photos");
        }
    }
}
