using AgCriando.Domain.Common;
using Shouldly;

namespace AgCriando.Domain.Tests;

public sealed class SlugTests
{
    [Theory]
    [InlineData("Caderno floral com nome", "caderno-floral-com-nome")]
    [InlineData("Canecas & potes", "canecas-potes")]
    [InlineData("  Ímã — Frase!  ", "ima-frase")]
    [InlineData("Girassóis & céu estrelado", "girassois-ceu-estrelado")]
    [InlineData("Coração", "coracao")]
    [InlineData("!!!", "")]
    public void From_removes_accents_and_symbols(string input, string expected) =>
        Slug.From(input).ShouldBe(expected);

    [Fact]
    public void Unique_returns_base_when_free() =>
        Slug.Unique("bottons", _ => false).ShouldBe("bottons");

    [Fact]
    public void Unique_appends_increasing_suffix()
    {
        var taken = new HashSet<string> { "bottons", "bottons-2" };
        Slug.Unique("bottons", taken.Contains).ShouldBe("bottons-3");
    }

    [Fact]
    public void WithTimestamp_appends_base36_milliseconds()
    {
        var now = DateTimeOffset.FromUnixTimeMilliseconds(1790210401893);
        Slug.WithTimestamp("Caderno Floral", now).ShouldBe("caderno-floral-muet1un9");
    }

    [Fact]
    public void WithTimestamp_uses_fallback_when_text_has_no_letters()
    {
        var now = DateTimeOffset.FromUnixTimeMilliseconds(1790210401893);
        Slug.WithTimestamp("???", now).ShouldBe("produto-muet1un9");
    }
}
