using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InventorySourceRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "status",
                table: "inventory_specimens",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "storage_location",
                table: "inventory_specimens",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "url",
                table: "inventory_specimens",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "inventory_source_id",
                table: "inventory",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "inventory_sources",
                columns: table => new
                {
                    inventory_source_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_type = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    contact_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_sources", x => x.inventory_source_id);
                    table.CheckConstraint("chk_inventory_sources_name_not_blank", "TRIM(name) <> ''");
                    table.ForeignKey(
                        name: "FK_inventory_sources_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_specimens_inventory_status",
                table: "inventory_specimens",
                columns: new[] { "inventory_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_specimens_status",
                table: "inventory_specimens",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_source_id",
                table: "inventory",
                column: "inventory_source_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_sources_user_active",
                table: "inventory_sources",
                columns: new[] { "user_id", "is_active" });

            // Case-insensitive unique index on (user_id, source_type, LOWER(TRIM(name)))
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ix_inventory_sources_user_type_name
                ON inventory_sources (user_id, source_type, LOWER(TRIM(name)));
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_inventory_sources_inventory_source_id",
                table: "inventory",
                column: "inventory_source_id",
                principalTable: "inventory_sources",
                principalColumn: "inventory_source_id",
                onDelete: ReferentialAction.Restrict);

            // =========================================================
            // DATA MIGRATION: Populate InventorySource from existing data
            // =========================================================

            // Phase 1: Create unique InventorySource records from existing Inventory data
            // Uses ROW_NUMBER() for portability. Maps Gift/Trade -> Contact (3)
            migrationBuilder.Sql(@"
                INSERT INTO inventory_sources (inventory_source_id, user_id, source_type, name, location, url, notes, is_active, date_created, date_updated)
                SELECT
                    gen_random_uuid(),
                    user_id,
                    mapped_source_type,
                    normalized_name,
                    NULLIF(TRIM(source_location), ''),
                    NULLIF(TRIM(source_url), ''),
                    migration_note,
                    true,
                    NOW(),
                    NOW()
                FROM (
                    SELECT
                        user_id,
                        mapped_source_type,
                        normalized_name,
                        source_location,
                        source_url,
                        migration_note,
                        ROW_NUMBER() OVER (
                            PARTITION BY user_id, mapped_source_type, LOWER(TRIM(normalized_name))
                            ORDER BY
                                (source_location IS NULL OR TRIM(source_location) = ''),
                                (source_url IS NULL OR TRIM(source_url) = ''),
                                acquired_date DESC NULLS LAST
                        ) AS rn
                    FROM (
                        SELECT
                            user_id,
                            CASE source_type WHEN 3 THEN 3 WHEN 4 THEN 3 ELSE source_type END AS mapped_source_type,
                            COALESCE(NULLIF(TRIM(source_name), ''),
                                CASE source_type
                                    WHEN 0 THEN 'Store' WHEN 1 THEN 'Online' WHEN 2 THEN 'Found'
                                    WHEN 3 THEN 'Contact (Gift)' WHEN 4 THEN 'Contact (Trade)' ELSE 'Other'
                                END
                            ) AS normalized_name,
                            source_location,
                            source_url,
                            acquired_date,
                            CASE WHEN source_type IN (3, 4) THEN 'Migrated from: ' ||
                                CASE source_type WHEN 3 THEN 'Gift' WHEN 4 THEN 'Trade' END
                            END AS migration_note
                        FROM inventory
                    ) AS normalized
                ) AS ranked
                WHERE rn = 1;
            ");

            // Phase 2: Link Inventory records to their InventorySource
            // Uses the same normalization logic as Phase 1 for matching
            migrationBuilder.Sql(@"
                UPDATE inventory i
                SET inventory_source_id = s.inventory_source_id
                FROM inventory_sources s
                WHERE i.user_id = s.user_id
                  AND s.source_type = (CASE i.source_type WHEN 3 THEN 3 WHEN 4 THEN 3 ELSE i.source_type END)
                  AND LOWER(TRIM(COALESCE(NULLIF(TRIM(i.source_name), ''),
                      CASE i.source_type
                          WHEN 0 THEN 'Store' WHEN 1 THEN 'Online' WHEN 2 THEN 'Found'
                          WHEN 3 THEN 'Contact (Gift)' WHEN 4 THEN 'Contact (Trade)' ELSE 'Other'
                      END
                  ))) = LOWER(TRIM(s.name));
            ");

            // Phase 3: Copy Status from Inventory to InventorySpecimen
            migrationBuilder.Sql(@"
                UPDATE inventory_specimens sp
                SET status = i.status
                FROM inventory i
                WHERE sp.inventory_id = i.inventory_id;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_inventory_sources_inventory_source_id",
                table: "inventory");

            migrationBuilder.DropTable(
                name: "inventory_sources");

            migrationBuilder.DropIndex(
                name: "ix_inventory_specimens_inventory_status",
                table: "inventory_specimens");

            migrationBuilder.DropIndex(
                name: "ix_inventory_specimens_status",
                table: "inventory_specimens");

            migrationBuilder.DropIndex(
                name: "ix_inventory_source_id",
                table: "inventory");

            migrationBuilder.DropColumn(
                name: "status",
                table: "inventory_specimens");

            migrationBuilder.DropColumn(
                name: "storage_location",
                table: "inventory_specimens");

            migrationBuilder.DropColumn(
                name: "url",
                table: "inventory_specimens");

            migrationBuilder.DropColumn(
                name: "inventory_source_id",
                table: "inventory");
        }
    }
}
