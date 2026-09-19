var builder = WebApplication.CreateBuilder(args);

// Configurar CORS para permitir requests desde el frontend Vite (local y contenedor)
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

app.UseCors("AllowFrontend");

// Endpoints de salud para Docker, Kubernetes y monitoreo
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "NASA Earth System Trend Detective API",
    version = "1.0.0",
    timestamp = DateTime.UtcNow
}));

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "NASA Earth System Trend Detective API",
    version = "1.0.0",
    timestamp = DateTime.UtcNow
}));

app.Run();
