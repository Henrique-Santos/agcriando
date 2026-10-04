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

builder.Services.AddApplication();
builder.Services.AddInfrastructure();
builder.Services.AddApiServices();
builder.Services.AddApiAuth();

var app = builder.Build();

await app.Services.InitializeDatabaseAsync();

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

app.MapHealthChecks("/api/health");
app.MapCatalogEndpoints();
app.MapAuthEndpoints();
app.MapAdminEndpoints();

app.Run();

public partial class Program;
