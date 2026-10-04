using AgCriando.Api;
using AgCriando.Application;
using AgCriando.Infrastructure;
using AgCriando.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddApiServices();

var app = builder.Build();

await app.Services.InitializeDatabaseAsync();

app.MapHealthChecks("/api/health");

app.Run();

public partial class Program;
