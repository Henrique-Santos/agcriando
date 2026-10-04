using AgCriando.Api;
using AgCriando.Api.Endpoints;
using AgCriando.Application;
using AgCriando.Infrastructure;
using AgCriando.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddApiServices();

var app = builder.Build();

await app.Services.InitializeDatabaseAsync();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapHealthChecks("/api/health");
app.MapCatalogEndpoints();

app.Run();

public partial class Program;
