using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTumblerNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add tumbler_number column with default value of 1
            migrationBuilder.AddColumn<int>(
                name: "tumbler_number",
                table: "tumblers",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            // Backfill existing tumblers: assign sequential numbers within brand/model groups
            // Ordered by date_created so older tumblers get lower numbers
            migrationBuilder.Sql(@"
                WITH numbered AS (
                    SELECT
                        tumbler_id,
                        ROW_NUMBER() OVER (
                            PARTITION BY user_id, LOWER(brand), LOWER(COALESCE(model, ''))
                            ORDER BY date_created
                        ) as tumbler_num
                    FROM tumblers
                    WHERE is_active = true
                )
                UPDATE tumblers t
                SET tumbler_number = n.tumbler_num
                FROM numbered n
                WHERE t.tumbler_id = n.tumbler_id;
            ");

            // Create index for efficient lookups
            migrationBuilder.CreateIndex(
                name: "ix_tumblers_user_brand_model_number",
                table: "tumblers",
                columns: new[] { "user_id", "brand", "model", "tumbler_number" },
                filter: "is_active = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_tumblers_user_brand_model_number",
                table: "tumblers");

            migrationBuilder.DropColumn(
                name: "tumbler_number",
                table: "tumblers");
        }
    }
}
