namespace AgCriando.Api.Tests.Support;

internal static class TestToken
{
    /// <summary>Token do teste atual: o xUnit o cancela quando o teste é abortado ou estoura o tempo.</summary>
    public static CancellationToken Ct => TestContext.Current.CancellationToken;
}
