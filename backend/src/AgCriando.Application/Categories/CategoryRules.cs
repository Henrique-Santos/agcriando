using AgCriando.Application.Common;
using AgCriando.Domain.Catalog;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Categories;

internal static class CategoryRules
{
    public static async Task EnsureUniqueLabelAsync(IAppDbContext db, string label, string? exceptId, CancellationToken ct)
    {
        var lower = label.Trim().ToLower();
        if (await db.Categories.AnyAsync(c => c.Id != exceptId && c.Label.ToLower() == lower, ct))
            throw RequestValidationException.For("label", "Já existe uma categoria com esse nome.");
    }

    public static async Task<Category> FindAsync(IAppDbContext db, string id, CancellationToken ct) =>
        await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NotFoundException("Categoria não encontrada.");

    public static Task<int> CountProductsAsync(IAppDbContext db, string id, CancellationToken ct) =>
        db.Products.CountAsync(p => p.CategoryId == id, ct);

    public static IRuleBuilderOptions<T, string> ValidCategoryLabel<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Digite o nome da categoria.")
            .MaximumLength(Category.LabelMaxLength).WithMessage($"Use no máximo {Category.LabelMaxLength} caracteres.");
}
