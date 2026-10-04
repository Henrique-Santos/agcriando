namespace AgCriando.Api.Auth;

/// <summary>Defesa CSRF complementar ao SameSite=Strict: navegadores não enviam headers customizados em requisições cross-site sem CORS.</summary>
internal sealed class RequireXRequestedWithFilter : IEndpointFilter
{
    public ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var request = context.HttpContext.Request;
        if (!HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method) && !request.Headers.ContainsKey("X-Requested-With"))
            return ValueTask.FromResult<object?>(TypedResults.Problem(title: "Requisição inválida.", statusCode: StatusCodes.Status400BadRequest));

        return next(context);
    }
}
