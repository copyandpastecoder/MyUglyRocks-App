using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSpecimensTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_cycle_specimens",
                table: "cycle_specimens");

            migrationBuilder.AlterColumn<Guid>(
                name: "specimen_id",
                table: "cycle_specimens",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "cycle_specimen_id",
                table: "cycle_specimens",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "user_specimen_id",
                table: "cycle_specimens",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_cycle_specimens",
                table: "cycle_specimens",
                column: "cycle_specimen_id");

            migrationBuilder.CreateTable(
                name: "inventory",
                columns: table => new
                {
                    inventory_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    acquired_date = table.Column<DateOnly>(type: "date", nullable: false),
                    source_type = table.Column<int>(type: "integer", nullable: false),
                    source_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    source_location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    source_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    total_weight_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    remaining_weight_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    display_unit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "g"),
                    cost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    condition = table.Column<int>(type: "integer", nullable: false),
                    size_category = table.Column<int>(type: "integer", nullable: true),
                    quality_rating = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    storage_location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_favorite = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory", x => x.inventory_id);
                    table.ForeignKey(
                        name: "FK_inventory_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_specimens",
                columns: table => new
                {
                    user_specimen_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    common_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    scientific_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    alias = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    rock_family = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    species = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    variety = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    material_type = table.Column<int>(type: "integer", nullable: false),
                    mohs_hardness_min = table.Column<decimal>(type: "numeric(3,1)", precision: 3, scale: 1, nullable: true),
                    mohs_hardness_max = table.Column<decimal>(type: "numeric(3,1)", precision: 3, scale: 1, nullable: true),
                    tumbling_difficulty = table.Column<int>(type: "integer", nullable: true),
                    recommended_grit_sequence = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    special_considerations = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    based_on_specimen_id = table.Column<Guid>(type: "uuid", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_specimens", x => x.user_specimen_id);
                    table.ForeignKey(
                        name: "FK_user_specimens_specimens_based_on_specimen_id",
                        column: x => x.based_on_specimen_id,
                        principalTable: "specimens",
                        principalColumn: "specimen_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_specimens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inventory_photos",
                columns: table => new
                {
                    inventory_photo_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    inventory_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    mime_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    width = table.Column<int>(type: "integer", nullable: true),
                    height = table.Column<int>(type: "integer", nullable: true),
                    caption = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_cover = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    processing_status = table.Column<int>(type: "integer", nullable: false),
                    processing_error = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    thumbnail_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    medium_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    large_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    blur_hash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    thumbnail_storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    medium_storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    large_storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_photos", x => x.inventory_photo_id);
                    table.ForeignKey(
                        name: "FK_inventory_photos_inventory_inventory_id",
                        column: x => x.inventory_id,
                        principalTable: "inventory",
                        principalColumn: "inventory_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inventory_specimens",
                columns: table => new
                {
                    inventory_specimen_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    inventory_id = table.Column<Guid>(type: "uuid", nullable: false),
                    specimen_id = table.Column<Guid>(type: "uuid", nullable: true),
                    user_specimen_id = table.Column<Guid>(type: "uuid", nullable: true),
                    estimated_percentage = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_specimens", x => x.inventory_specimen_id);
                    table.CheckConstraint("chk_inventory_specimen_xor", "(specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR (specimen_id IS NULL AND user_specimen_id IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_inventory_specimens_inventory_inventory_id",
                        column: x => x.inventory_id,
                        principalTable: "inventory",
                        principalColumn: "inventory_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inventory_specimens_specimens_specimen_id",
                        column: x => x.specimen_id,
                        principalTable: "specimens",
                        principalColumn: "specimen_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_inventory_specimens_user_specimens_user_specimen_id",
                        column: x => x.user_specimen_id,
                        principalTable: "user_specimens",
                        principalColumn: "user_specimen_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_cycle_specimens_cycle_id",
                table: "cycle_specimens",
                column: "cycle_id");

            migrationBuilder.CreateIndex(
                name: "ix_cycle_specimens_user_specimen_id",
                table: "cycle_specimens",
                column: "user_specimen_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_cycle_specimen_xor",
                table: "cycle_specimens",
                sql: "(specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR (specimen_id IS NULL AND user_specimen_id IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_acquired_date",
                table: "inventory",
                column: "acquired_date");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_is_favorite",
                table: "inventory",
                column: "is_favorite");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_status",
                table: "inventory",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_user_id",
                table: "inventory",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_user_id_status",
                table: "inventory",
                columns: new[] { "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_photos_inventory_id",
                table: "inventory_photos",
                column: "inventory_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_photos_is_cover",
                table: "inventory_photos",
                column: "is_cover");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_specimens_inventory_id",
                table: "inventory_specimens",
                column: "inventory_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_specimens_specimen_id",
                table: "inventory_specimens",
                column: "specimen_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_specimens_user_specimen_id",
                table: "inventory_specimens",
                column: "user_specimen_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_specimens_based_on_specimen_id",
                table: "user_specimens",
                column: "based_on_specimen_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_specimens_is_public",
                table: "user_specimens",
                column: "is_public");

            migrationBuilder.CreateIndex(
                name: "ix_user_specimens_user_id",
                table: "user_specimens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_specimens_user_id_common_name",
                table: "user_specimens",
                columns: new[] { "user_id", "common_name" });

            migrationBuilder.AddForeignKey(
                name: "FK_cycle_specimens_user_specimens_user_specimen_id",
                table: "cycle_specimens",
                column: "user_specimen_id",
                principalTable: "user_specimens",
                principalColumn: "user_specimen_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cycle_specimens_user_specimens_user_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.DropTable(
                name: "inventory_photos");

            migrationBuilder.DropTable(
                name: "inventory_specimens");

            migrationBuilder.DropTable(
                name: "inventory");

            migrationBuilder.DropTable(
                name: "user_specimens");

            migrationBuilder.DropPrimaryKey(
                name: "PK_cycle_specimens",
                table: "cycle_specimens");

            migrationBuilder.DropIndex(
                name: "ix_cycle_specimens_cycle_id",
                table: "cycle_specimens");

            migrationBuilder.DropIndex(
                name: "ix_cycle_specimens_user_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.DropCheckConstraint(
                name: "chk_cycle_specimen_xor",
                table: "cycle_specimens");

            migrationBuilder.DropColumn(
                name: "cycle_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.DropColumn(
                name: "user_specimen_id",
                table: "cycle_specimens");

            migrationBuilder.AlterColumn<Guid>(
                name: "specimen_id",
                table: "cycle_specimens",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_cycle_specimens",
                table: "cycle_specimens",
                columns: new[] { "cycle_id", "specimen_id" });
        }
    }
}
