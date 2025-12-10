using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyUglyRocks.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameIdToEntitySpecificId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_barrel_nicknames_users_CreatedByUserId",
                table: "barrel_nicknames");

            migrationBuilder.DropForeignKey(
                name: "FK_barrel_nicknames_users_UpdatedByUserId",
                table: "barrel_nicknames");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WaitlistEntries",
                table: "WaitlistEntries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserSessions",
                table: "UserSessions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_user_settings",
                table: "user_settings");

            migrationBuilder.DropIndex(
                name: "ix_user_settings_user_id",
                table: "user_settings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_post_photos",
                table: "post_photos");

            migrationBuilder.DropIndex(
                name: "IX_barrel_nicknames_CreatedByUserId",
                table: "barrel_nicknames");

            migrationBuilder.DropIndex(
                name: "IX_barrel_nicknames_UpdatedByUserId",
                table: "barrel_nicknames");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "WaitlistEntries");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "id",
                table: "user_settings");

            migrationBuilder.DropColumn(
                name: "id",
                table: "post_photos");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "barrel_nicknames");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "barrel_nicknames");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "votes",
                newName: "vote_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "users",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "tumblers",
                newName: "tumbler_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "tumbler_models",
                newName: "tumbler_model_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "stage_runs",
                newName: "stage_run_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "stage_materials",
                newName: "stage_material_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "specimens",
                newName: "specimen_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "refresh_tokens",
                newName: "refresh_token_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "posts",
                newName: "post_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "photos",
                newName: "photo_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "materials",
                newName: "material_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "cycles",
                newName: "cycle_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "comments",
                newName: "comment_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "comment_reports",
                newName: "comment_report_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "cleaning_runs",
                newName: "cleaning_run_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "cleaning_materials",
                newName: "cleaning_material_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "barrels",
                newName: "barrel_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "barrel_nicknames",
                newName: "barrel_nickname_id");

            migrationBuilder.AddColumn<Guid>(
                name: "waitlist_entry_id",
                table: "WaitlistEntries",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "user_session_id",
                table: "UserSessions",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WaitlistEntries",
                table: "WaitlistEntries",
                column: "waitlist_entry_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserSessions",
                table: "UserSessions",
                column: "user_session_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_settings",
                table: "user_settings",
                column: "user_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_post_photos",
                table: "post_photos",
                columns: new[] { "post_id", "photo_id" });

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_user_created",
                table: "barrel_nicknames",
                column: "user_created");

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_user_updated",
                table: "barrel_nicknames",
                column: "user_updated");

            migrationBuilder.AddForeignKey(
                name: "FK_barrel_nicknames_users_user_created",
                table: "barrel_nicknames",
                column: "user_created",
                principalTable: "users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_barrel_nicknames_users_user_updated",
                table: "barrel_nicknames",
                column: "user_updated",
                principalTable: "users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_barrel_nicknames_users_user_created",
                table: "barrel_nicknames");

            migrationBuilder.DropForeignKey(
                name: "FK_barrel_nicknames_users_user_updated",
                table: "barrel_nicknames");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WaitlistEntries",
                table: "WaitlistEntries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserSessions",
                table: "UserSessions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_user_settings",
                table: "user_settings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_post_photos",
                table: "post_photos");

            migrationBuilder.DropIndex(
                name: "IX_barrel_nicknames_user_created",
                table: "barrel_nicknames");

            migrationBuilder.DropIndex(
                name: "IX_barrel_nicknames_user_updated",
                table: "barrel_nicknames");

            migrationBuilder.DropColumn(
                name: "waitlist_entry_id",
                table: "WaitlistEntries");

            migrationBuilder.DropColumn(
                name: "user_session_id",
                table: "UserSessions");

            migrationBuilder.RenameColumn(
                name: "vote_id",
                table: "votes",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "tumbler_id",
                table: "tumblers",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "tumbler_model_id",
                table: "tumbler_models",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "stage_run_id",
                table: "stage_runs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "stage_material_id",
                table: "stage_materials",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "specimen_id",
                table: "specimens",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "refresh_token_id",
                table: "refresh_tokens",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "post_id",
                table: "posts",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "photo_id",
                table: "photos",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "material_id",
                table: "materials",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "cycle_id",
                table: "cycles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "comment_id",
                table: "comments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "comment_report_id",
                table: "comment_reports",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "cleaning_run_id",
                table: "cleaning_runs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "cleaning_material_id",
                table: "cleaning_materials",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "barrel_id",
                table: "barrels",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "barrel_nickname_id",
                table: "barrel_nicknames",
                newName: "id");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "WaitlistEntries",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "UserSessions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "id",
                table: "user_settings",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "id",
                table: "post_photos",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "barrel_nicknames",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "barrel_nicknames",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_WaitlistEntries",
                table: "WaitlistEntries",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserSessions",
                table: "UserSessions",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_settings",
                table: "user_settings",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_post_photos",
                table: "post_photos",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_user_settings_user_id",
                table: "user_settings",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_CreatedByUserId",
                table: "barrel_nicknames",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_barrel_nicknames_UpdatedByUserId",
                table: "barrel_nicknames",
                column: "UpdatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_barrel_nicknames_users_CreatedByUserId",
                table: "barrel_nicknames",
                column: "CreatedByUserId",
                principalTable: "users",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_barrel_nicknames_users_UpdatedByUserId",
                table: "barrel_nicknames",
                column: "UpdatedByUserId",
                principalTable: "users",
                principalColumn: "id");
        }
    }
}
