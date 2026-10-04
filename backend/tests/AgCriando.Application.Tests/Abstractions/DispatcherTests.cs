using AgCriando.Application;
using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Shouldly;

namespace AgCriando.Application.Tests.Abstractions;

public sealed record EchoCommand(string Value) : ICommand<string>;

public sealed class EchoValidator : AbstractValidator<EchoCommand>
{
    public EchoValidator() => RuleFor(x => x.Value).NotEmpty().WithMessage("Valor obrigatório.");
}

public sealed class EchoHandler : ICommandHandler<EchoCommand, string>
{
    public Task<string> Handle(EchoCommand command, CancellationToken ct) => Task.FromResult(command.Value.ToUpperInvariant());
}

public sealed record MutateCommand(string Value) : ICommand<Unit>, ICatalogMutation;

public sealed class MutateValidator : AbstractValidator<MutateCommand>
{
    public MutateValidator() => RuleFor(x => x.Value).NotEmpty().WithMessage("Valor obrigatório.");
}

public sealed class MutateHandler : ICommandHandler<MutateCommand, Unit>
{
    public Task<Unit> Handle(MutateCommand command, CancellationToken ct) => Task.FromResult(Unit.Value);
}

public sealed record PingQuery(int N) : IQuery<int>;

public sealed class PingHandler : IQueryHandler<PingQuery, int>
{
    public Task<int> Handle(PingQuery query, CancellationToken ct) =>
        query.N < 0 ? throw new NotFoundException("Nada aqui.") : Task.FromResult(query.N + 1);
}

public sealed class DispatcherTests
{
    private readonly ICatalogCacheInvalidator _invalidator = Substitute.For<ICatalogCacheInvalidator>();
    private readonly IDispatcher _dispatcher;

    public DispatcherTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(_invalidator);
        services.AddCqrs(typeof(DispatcherTests).Assembly);
        _dispatcher = services.BuildServiceProvider().CreateScope().ServiceProvider.GetRequiredService<IDispatcher>();
    }

    [Fact]
    public async Task Send_runs_the_command_handler() =>
        (await _dispatcher.Send(new EchoCommand("abc"))).ShouldBe("ABC");

    [Fact]
    public async Task Query_runs_the_query_handler() =>
        (await _dispatcher.Query(new PingQuery(1))).ShouldBe(2);

    [Fact]
    public async Task Send_throws_validation_exception_with_camel_case_fields()
    {
        var ex = await Should.ThrowAsync<RequestValidationException>(() => _dispatcher.Send(new EchoCommand("")));
        ex.Errors["value"].ShouldBe(["Valor obrigatório."]);
    }

    [Fact]
    public async Task Query_rethrows_original_exception_instead_of_reflection_wrapper() =>
        await Should.ThrowAsync<NotFoundException>(() => _dispatcher.Query(new PingQuery(-1)));

    [Fact]
    public async Task Catalog_mutation_invalidates_cache_after_handler()
    {
        await _dispatcher.Send(new MutateCommand("x"));
        await _invalidator.Received(1).InvalidateAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Non_mutation_does_not_invalidate_cache()
    {
        await _dispatcher.Send(new EchoCommand("x"));
        await _invalidator.DidNotReceive().InvalidateAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Invalid_mutation_does_not_invalidate_cache()
    {
        await Should.ThrowAsync<RequestValidationException>(() => _dispatcher.Send(new MutateCommand("")));
        await _invalidator.DidNotReceive().InvalidateAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Invalidation_failure_does_not_fail_the_command()
    {
        _invalidator.InvalidateAsync(Arg.Any<CancellationToken>()).ThrowsAsync(new HttpRequestException("front fora do ar"));
        (await _dispatcher.Send(new MutateCommand("x"))).ShouldBe(Unit.Value);
    }
}
