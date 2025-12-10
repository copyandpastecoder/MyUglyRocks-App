using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSessionAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_UserSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSessions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_SessionStart",
                table: "UserSessions",
                column: "SessionStart");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId",
                table: "UserSessions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSessions");
        }
    }
}
