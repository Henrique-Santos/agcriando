using System.Reflection;
using System.Runtime.ExceptionServices;
using Microsoft.Extensions.DependencyInjection;

namespace AgCriando.Application.Abstractions;

internal sealed class Dispatcher(IServiceProvider services) : IDispatcher
{
    public Task<TResult> Send<TResult>(ICommand<TResult> command, CancellationToken ct = default) =>
        Invoke<TResult>(typeof(ICommandHandler<,>), command, ct);

    public Task<TResult> Query<TResult>(IQuery<TResult> query, CancellationToken ct = default) =>
        Invoke<TResult>(typeof(IQueryHandler<,>), query, ct);

    private Task<TResult> Invoke<TResult>(Type openHandlerType, object request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        var handlerType = openHandlerType.MakeGenericType(request.GetType(), typeof(TResult));
        var handler = services.GetRequiredService(handlerType);
        try
        {
            return (Task<TResult>)handlerType.GetMethod("Handle")!.Invoke(handler, [request, ct])!;
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            ExceptionDispatchInfo.Capture(ex.InnerException).Throw();
            throw;
        }
    }
}
