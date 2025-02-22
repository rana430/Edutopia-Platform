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
    }
}
