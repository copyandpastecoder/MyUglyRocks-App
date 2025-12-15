using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MoveFieldsToInventorySpecimen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "condition",
                table: "inventory");

            migrationBuilder.AlterColumn<decimal>(
                name: "weight_grams",
                table: "inventory_specimens",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "condition",
                table: "inventory_specimens",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "cost",
                table: "inventory_specimens",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "quality_rating",
                table: "inventory_specimens",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "size_categories",
                table: "inventory_specimens",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "condition",
                table: "inventory_specimens");

            migrationBuilder.DropColumn(
                name: "cost",
                table: "inventory_specimens");

            migrationBuilder.DropColumn(
                name: "quality_rating",
                table: "inventory_specimens");

            migrationBuilder.DropColumn(
                name: "size_categories",
                table: "inventory_specimens");

            migrationBuilder.AlterColumn<decimal>(
                name: "weight_grams",
                table: "inventory_specimens",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "condition",
                table: "inventory",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
