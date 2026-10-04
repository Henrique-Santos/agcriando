using AgCriando.Application.Abstractions;
using AgCriando.Application.Catalog.Queries;

namespace AgCriando.Api.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/catalog").WithTags("Catalog");

        group.MapGet("", (IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Query(new GetCatalogQuery(), ct));

        group.MapGet("/products/{id}", (string id, IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Query(new GetProductByIdQuery(id), ct));

        return app;
    }
}
