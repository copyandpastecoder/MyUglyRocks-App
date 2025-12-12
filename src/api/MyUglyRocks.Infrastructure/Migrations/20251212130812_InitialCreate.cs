using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tumbler_models",
                columns: table => new
                {
                    tumbler_model_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tumbler_type = table.Column<int>(type: "integer", nullable: false),
                    default_capacity_lbs = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    default_barrel_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    motor_capacity_lbs = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    is_custom_entry = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tumbler_models", x => x.tumbler_model_id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
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
                    table.PrimaryKey("PK_users", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "WaitlistEntries",
                columns: table => new
                {
                    waitlist_entry_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    NotificationSent = table.Column<bool>(type: "boolean", nullable: false),
                    DateNotificationSent = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaitlistEntries", x => x.waitlist_entry_id);
                });

            migrationBuilder.CreateTable(
                name: "barrel_nicknames",
                columns: table => new
                {
                    barrel_nickname_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    user_created = table.Column<Guid>(type: "uuid", nullable: true),
                    user_updated = table.Column<Guid>(type: "uuid", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_barrel_nicknames", x => x.barrel_nickname_id);
                    table.ForeignKey(
                        name: "FK_barrel_nicknames_users_user_created",
                        column: x => x.user_created,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_barrel_nicknames_users_user_updated",
                        column: x => x.user_updated,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "cycles",
                columns: table => new
                {
                    cycle_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_cycles", x => x.cycle_id);
                    table.ForeignKey(
                        name: "FK_cycles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "materials",
                columns: table => new
                {
                    material_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
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
                    table.PrimaryKey("PK_materials", x => x.material_id);
                    table.ForeignKey(
                        name: "FK_materials_users_user_created",
                        column: x => x.user_created,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_materials_users_user_updated",
                        column: x => x.user_updated,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    refresh_token_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
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
                    table.PrimaryKey("PK_refresh_tokens", x => x.refresh_token_id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_refresh_tokens_replaced_by_token_id",
                        column: x => x.replaced_by_token_id,
                        principalTable: "refresh_tokens",
                        principalColumn: "refresh_token_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "specimens",
                columns: table => new
                {
                    specimen_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
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
                    table.PrimaryKey("PK_specimens", x => x.specimen_id);
                    table.ForeignKey(
                        name: "FK_specimens_users_user_created",
                        column: x => x.user_created,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_specimens_users_user_updated",
                        column: x => x.user_updated,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tumblers",
                columns: table => new
                {
                    tumbler_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tumbler_model_id = table.Column<Guid>(type: "uuid", nullable: true),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tumbler_type = table.Column<int>(type: "integer", nullable: false),
                    motor_capacity_lbs = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    is_generic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tumblers", x => x.tumbler_id);
                    table.ForeignKey(
                        name: "FK_tumblers_tumbler_models_tumbler_model_id",
                        column: x => x.tumbler_model_id,
                        principalTable: "tumbler_models",
                        principalColumn: "tumbler_model_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_tumblers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_settings",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    measurement_system = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    date_format = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    time_format = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    timezone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "UTC"),
                    first_day_of_week = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    show_relative_times = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
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
                    digest_frequency = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    photo_upload_quality = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    add_watermark = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    auto_fill_from_last_run = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    default_post_visibility = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    theme = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "lapis-lazuli"),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_user_settings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSessions",
                columns: table => new
                {
                    user_session_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserAgent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    BrowserName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    BrowserVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    BrowserMajorVersion = table.Column<int>(type: "integer", nullable: true),
                    OsName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    OsVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    DeviceType = table.Column<int>(type: "integer", nullable: false),
                    ScreenWidth = table.Column<int>(type: "integer", nullable: true),
                    ScreenHeight = table.Column<int>(type: "integer", nullable: true),
                    SupportsWebP = table.Column<bool>(type: "boolean", nullable: true),
                    SupportsAvif = table.Column<bool>(type: "boolean", nullable: true),
                    Country = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    Timezone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Language = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ReferrerDomain = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    SessionStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SessionEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SessionDurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    PageViewCount = table.Column<int>(type: "integer", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.user_session_id);
                    table.ForeignKey(
                        name: "FK_UserSessions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "posts",
                columns: table => new
                {
                    post_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cycle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    published_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    vote_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    comment_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_posts", x => x.post_id);
                    table.ForeignKey(
                        name: "FK_posts_cycles_cycle_id",
                        column: x => x.cycle_id,
                        principalTable: "cycles",
                        principalColumn: "cycle_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_posts_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stage_runs",
                columns: table => new
                {
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    cycle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stage_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RunNumber = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    start_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    duration_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    duration_hours = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    end_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    remind_after_days = table.Column<int>(type: "integer", nullable: true),
                    remind_at_end_of_stage = table.Column<bool>(type: "boolean", nullable: true),
                    date_reminder_sent = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    load_weight_before_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    load_weight_after_grams = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    barrel_rpm = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    is_rpm_estimated = table.Column<bool>(type: "boolean", nullable: true),
                    fill_level_percent = table.Column<int>(type: "integer", nullable: true),
                    water_level = table.Column<int>(type: "integer", nullable: true),
                    water_amount_ml = table.Column<int>(type: "integer", nullable: true),
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
                    table.PrimaryKey("PK_stage_runs", x => x.stage_run_id);
                    table.ForeignKey(
                        name: "FK_stage_runs_cycles_cycle_id",
                        column: x => x.cycle_id,
                        principalTable: "cycles",
                        principalColumn: "cycle_id",
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
                        principalColumn: "cycle_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cycle_specimens_specimens_specimen_id",
                        column: x => x.specimen_id,
                        principalTable: "specimens",
                        principalColumn: "specimen_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "barrels",
                columns: table => new
                {
                    barrel_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tumbler_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrel_number = table.Column<int>(type: "integer", nullable: false),
                    nickname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    capacity_lbs = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
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
                    table.PrimaryKey("PK_barrels", x => x.barrel_id);
                    table.ForeignKey(
                        name: "FK_barrels_tumblers_tumbler_id",
                        column: x => x.tumbler_id,
                        principalTable: "tumblers",
                        principalColumn: "tumbler_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "comments",
                columns: table => new
                {
                    comment_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    parent_comment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    is_edited = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    edited_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_comments", x => x.comment_id);
                    table.ForeignKey(
                        name: "FK_comments_comments_parent_comment_id",
                        column: x => x.parent_comment_id,
                        principalTable: "comments",
                        principalColumn: "comment_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_comments_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "post_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_comments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "votes",
                columns: table => new
                {
                    vote_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_votes", x => x.vote_id);
                    table.ForeignKey(
                        name: "FK_votes_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "post_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_votes_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cleaning_runs",
                columns: table => new
                {
                    cleaning_run_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    purpose = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_reminder_sent = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    result_notes = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cleaning_runs", x => x.cleaning_run_id);
                    table.ForeignKey(
                        name: "FK_cleaning_runs_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "stage_run_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "photos",
                columns: table => new
                {
                    photo_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    mime_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    width = table.Column<int>(type: "integer", nullable: true),
                    height = table.Column<int>(type: "integer", nullable: true),
                    photo_type = table.Column<int>(type: "integer", nullable: false),
                    Caption = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ProcessingStatus = table.Column<int>(type: "integer", nullable: false),
                    ProcessingError = table.Column<string>(type: "text", nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "text", nullable: true),
                    MediumUrl = table.Column<string>(type: "text", nullable: true),
                    LargeUrl = table.Column<string>(type: "text", nullable: true),
                    BlurHash = table.Column<string>(type: "text", nullable: true),
                    ThumbnailStorageKey = table.Column<string>(type: "text", nullable: true),
                    MediumStorageKey = table.Column<string>(type: "text", nullable: true),
                    LargeStorageKey = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_deleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_photos", x => x.photo_id);
                    table.ForeignKey(
                        name: "FK_photos_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "stage_run_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stage_materials",
                columns: table => new
                {
                    stage_material_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
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
                    table.PrimaryKey("PK_stage_materials", x => x.stage_material_id);
                    table.ForeignKey(
                        name: "FK_stage_materials_materials_material_id",
                        column: x => x.material_id,
                        principalTable: "materials",
                        principalColumn: "material_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stage_materials_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "stage_run_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stage_run_barrels",
                columns: table => new
                {
                    stage_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrel_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stage_run_barrels", x => new { x.stage_run_id, x.barrel_id });
                    table.ForeignKey(
                        name: "FK_stage_run_barrels_barrels_barrel_id",
                        column: x => x.barrel_id,
                        principalTable: "barrels",
                        principalColumn: "barrel_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stage_run_barrels_stage_runs_stage_run_id",
                        column: x => x.stage_run_id,
                        principalTable: "stage_runs",
                        principalColumn: "stage_run_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "comment_reports",
                columns: table => new
                {
                    comment_report_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    comment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reported_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<int>(type: "integer", nullable: false),
                    details = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    resolved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    resolved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resolution_notes = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_comment_reports", x => x.comment_report_id);
                    table.ForeignKey(
                        name: "FK_comment_reports_comments_comment_id",
                        column: x => x.comment_id,
                        principalTable: "comments",
                        principalColumn: "comment_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_comment_reports_users_reported_by_user_id",
                        column: x => x.reported_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_comment_reports_users_resolved_by_user_id",
                        column: x => x.resolved_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "cleaning_materials",
                columns: table => new
                {
                    cleaning_material_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
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
                    table.PrimaryKey("PK_cleaning_materials", x => x.cleaning_material_id);
                    table.ForeignKey(
                        name: "FK_cleaning_materials_cleaning_runs_cleaning_run_id",
                        column: x => x.cleaning_run_id,
                        principalTable: "cleaning_runs",
                        principalColumn: "cleaning_run_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cleaning_materials_materials_material_id",
                        column: x => x.material_id,
                        principalTable: "materials",
                        principalColumn: "material_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "post_photos",
                columns: table => new
                {
                    post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    photo_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_cover = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_photos", x => new { x.post_id, x.photo_id });
                    table.ForeignKey(
                        name: "FK_post_photos_photos_photo_id",
                        column: x => x.photo_id,
                        principalTable: "photos",
                        principalColumn: "photo_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_post_photos_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "post_id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "IX_barrel_nicknames_user_created",
                table: "barrel_nicknames",
                column: "user_created");

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_user_updated",
                table: "barrel_nicknames",
                column: "user_updated");

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
                name: "ix_comment_reports_comment_id",
                table: "comment_reports",
                column: "comment_id");

            migrationBuilder.CreateIndex(
                name: "ix_comment_reports_comment_reporter",
                table: "comment_reports",
                columns: new[] { "comment_id", "reported_by_user_id" });

            migrationBuilder.CreateIndex(
                name: "IX_comment_reports_reported_by_user_id",
                table: "comment_reports",
                column: "reported_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_comment_reports_resolved_by_user_id",
                table: "comment_reports",
                column: "resolved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_comment_reports_status",
                table: "comment_reports",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_comment_reports_status_date",
                table: "comment_reports",
                columns: new[] { "status", "date_created" });

            migrationBuilder.CreateIndex(
                name: "ix_comments_parent_id",
                table: "comments",
                column: "parent_comment_id");

            migrationBuilder.CreateIndex(
                name: "ix_comments_post_date",
                table: "comments",
                columns: new[] { "post_id", "date_created" });

            migrationBuilder.CreateIndex(
                name: "ix_comments_post_id",
                table: "comments",
                column: "post_id");

            migrationBuilder.CreateIndex(
                name: "ix_comments_post_parent",
                table: "comments",
                columns: new[] { "post_id", "parent_comment_id" });

            migrationBuilder.CreateIndex(
                name: "ix_comments_user_id",
                table: "comments",
                column: "user_id");

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
                name: "ix_post_photos_photo_id",
                table: "post_photos",
                column: "photo_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_photos_post_id",
                table: "post_photos",
                column: "post_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_photos_post_sort",
                table: "post_photos",
                columns: new[] { "post_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_posts_cycle_id",
                table: "posts",
                column: "cycle_id");

            migrationBuilder.CreateIndex(
                name: "ix_posts_published_date",
                table: "posts",
                column: "published_date");

            migrationBuilder.CreateIndex(
                name: "ix_posts_status",
                table: "posts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_posts_status_comment_count",
                table: "posts",
                columns: new[] { "status", "comment_count" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_status_published_date",
                table: "posts",
                columns: new[] { "status", "published_date" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_status_vote_count",
                table: "posts",
                columns: new[] { "status", "vote_count" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_user_id",
                table: "posts",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_posts_user_status_date",
                table: "posts",
                columns: new[] { "user_id", "status", "published_date" });

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
                name: "ix_stage_run_barrels_barrel_id",
                table: "stage_run_barrels",
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

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_SessionStart",
                table: "UserSessions",
                column: "SessionStart");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId",
                table: "UserSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "ix_votes_post_id",
                table: "votes",
                column: "post_id");

            migrationBuilder.CreateIndex(
                name: "ix_votes_post_user_unique",
                table: "votes",
                columns: new[] { "post_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_votes_user_id",
                table: "votes",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_WaitlistEntries_Email",
                table: "WaitlistEntries",
                column: "Email",
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
                name: "comment_reports");

            migrationBuilder.DropTable(
                name: "cycle_specimens");

            migrationBuilder.DropTable(
                name: "post_photos");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "stage_materials");

            migrationBuilder.DropTable(
                name: "stage_run_barrels");

            migrationBuilder.DropTable(
                name: "user_settings");

            migrationBuilder.DropTable(
                name: "UserSessions");

            migrationBuilder.DropTable(
                name: "votes");

            migrationBuilder.DropTable(
                name: "WaitlistEntries");

            migrationBuilder.DropTable(
                name: "cleaning_runs");

            migrationBuilder.DropTable(
                name: "comments");

            migrationBuilder.DropTable(
                name: "specimens");

            migrationBuilder.DropTable(
                name: "photos");

            migrationBuilder.DropTable(
                name: "materials");

            migrationBuilder.DropTable(
                name: "barrels");

            migrationBuilder.DropTable(
                name: "posts");

            migrationBuilder.DropTable(
                name: "stage_runs");

            migrationBuilder.DropTable(
                name: "tumblers");

            migrationBuilder.DropTable(
                name: "cycles");

            migrationBuilder.DropTable(
                name: "tumbler_models");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
