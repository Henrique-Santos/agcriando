namespace AgCriando.Domain.Common;

public sealed class DomainException(string message, string? field = null) : Exception(message)
{
    public string? Field { get; } = field;
}
