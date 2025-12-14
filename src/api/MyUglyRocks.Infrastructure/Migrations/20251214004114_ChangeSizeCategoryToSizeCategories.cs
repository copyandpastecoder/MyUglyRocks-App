using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeSizeCategoryToSizeCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First add the new column
            migrationBuilder.AddColumn<string>(
                name: "size_categories",
                table: "inventory",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            // Migrate existing data: convert enum int to string name
            migrationBuilder.Sql(@"
                UPDATE inventory SET size_categories =
                    CASE size_category
                        WHEN 0 THEN 'Mini'
                        WHEN 1 THEN 'Small'
                        WHEN 2 THEN 'Medium'
                        WHEN 3 THEN 'Large'
                        WHEN 4 THEN 'ExtraLarge'
                        WHEN 5 THEN 'Fist'
                        WHEN 6 THEN 'DoubleFist'
                        WHEN 7 THEN 'Mixed'
                        WHEN 8 THEN 'Assorted'
                    END
                WHERE size_category IS NOT NULL;
            ");

            // Then drop the old column
            migrationBuilder.DropColumn(
                name: "size_category",
                table: "inventory");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "size_categories",
                table: "inventory");

            migrationBuilder.AddColumn<int>(
                name: "size_category",
                table: "inventory",
                type: "integer",
                nullable: true);
        }
    }
}
