using AgCriando.Application.Common;
using AgCriando.Domain.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AgCriando.Api;

internal sealed class ApiExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
    {
        ProblemDetails? problem = exception switch
        {
            RequestValidationException v => new ValidationProblemDetails(v.Errors.ToDictionary(e => e.Key, e => e.Value))
            {
                Title = "Confira os campos destacados.",
                Status = StatusCodes.Status400BadRequest,
            },
            DomainException d => new ValidationProblemDetails(new Dictionary<string, string[]> { [d.Field ?? ""] = [d.Message] })
            {
                Title = d.Message,
                Status = StatusCodes.Status400BadRequest,
            },
            NotFoundException n => new ProblemDetails { Title = n.Message, Status = StatusCodes.Status404NotFound },
            ConflictException c => new ProblemDetails { Title = c.Message, Status = StatusCodes.Status409Conflict },
            BadHttpRequestException b => new ProblemDetails { Title = "Requisição inválida.", Status = b.StatusCode },
            _ => null,
        };

        if (problem is null) return false;

        http.Response.StatusCode = problem.Status!.Value;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = http,
            ProblemDetails = problem,
            Exception = exception,
        });
    }
}
