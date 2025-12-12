using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MyUglyRocks.Infrastructure.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        // Design-time only - used for EF migrations from local development
        // For runtime, connection string comes from K8s secrets
        optionsBuilder.UseNpgsql("Host=localhost;Database=myuglyrocks;Username=postgres;Password=postgres");

        return new AppDbContext(optionsBuilder.Options);
    }
}
