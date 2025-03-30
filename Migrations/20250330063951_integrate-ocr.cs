using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edutopia.Migrations
{
    /// <inheritdoc />
    public partial class integrateocr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "extractedText",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "extractedText",
                table: "Documents");
        }
    }
}
