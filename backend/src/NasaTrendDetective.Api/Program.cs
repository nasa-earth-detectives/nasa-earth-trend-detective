using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using NasaTrendDetective.Api.Middlewares;
using NasaTrendDetective.Application.Implements;
using NasaTrendDetective.Application.Interfaces;
using NasaTrendDetective.Infrastructure.Implements;
using NasaTrendDetective.Infrastructure.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Inyección de Dependencias (Servicios y Repositorios)
builder.Services.AddControllers();
builder.Services.AddScoped<ITrendAnalysisService, TrendAnalysisService>();
builder.Services.AddScoped<IDuckDbRepository, DuckDbRepository>();

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
app.UseCors("AllowFrontend");
app.UseMiddleware<BotDetectionMiddleware>();
app.UseRateLimiter();

app.MapControllers();

app.Run();
