using AgCriando.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgCriando.Infrastructure.Persistence.Configurations;

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasMaxLength(Category.IdMaxLength);
        builder.Property(c => c.Label).HasMaxLength(Category.LabelMaxLength).IsRequired();
        builder.HasIndex(c => c.SortOrder);
    }
}
