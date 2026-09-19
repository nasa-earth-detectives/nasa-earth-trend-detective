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

// 2. Configuración de CORS
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

// 3. Pipeline HTTP y Middlewares
app.UseCors("AllowFrontend");
app.UseMiddleware<BotDetectionMiddleware>();

app.MapControllers();

app.Run();
