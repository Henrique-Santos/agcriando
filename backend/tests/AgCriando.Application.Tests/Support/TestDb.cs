using AgCriando.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Tests.Support;

internal static class TestDb
{
    public static AppDbContext Create() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
}
