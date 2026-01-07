using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddErrorLogging : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "error_logs",
                columns: table => new
                {
                    error_log_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    correlation_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    exception_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    stack_trace = table.Column<string>(type: "text", nullable: true),
                    severity = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    http_method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    http_path = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    http_query_string = table.Column<string>(type: "text", nullable: true),
                    http_status_code = table.Column<int>(type: "integer", nullable: true),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    request_headers = table.Column<string>(type: "text", nullable: true),
                    inner_exception = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_error_logs", x => x.error_log_id);
                    table.ForeignKey(
                        name: "FK_error_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_error_logs_correlation_id",
                table: "error_logs",
                column: "correlation_id");

            migrationBuilder.CreateIndex(
                name: "ix_error_logs_date_created",
                table: "error_logs",
                column: "date_created",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_error_logs_http_path",
                table: "error_logs",
                column: "http_path");

            migrationBuilder.CreateIndex(
                name: "ix_error_logs_severity",
                table: "error_logs",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "ix_error_logs_severity_date",
                table: "error_logs",
                columns: new[] { "severity", "date_created" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_error_logs_user_id",
                table: "error_logs",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "error_logs");
        }
    }
}
