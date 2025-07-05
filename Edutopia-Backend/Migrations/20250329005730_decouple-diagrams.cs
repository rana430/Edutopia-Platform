using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edutopia.Migrations
{
    /// <inheritdoc />
    public partial class decouplediagrams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Response",
                table: "Documents");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Videos",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Response",
                table: "Videos",
                newName: "Summerization");

            migrationBuilder.RenameColumn(
                name: "Summary",
                table: "Documents",
                newName: "Summarization");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "Videos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "DiagramExtractionStatus",
                table: "Videos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SummerizationStatus",
                table: "Videos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiagramExtractionStatus",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "SummerizationStatus",
                table: "Videos");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Videos",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "Summerization",
                table: "Videos",
                newName: "Response");

            migrationBuilder.RenameColumn(
                name: "Summarization",
                table: "Documents",
                newName: "Summary");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Videos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "Response",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
