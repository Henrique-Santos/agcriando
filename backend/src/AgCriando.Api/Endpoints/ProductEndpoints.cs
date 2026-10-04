using AgCriando.Application.Abstractions;
using AgCriando.Application.Products;
using AgCriando.Application.Products.Commands;
using AgCriando.Application.Products.Queries;

namespace AgCriando.Api.Endpoints;

public sealed record PatchProductRequest(decimal? Price, bool? Active, bool? Featured);

internal static class ProductEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this RouteGroupBuilder admin)
    {
        var group = admin.MapGroup("/products").WithTags("Admin: Products");

        group.MapGet("", (string? q, string? cat, string? status, IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Query(new ListProductsQuery(q, cat, status), ct));

        group.MapGet("/{id}", (string id, IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Query(new GetProductForEditQuery(id), ct));

        group.MapPost("", async (ProductInput body, IDispatcher dispatcher, CancellationToken ct) =>
        {
            var product = await dispatcher.Send(new CreateProductCommand(body), ct);
            return TypedResults.Created($"/api/admin/products/{product.Id}", product);
        });

        group.MapPut("/{id}", (string id, ProductInput body, IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Send(new UpdateProductCommand(id, body), ct));

        group.MapPatch("/{id}", (string id, PatchProductRequest body, IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Send(new PatchProductCommand(id, body.Price, body.Active, body.Featured), ct));

        group.MapDelete("/{id}", async (string id, IDispatcher dispatcher, CancellationToken ct) =>
        {
            await dispatcher.Send(new DeleteProductCommand(id), ct);
            return TypedResults.NoContent();
        });

        return admin;
    }
}
