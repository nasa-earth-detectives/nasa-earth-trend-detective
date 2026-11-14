using System.IO.Compression;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using NasaTrendDetective.Api.Middlewares;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Dynamic port support for cloud environments (Render, Docker, Kubernetes)
var renderPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(renderPort))
{
    builder.WebHost.UseUrls($"http://*:{renderPort}");
}

// 1. Dependency Injection (Services, Repositories, and Cache)
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ITrendAnalysisService, TrendAnalysisService>();
builder.Services.AddScoped<IOpposingTrendsService, OpposingTrendsService>();
builder.Services.AddScoped<IGridTrendService, GridTrendService>();
builder.Services.AddScoped<IDatasetCatalogService, DatasetCatalogService>();
builder.Services.AddInfrastructure(builder.Configuration);

// The trend grid and annual observations are multi-megabyte, highly repetitive JSON payloads.
// Only public data is transmitted (no sessions or secrets), so HTTPS compression poses no security risk.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);

// 2. Dynamic Rate Limiting Parameters
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

    // Global limit partitioned by IP
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

    // Strict policy for heavy analytical queries (Mann-Kendall / Sen)
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

// 3. CORS Configuration
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

// 4. HTTP Pipeline and Middlewares
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseResponseCompression();
app.UseCors("AllowFrontend");
app.UseMiddleware<BotDetectionMiddleware>();
app.UseRateLimiter();

app.MapControllers();

app.Run();

// Required for integration testing with WebApplicationFactory<Program>
public partial class Program { }
