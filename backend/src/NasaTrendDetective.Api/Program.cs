using System.IO.Compression;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using NasaTrendDetective.Api.Middlewares;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Soporte dinámico para puerto en entornos Cloud (Render, Docker, Kubernetes)
var renderPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(renderPort))
{
    builder.WebHost.UseUrls($"http://*:{renderPort}");
}

// 1. Inyección de Dependencias (Servicios, Repositorios y Caché)
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ITrendAnalysisService, TrendAnalysisService>();
builder.Services.AddScoped<IOpposingTrendsService, OpposingTrendsService>();
builder.Services.AddScoped<IGridTrendService, GridTrendService>();
builder.Services.AddScoped<IDatasetCatalogService, DatasetCatalogService>();
builder.Services.AddInfrastructure(builder.Configuration);

// La grilla de tendencias y las observaciones anuales son JSON de varios MB y muy repetitivos.
// Solo viajan datos públicos (ni sesiones ni secretos), así que comprimir sobre HTTPS no expone nada.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);

// 2. Parámetros Dinámicos de Rate Limiting (Regla 6 y Regla 8)
var globalLimit = builder.Configuration.GetValue<int>("RateLimiting:GlobalPermitLimit", 300);
var heavyLimit = builder.Configuration.GetValue<int>("RateLimiting:HeavyAnalysisPermitLimit", 60);
var windowSeconds = builder.Configuration.GetValue<int>("RateLimiting:WindowSeconds", 60);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please throttle requests.\"}",
            token);
    };

    // Límite Global particionado por IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = globalLimit,
            Window = TimeSpan.FromSeconds(windowSeconds),
            QueueLimit = 0
        });
    });

    // Política Estricta para consultas analíticas pesadas (Mann-Kendall / Sen)
    options.AddPolicy("HeavyAnalysis", context =>
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = heavyLimit,
            Window = TimeSpan.FromSeconds(windowSeconds),
            QueueLimit = 0
        });
    });
});

// 3. Configuración de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 4. Pipeline HTTP y Middlewares
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseResponseCompression();
app.UseCors("AllowFrontend");
app.UseMiddleware<BotDetectionMiddleware>();
app.UseRateLimiter();

app.MapControllers();

app.Run();

// Requerido para pruebas de integración con WebApplicationFactory<Program>
public partial class Program { }
