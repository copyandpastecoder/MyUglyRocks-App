using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSizeCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update existing size categories to new values
            // Old: Mini, Small, Medium, Large, ExtraLarge, Fist, DoubleFist, Mixed, Assorted
            // New: ZeroToOne, OneToTwo, TwoToThree, ThreeToFour, FourToFive, GreaterThanFive, Assorted

            // Map old values to new values (approximate size ranges)
            // Mini (1/8" - 1/2") -> ZeroToOne (0 - 1")
            // Small (1/2" - 1") -> ZeroToOne (0 - 1")
            // Medium (1" - 1.5") -> OneToTwo (1" - 2")
            // Large (1.5" - 2") -> OneToTwo (1" - 2")
            // ExtraLarge (2" - 2.5") -> TwoToThree (2" - 3")
            // Fist -> FourToFive (4" - 5")
            // DoubleFist -> GreaterThanFive (> 5")
            // Mixed -> Assorted
            // Assorted -> Assorted (unchanged)

            migrationBuilder.Sql(@"
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'Mini', 'ZeroToOne');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'Small', 'ZeroToOne');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'Medium', 'OneToTwo');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'Large', 'OneToTwo');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'ExtraLarge', 'TwoToThree');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'DoubleFist', 'GreaterThanFive');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'Fist', 'FourToFive');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'Mixed', 'Assorted');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse mapping (best effort)
            migrationBuilder.Sql(@"
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'ZeroToOne', 'Small');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'OneToTwo', 'Medium');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'TwoToThree', 'ExtraLarge');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'ThreeToFour', 'ExtraLarge');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'FourToFive', 'Fist');
                UPDATE inventory SET size_categories = REPLACE(size_categories, 'GreaterThanFive', 'DoubleFist');
            ");
        }
    }
}
