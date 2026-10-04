using System.Text.Json;
using AgCriando.Application.Common;
using FluentValidation;

namespace AgCriando.Application.Abstractions;

internal sealed class ValidationDecorator<TCommand, TResult>(
    ICommandHandler<TCommand, TResult> inner,
    IEnumerable<IValidator<TCommand>> validators) : ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
{
    public async Task<TResult> Handle(TCommand command, CancellationToken ct)
    {
        var failures = new List<FluentValidation.Results.ValidationFailure>();
        foreach (var validator in validators)
            failures.AddRange((await validator.ValidateAsync(command, ct)).Errors);

        if (failures.Count > 0)
        {
            var errors = failures
                .GroupBy(f => ToFieldName(f.PropertyName))
                .ToDictionary(g => g.Key, g => g.Select(f => f.ErrorMessage).Distinct().ToArray());
            throw new RequestValidationException(errors);
        }

        return await inner.Handle(command, ct);
    }

    // "Input.Name" -> "name"; "Input.OptionValues[0]" -> "optionValues[0]"
    private static string ToFieldName(string propertyName) =>
        JsonNamingPolicy.CamelCase.ConvertName(propertyName.Split('.')[^1]);
}
