using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edutopia.Migrations
{
    /// <inheritdoc />
    public partial class savediagrams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DocumentId",
                table: "Diagrams",
                newName: "HistoryId");

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Diagrams",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Diagrams");

            migrationBuilder.RenameColumn(
                name: "HistoryId",
                table: "Diagrams",
                newName: "DocumentId");
        }
    }
}
