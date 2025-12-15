using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEstimatedPercentageFromInventorySpecimen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "estimated_percentage",
                table: "inventory_specimens");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "estimated_percentage",
                table: "inventory_specimens",
                type: "integer",
                nullable: true);
        }
    }
}
