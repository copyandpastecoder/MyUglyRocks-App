using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M2CoreTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tumbler_models",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tumbler_type = table.Column<int>(type: "integer", nullable: false),
                    default_capacity_lbs = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    default_barrel_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    is_custom_entry = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tumbler_models", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    role = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    email_verified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_email_verified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_last_login = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_password_changed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    failed_login_attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    lockout_end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    unlock_token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    unlock_token_expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    onboarding_completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_onboarding_completed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "barrel_nicknames",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    user_created = table.Column<Guid>(type: "uuid", nullable: true),
                    user_updated = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_barrel_nicknames", x => x.id);
                    table.ForeignKey(
                        name: "FK_barrel_nicknames_users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_barrel_nicknames_users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "cycles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    goal = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    difficulty_rating = table.Column<int>(type: "integer", nullable: true),
                    final_quality = table.Column<int>(type: "integer", nullable: true),
                    additional_specimens = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cycles", x => x.id);
                    table.ForeignKey(
                        name: "FK_cycles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "materials",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    common_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<int>(type: "integer", nullable: false),
                    material_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    material_size = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    usage_type = table.Column<int>(type: "integer", nullable: true),
                    mesh_size = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_cleaning = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    user_created = table.Column<Guid>(type: "uuid", nullable: false),
                    user_updated = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_materials", x => x.id);
                    table.ForeignKey(
                        name: "FK_materials_users_user_created",
                        column: x => x.user_created,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_materials_users_user_updated",
                        column: x => x.user_updated,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    date_expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_revoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_revoked = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    replaced_by_token_id = table.Column<Guid>(type: "uuid", nullable: true),
                    device_info = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_refresh_tokens_replaced_by_token_id",
                        column: x => x.replaced_by_token_id,
                        principalTable: "refresh_tokens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "specimens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    common_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    scientific_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    alias = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    rock_family = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    species = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    variety = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    material_type = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    mohs_hardness_min = table.Column<decimal>(type: "numeric(3,1)", precision: 3, scale: 1, nullable: true),
                    mohs_hardness_max = table.Column<decimal>(type: "numeric(3,1)", precision: 3, scale: 1, nullable: true),
                    tumbling_difficulty = table.Column<int>(type: "integer", nullable: true),
                    recommended_grit_sequence = table.Column<string>(type: "text", nullable: true),
                    special_considerations = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    user_created = table.Column<Guid>(type: "uuid", nullable: false),
                    user_updated = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_specimens", x => x.id);
                    table.ForeignKey(
                        name: "FK_specimens_users_user_created",
                        column: x => x.user_created,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_specimens_users_user_updated",
                        column: x => x.user_updated,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tumblers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tumbler_model_id = table.Column<Guid>(type: "uuid", nullable: true),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tumbler_type = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_generic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tumblers", x => x.id);
                    table.ForeignKey(
                        name: "FK_tumblers_tumbler_models_tumbler_model_id",
                        column: x => x.tumbler_model_id,
                        principalTable: "tumbler_models",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_tumblers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_settings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    measurement_system = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    date_format = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    time_format = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    timezone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "UTC"),
                    first_day_of_week = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    show_relative_times = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tracking_mode = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    font_size = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    density = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    default_home_section = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    notify_stage_reminders = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_comments = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_replies = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_ugly_rocks = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_recipe_cloned = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    quiet_hours_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    quiet_hours_start = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    quiet_hours_end = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    digest_frequency = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    photo_upload_quality = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    add_watermark = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    auto_fill_from_last_run = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    default_post_visibility = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    theme = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "obsidian"),
                    stage_field_visibility = table.Column<string>(type: "jsonb", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_settings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cycle_specimens",
                columns: table => new
                {
                    cycle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    specimen_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cycle_specimens", x => new { x.cycle_id, x.specimen_id });
                    table.ForeignKey(
                        name: "FK_cycle_specimens_cycles_cycle_id",
                        column: x => x.cycle_id,
                        principalTable: "cycles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cycle_specimens_specimens_specimen_id",
                        column: x => x.specimen_id,
                        principalTable: "specimens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "barrels",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tumbler_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrel_number = table.Column<int>(type: "integer", nullable: false),
                    nickname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    capacity = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    is_capacity_metric = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    default_grit_amount_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    is_dedicated = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    dedicated_stages = table.Column<string[]>(type: "varchar(100)[]", nullable: true),
                    date_last_deep_clean = table.Column<DateOnly>(type: "date", nullable: true),
                    contamination_notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_barrels", x => x.id);
                    table.ForeignKey(
                        name: "FK_barrels_tumblers_tumbler_id",
                        column: x => x.tumbler_id,
                        principalTable: "tumblers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stage_runs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    cycle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrel_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stage_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    start_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    duration_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    duration_hours = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    end_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_reminder_sent = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    remind_after_days = table.Column<int>(type: "integer", nullable: true),
                    remind_at_end_of_stage = table.Column<bool>(type: "boolean", nullable: true),
                    load_weight_before_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    load_weight_after_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    barrel_rpm = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    is_rpm_estimated = table.Column<bool>(type: "boolean", nullable: true),
                    fill_level_percent = table.Column<int>(type: "integer", nullable: true),
                    water_level = table.Column<int>(type: "integer", nullable: true),
                    result_rating = table.Column<int>(type: "integer", nullable: true),
                    result_shape_rounding = table.Column<int>(type: "integer", nullable: true),
                    result_scratch_level = table.Column<int>(type: "integer", nullable: true),
                    result_pitting = table.Column<int>(type: "integer", nullable: true),
                    result_shine = table.Column<int>(type: "integer", nullable: true),
                    issue_scratches = table.Column<bool>(type: "boolean", nullable: true),
                    issue_chips = table.Column<bool>(type: "boolean", nullable: true),
                    issue_under_rounded = table.Column<bool>(type: "boolean", nullable: true),
                    issue_contamination = table.Column<bool>(type: "boolean", nullable: true),
                    lessons_learned = table.Column<string>(type: "text", nullable: true),
                    next_action = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stage_runs", x => x.id);
                    table.ForeignKey(
                        name: "FK_stage_runs_barrels_barrel_id",
                        column: x => x.barrel_id,
                        principalTable: "barrels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stage_runs_cycles_cycle_id",
                        column: x => x.cycle_id,
                        principalTable: "cycles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cleaning_runs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    purpose = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_reminder_sent = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    result_notes = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cleaning_runs", x => x.id);
                    table.ForeignKey(
                        name: "FK_cleaning_runs_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "photos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    mime_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    width = table.Column<int>(type: "integer", nullable: true),
                    height = table.Column<int>(type: "integer", nullable: true),
                    photo_type = table.Column<int>(type: "integer", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photos", x => x.id);
                    table.ForeignKey(
                        name: "FK_photos_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stage_materials",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    material_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    display_unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    amount_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    amount_milliliters = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stage_materials", x => x.id);
                    table.ForeignKey(
                        name: "FK_stage_materials_materials_material_id",
                        column: x => x.material_id,
                        principalTable: "materials",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stage_materials_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cleaning_materials",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    cleaning_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    material_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    display_unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    amount_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    amount_milliliters = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cleaning_materials", x => x.id);
                    table.ForeignKey(
                        name: "FK_cleaning_materials_cleaning_runs_cleaning_run_id",
                        column: x => x.cleaning_run_id,
                        principalTable: "cleaning_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cleaning_materials_materials_material_id",
                        column: x => x.material_id,
                        principalTable: "materials",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_CreatedByUserId",
                table: "barrel_nicknames",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "ix_barrel_nicknames_is_active",
                table: "barrel_nicknames",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_barrel_nicknames_name",
                table: "barrel_nicknames",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_UpdatedByUserId",
                table: "barrel_nicknames",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "ix_barrels_is_active",
                table: "barrels",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_barrels_tumbler_id",
                table: "barrels",
                column: "tumbler_id");

            migrationBuilder.CreateIndex(
                name: "ix_cleaning_materials_cleaning_run_id",
                table: "cleaning_materials",
                column: "cleaning_run_id");

            migrationBuilder.CreateIndex(
                name: "ix_cleaning_materials_material_id",
                table: "cleaning_materials",
                column: "material_id");

            migrationBuilder.CreateIndex(
                name: "ix_cleaning_runs_stage_run_id",
                table: "cleaning_runs",
                column: "stage_run_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_cycle_specimens_specimen_id",
                table: "cycle_specimens",
                column: "specimen_id");

            migrationBuilder.CreateIndex(
                name: "ix_cycles_start_date",
                table: "cycles",
                column: "start_date");

            migrationBuilder.CreateIndex(
                name: "ix_cycles_status",
                table: "cycles",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_cycles_user_id",
                table: "cycles",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_cycles_user_id_status",
                table: "cycles",
                columns: new[] { "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_materials_category",
                table: "materials",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "ix_materials_is_active",
                table: "materials",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_materials_is_cleaning",
                table: "materials",
                column: "is_cleaning");

            migrationBuilder.CreateIndex(
                name: "IX_materials_user_created",
                table: "materials",
                column: "user_created");

            migrationBuilder.CreateIndex(
                name: "IX_materials_user_updated",
                table: "materials",
                column: "user_updated");

            migrationBuilder.CreateIndex(
                name: "ix_photos_photo_type",
                table: "photos",
                column: "photo_type");

            migrationBuilder.CreateIndex(
                name: "ix_photos_stage_run_id",
                table: "photos",
                column: "stage_run_id");

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_date_expires",
                table: "refresh_tokens",
                column: "date_expires");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_replaced_by_token_id",
                table: "refresh_tokens",
                column: "replaced_by_token_id");

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_token",
                table: "refresh_tokens",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_user_id",
                table: "refresh_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_specimens_common_name",
                table: "specimens",
                column: "common_name");

            migrationBuilder.CreateIndex(
                name: "ix_specimens_is_active",
                table: "specimens",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_specimens_user_created",
                table: "specimens",
                column: "user_created");

            migrationBuilder.CreateIndex(
                name: "IX_specimens_user_updated",
                table: "specimens",
                column: "user_updated");

            migrationBuilder.CreateIndex(
                name: "ix_stage_materials_material_id",
                table: "stage_materials",
                column: "material_id");

            migrationBuilder.CreateIndex(
                name: "ix_stage_materials_stage_run_id",
                table: "stage_materials",
                column: "stage_run_id");

            migrationBuilder.CreateIndex(
                name: "ix_stage_runs_barrel_id",
                table: "stage_runs",
                column: "barrel_id");

            migrationBuilder.CreateIndex(
                name: "ix_stage_runs_cycle_id",
                table: "stage_runs",
                column: "cycle_id");

            migrationBuilder.CreateIndex(
                name: "ix_stage_runs_end_date_time",
                table: "stage_runs",
                column: "end_date_time");

            migrationBuilder.CreateIndex(
                name: "ix_stage_runs_status",
                table: "stage_runs",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_tumbler_models_brand",
                table: "tumbler_models",
                column: "brand");

            migrationBuilder.CreateIndex(
                name: "ix_tumbler_models_is_active_sort_order",
                table: "tumbler_models",
                columns: new[] { "is_active", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_tumblers_is_active",
                table: "tumblers",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_tumblers_is_generic",
                table: "tumblers",
                column: "is_generic");

            migrationBuilder.CreateIndex(
                name: "IX_tumblers_tumbler_model_id",
                table: "tumblers",
                column: "tumbler_model_id");

            migrationBuilder.CreateIndex(
                name: "ix_tumblers_user_id",
                table: "tumblers",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_settings_user_id",
                table: "user_settings",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_lockout_end_time",
                table: "users",
                column: "lockout_end_time");

            migrationBuilder.CreateIndex(
                name: "ix_users_username",
                table: "users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "barrel_nicknames");

            migrationBuilder.DropTable(
                name: "cleaning_materials");

            migrationBuilder.DropTable(
                name: "cycle_specimens");

            migrationBuilder.DropTable(
                name: "photos");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "stage_materials");

            migrationBuilder.DropTable(
                name: "user_settings");

            migrationBuilder.DropTable(
                name: "cleaning_runs");

            migrationBuilder.DropTable(
                name: "specimens");

            migrationBuilder.DropTable(
                name: "materials");

            migrationBuilder.DropTable(
                name: "stage_runs");

            migrationBuilder.DropTable(
                name: "barrels");

            migrationBuilder.DropTable(
                name: "cycles");

            migrationBuilder.DropTable(
                name: "tumblers");

            migrationBuilder.DropTable(
                name: "tumbler_models");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
