using AgCriando.Api;
using AgCriando.Api.Auth;
using AgCriando.Api.Endpoints;
using AgCriando.Application;
using AgCriando.Infrastructure;
using AgCriando.Infrastructure.Persistence;
using AgCriando.Infrastructure.Storage;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    builder.Logging.ClearProviders();
    builder.Logging.AddJsonConsole();
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddApiServices();
builder.Services.AddApiAuth();

var app = builder.Build();

// O gerador de OpenAPI do build executa o Program sem banco; só inicializa o banco em execução real.
if (System.Reflection.Assembly.GetEntryAssembly()?.GetName().Name != "GetDocument.Insider")
    await app.Services.InitializeDatabaseAsync();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages();

var storage = app.Services.GetRequiredService<IOptions<StorageOptions>>().Value;
if (storage.IsLocal)
{
    var mediaRoot = Path.Combine(app.Environment.ContentRootPath, storage.LocalPath);
    Directory.CreateDirectory(mediaRoot);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(mediaRoot), RequestPath = "/media" });
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.MapHealthChecks("/api/health");
app.MapCatalogEndpoints();
app.MapAuthEndpoints();
app.MapAdminEndpoints();

app.Run();

public partial class Program;
