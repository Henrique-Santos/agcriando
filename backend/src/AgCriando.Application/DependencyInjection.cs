using System.Reflection;
using AgCriando.Application.Abstractions;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace AgCriando.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services) =>
        services.AddCqrs(typeof(DependencyInjection).Assembly);

    public static IServiceCollection AddCqrs(this IServiceCollection services, Assembly assembly)
    {
        services.TryAddScoped<IDispatcher, Dispatcher>();
        services.AddValidatorsFromAssembly(assembly, ServiceLifetime.Scoped, includeInternalTypes: true);

        var concreteTypes = assembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false, IsGenericTypeDefinition: false });

        foreach (var type in concreteTypes)
        {
            foreach (var contract in type.GetInterfaces().Where(i => i.IsGenericType))
            {
                var definition = contract.GetGenericTypeDefinition();
                if (definition == typeof(IQueryHandler<,>))
                {
                    services.AddScoped(contract, type);
                }
                else if (definition == typeof(ICommandHandler<,>))
                {
                    services.AddScoped(type);
                    var handlerType = type;
                    services.AddScoped(contract, sp => Decorate(sp, handlerType, contract));
                }
            }
        }

        return services;
    }

    // Ordem final: Validation( CatalogInvalidation?( handler ) ) — valida antes, invalida depois do sucesso.
    private static object Decorate(IServiceProvider sp, Type handlerType, Type contract)
    {
        var arguments = contract.GetGenericArguments();
        var (command, result) = (arguments[0], arguments[1]);

        var handler = sp.GetRequiredService(handlerType);
        if (typeof(ICatalogMutation).IsAssignableFrom(command))
            handler = ActivatorUtilities.CreateInstance(sp, typeof(CatalogInvalidationDecorator<,>).MakeGenericType(command, result), handler);

        return ActivatorUtilities.CreateInstance(sp, typeof(ValidationDecorator<,>).MakeGenericType(command, result), handler);
    }
}
