using System.Text.Json;
using AgCriando.Application.Abstractions;
using AgCriando.Application.Uploads.Commands;
using AgCriando.Domain.Catalog;
using AgCriando.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AgCriando.Infrastructure.Seeding;

internal sealed class CatalogSeeder(
    AppDbContext db,
    IDispatcher dispatcher,
    IOptions<SeedOptions> options,
    TimeProvider clock,
    ILogger<CatalogSeeder> logger) : ISeeder
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task SeedAsync(CancellationToken ct)
    {
        if (!options.Value.Catalog || await db.Categories.AnyAsync(ct)) return;

        var directory = Path.Combine(AppContext.BaseDirectory, "Seed");
        await using var file = File.OpenRead(Path.Combine(directory, "catalog.json"));
        var seed = await JsonSerializer.DeserializeAsync<SeedCatalog>(file, Json, ct)
                   ?? throw new InvalidOperationException("Seed/catalog.json vazio.");

        for (var i = 0; i < seed.Cats.Count; i++)
            db.Categories.Add(Category.Create(seed.Cats[i].Id, seed.Cats[i].Label, i));

        var now = clock.GetUtcNow();
        for (var i = 0; i < seed.Products.Count; i++)
        {
            var p = seed.Products[i];
            var imageUrl = string.IsNullOrEmpty(p.Img) ? null : await UploadAsync(Path.Combine(directory, p.Img), ct);
            var (optionName, optionValues) = ParseOption(p.Opt);

            db.Products.Add(Product.Create(p.Id, new ProductDetails(
                p.Name, p.Cat, p.Price, p.Min, p.Days, p.Tag, p.Desc, p.Field, p.Ph,
                optionName, optionValues, imageUrl, p.Active, p.Featured), i, now));
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Catálogo de exemplo importado: {Categories} categorias, {Products} produtos.", seed.Cats.Count, seed.Products.Count);
    }

    private async Task<string> UploadAsync(string path, CancellationToken ct)
    {
        await using var image = File.OpenRead(path);
        return (await dispatcher.Send(new UploadProductImageCommand(image, "image/jpeg", image.Length), ct)).Url;
    }

    // No design, "opt" é ["Miolo", ["Pautado", "Pontilhado"]] ou null.
    private static (string? Name, IReadOnlyList<string>? Values) ParseOption(JsonElement? opt) =>
        opt is { ValueKind: JsonValueKind.Array } element && element.GetArrayLength() == 2
            ? (element[0].GetString(), element[1].EnumerateArray().Select(v => v.GetString() ?? "").ToList())
            : (null, null);

    private sealed record SeedCatalog(List<SeedCategory> Cats, List<SeedProduct> Products);

    private sealed record SeedCategory(string Id, string Label);

    private sealed record SeedProduct(
        string Id, string Name, string Cat, decimal Price, string? Img, string? Tag, string? Days, string? Desc,
        string? Field, string? Ph, JsonElement? Opt, int? Min, bool Active, bool Featured);
}
