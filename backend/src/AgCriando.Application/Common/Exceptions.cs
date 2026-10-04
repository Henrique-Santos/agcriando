namespace AgCriando.Application.Common;

public sealed class RequestValidationException(IReadOnlyDictionary<string, string[]> errors) : Exception("Dados inválidos.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;

    public static RequestValidationException For(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });
}

public sealed class NotFoundException(string message) : Exception(message);

public sealed class ConflictException(string message) : Exception(message);
