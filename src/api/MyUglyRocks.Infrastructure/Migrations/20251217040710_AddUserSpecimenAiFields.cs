using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSpecimenAiFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AiConfidenceScore",
                table: "user_specimens",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AiIsKnownSpecimen",
                table: "user_specimens",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiConfidenceScore",
                table: "user_specimens");

            migrationBuilder.DropColumn(
                name: "AiIsKnownSpecimen",
                table: "user_specimens");
        }
    }
}
