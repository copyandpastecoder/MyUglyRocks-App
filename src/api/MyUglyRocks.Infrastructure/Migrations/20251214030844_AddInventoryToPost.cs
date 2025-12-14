using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryToPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "cycle_id",
                table: "posts",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "inventory_id",
                table: "posts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_posts_inventory_id",
                table: "posts",
                column: "inventory_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_post_source_xor",
                table: "posts",
                sql: "(cycle_id IS NOT NULL AND inventory_id IS NULL) OR (cycle_id IS NULL AND inventory_id IS NOT NULL)");

            migrationBuilder.AddForeignKey(
                name: "FK_posts_inventory_inventory_id",
                table: "posts",
                column: "inventory_id",
                principalTable: "inventory",
                principalColumn: "inventory_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_posts_inventory_inventory_id",
                table: "posts");

            migrationBuilder.DropIndex(
                name: "ix_posts_inventory_id",
                table: "posts");

            migrationBuilder.DropCheckConstraint(
                name: "chk_post_source_xor",
                table: "posts");

            migrationBuilder.DropColumn(
                name: "inventory_id",
                table: "posts");

            migrationBuilder.AlterColumn<Guid>(
                name: "cycle_id",
                table: "posts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
