using AgCriando.Api;
using AgCriando.Api.Auth;
using AgCriando.Api.Endpoints;
using AgCriando.Application;
using AgCriando.Infrastructure;
using AgCriando.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddApiServices();
builder.Services.AddApiAuth();

var app = builder.Build();

await app.Services.InitializeDatabaseAsync();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHealthChecks("/api/health");
app.MapCatalogEndpoints();
app.MapAuthEndpoints();
app.MapAdminEndpoints();

app.Run();

public partial class Program;
