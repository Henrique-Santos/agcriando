using AgCriando.Application.Abstractions;
using AgCriando.Application.Categories.Commands;
using AgCriando.Application.Categories.Queries;

namespace AgCriando.Api.Endpoints;

public sealed record CategoryRequest(string? Label);

public sealed record ReorderCategoriesRequest(IReadOnlyList<string>? Ids);

internal static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this RouteGroupBuilder admin)
    {
        var group = admin.MapGroup("/categories").WithTags("Admin: Categories");

        group.MapGet("", (IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Query(new ListCategoriesQuery(), ct));

        group.MapPost("", async (CategoryRequest body, IDispatcher dispatcher, CancellationToken ct) =>
        {
            var category = await dispatcher.Send(new CreateCategoryCommand(body.Label ?? ""), ct);
            return TypedResults.Created($"/api/admin/categories/{category.Id}", category);
        });

        group.MapPut("/order", async (ReorderCategoriesRequest body, IDispatcher dispatcher, CancellationToken ct) =>
        {
            await dispatcher.Send(new ReorderCategoriesCommand(body.Ids ?? []), ct);
            return TypedResults.NoContent();
        });

        group.MapPut("/{id}", (string id, CategoryRequest body, IDispatcher dispatcher, CancellationToken ct) =>
            dispatcher.Send(new RenameCategoryCommand(id, body.Label ?? ""), ct));

        group.MapDelete("/{id}", async (string id, IDispatcher dispatcher, CancellationToken ct) =>
        {
            await dispatcher.Send(new DeleteCategoryCommand(id), ct);
            return TypedResults.NoContent();
        });

        return admin;
    }
}
