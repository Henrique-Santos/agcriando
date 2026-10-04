using AgCriando.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgCriando.Infrastructure.Persistence.Configurations;

internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasMaxLength(Product.IdMaxLength);
        builder.Property(p => p.Name).HasMaxLength(Product.NameMaxLength).IsRequired();
        builder.Property(p => p.CategoryId).HasMaxLength(Category.IdMaxLength).IsRequired();
        builder.HasOne<Category>().WithMany().HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.Property(p => p.Price).HasPrecision(10, 2);
        builder.Property(p => p.ProductionDays).HasMaxLength(Product.ProductionDaysMaxLength).IsRequired();
        builder.Property(p => p.Tag).HasMaxLength(Product.TagMaxLength);
        builder.Property(p => p.Description).HasMaxLength(Product.DescriptionMaxLength).IsRequired();
        builder.Property(p => p.CustomFieldLabel).HasMaxLength(Product.CustomFieldLabelMaxLength).IsRequired();
        builder.Property(p => p.CustomFieldPlaceholder).HasMaxLength(Product.CustomFieldPlaceholderMaxLength).IsRequired();
        builder.Property(p => p.OptionName).HasMaxLength(Product.OptionNameMaxLength);
        builder.Property(p => p.OptionValues).IsRequired(); // text[] no Postgres
        builder.Property(p => p.ImageUrl).HasMaxLength(Product.ImageUrlMaxLength);
        builder.HasIndex(p => new { p.Active, p.SortOrder });
        builder.HasIndex(p => p.CategoryId);
    }
}
