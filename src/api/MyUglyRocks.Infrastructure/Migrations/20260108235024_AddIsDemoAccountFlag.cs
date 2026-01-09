using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDemoAccountFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDemoAccount",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Partial index for efficient querying of demo accounts only
            migrationBuilder.Sql(@"
                CREATE INDEX idx_users_is_demo_account
                ON users(""IsDemoAccount"")
                WHERE ""IsDemoAccount"" = TRUE;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS idx_users_is_demo_account;");

            migrationBuilder.DropColumn(
                name: "IsDemoAccount",
                table: "users");
        }
    }
}
