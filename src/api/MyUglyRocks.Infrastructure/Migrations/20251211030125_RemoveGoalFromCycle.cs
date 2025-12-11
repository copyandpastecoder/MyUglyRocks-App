using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGoalFromCycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "goal",
                table: "cycles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "goal",
                table: "cycles",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }
    }
}
