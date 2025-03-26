using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edutopia.Migrations
{
    /// <inheritdoc />
    public partial class sessioncreat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "number",
                table: "Documents",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "number",
                table: "Documents");
        }
    }
}
