using AgCriando.Infrastructure.Persistence;
using AgCriando.Infrastructure.Seeding;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AgCriando.Infrastructure.Identity;

internal sealed class IdentitySeeder(
    UserManager<AdminUser> users,
    RoleManager<IdentityRole> roles,
    IOptions<SeedOptions> options,
    ILogger<IdentitySeeder> logger) : ISeeder
{
    public async Task SeedAsync(CancellationToken ct)
    {
        if (!await roles.RoleExistsAsync(AppRoles.Admin))
            Ensure(await roles.CreateAsync(new IdentityRole(AppRoles.Admin)));

        var seed = options.Value;
        if (string.IsNullOrWhiteSpace(seed.AdminEmail) || string.IsNullOrWhiteSpace(seed.AdminPassword))
        {
            logger.LogWarning("Seed:AdminEmail/Seed:AdminPassword não configurados; nenhum admin foi criado.");
            return;
        }

        // Nunca sobrescreve a senha de um admin existente.
        if (await users.FindByEmailAsync(seed.AdminEmail) is not null) return;

        var admin = new AdminUser { UserName = seed.AdminEmail, Email = seed.AdminEmail, EmailConfirmed = true };
        Ensure(await users.CreateAsync(admin, seed.AdminPassword));
        Ensure(await users.AddToRoleAsync(admin, AppRoles.Admin));
        logger.LogInformation("Admin inicial {Email} criado.", seed.AdminEmail);
    }

    private static void Ensure(IdentityResult result)
    {
        if (!result.Succeeded)
            throw new InvalidOperationException("Falha no seed de identidade: " + string.Join("; ", result.Errors.Select(e => e.Description)));
    }
}
