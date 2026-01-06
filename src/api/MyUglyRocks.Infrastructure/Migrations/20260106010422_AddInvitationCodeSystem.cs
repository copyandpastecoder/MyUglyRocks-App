using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitationCodeSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "invited_by_user_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "invitation_codes",
                columns: table => new
                {
                    invitation_code_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    used_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    date_used = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_revoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    date_revoked = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revoked_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    date_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invitation_codes", x => x.invitation_code_id);
                    table.ForeignKey(
                        name: "FK_invitation_codes_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_invitation_codes_users_revoked_by_user_id",
                        column: x => x.revoked_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_invitation_codes_users_used_by_user_id",
                        column: x => x.used_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_invited_by_user_id",
                table: "users",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_invitation_codes_code",
                table: "invitation_codes",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_invitation_codes_created_by_user_id",
                table: "invitation_codes",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_invitation_codes_date_created",
                table: "invitation_codes",
                column: "date_created");

            migrationBuilder.CreateIndex(
                name: "IX_invitation_codes_revoked_by_user_id",
                table: "invitation_codes",
                column: "revoked_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_invitation_codes_revoked_expires",
                table: "invitation_codes",
                columns: new[] { "is_revoked", "date_expires" },
                filter: "is_revoked = false");

            migrationBuilder.CreateIndex(
                name: "ix_invitation_codes_used_by_user_id",
                table: "invitation_codes",
                column: "used_by_user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_users_users_invited_by_user_id",
                table: "users",
                column: "invited_by_user_id",
                principalTable: "users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_users_invited_by_user_id",
                table: "users");

            migrationBuilder.DropTable(
                name: "invitation_codes");

            migrationBuilder.DropIndex(
                name: "IX_users_invited_by_user_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "invited_by_user_id",
                table: "users");
        }
    }
}
