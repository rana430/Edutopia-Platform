using Edutopia.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Edutopia.Data
{
    public class ApplicationDBContext : DbContext
    {
        public ApplicationDBContext(DbContextOptions<ApplicationDBContext> options) : base(options) 
        {

        }

        public DbSet<User> Users { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Diagram> Diagrams { get; set; }
        public DbSet<Video> Videos { get; set; }
		public DbSet<History> History { get; set; }
	}
}
