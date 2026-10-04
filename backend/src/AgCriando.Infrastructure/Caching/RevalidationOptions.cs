namespace AgCriando.Infrastructure.Caching;

public sealed class RevalidationOptions
{
    public const string Section = "Revalidation";

    /// <summary>Rota de revalidação do Next (ex.: http://web:3000/api/revalidate). Vazio = desligado.</summary>
    public string Url { get; set; } = "";
    public string Secret { get; set; } = "";
}
