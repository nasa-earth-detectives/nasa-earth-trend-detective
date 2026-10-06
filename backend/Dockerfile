# ==============================================================================
# Multi-stage Dockerfile for NASA Earth System Trend Detective Backend (.NET 10)
# ==============================================================================

# Stage 1: Build & Unit Testing
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/NasaTrendDetective.Domain/NasaTrendDetective.Domain.csproj", "src/NasaTrendDetective.Domain/"]
COPY ["src/NasaTrendDetective.Application/NasaTrendDetective.Application.csproj", "src/NasaTrendDetective.Application/"]
COPY ["src/NasaTrendDetective.Infrastructure/NasaTrendDetective.Infrastructure.csproj", "src/NasaTrendDetective.Infrastructure/"]
COPY ["src/NasaTrendDetective.Api/NasaTrendDetective.Api.csproj", "src/NasaTrendDetective.Api/"]

# Restore dependencies
RUN dotnet restore "src/NasaTrendDetective.Api/NasaTrendDetective.Api.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/src/NasaTrendDetective.Api"
RUN dotnet build "NasaTrendDetective.Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "NasaTrendDetective.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Production Runtime (Debian/glibc: la libreria nativa de DuckDB no soporta musl/Alpine)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# wget para el healthcheck de docker-compose y directorio de datos DuckDB con permisos del usuario app
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/data \
    && chown app:app /app/data

# Non-root user for security compliance
USER app

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DUCKDB_DATABASE_PATH=/app/data/nasa_earth_trends.duckdb

COPY --from=publish /app/publish .

# Datasets que la API siembra en DuckDB al arrancar (Parquet + manifiesto de procedencia). Viajan en
# la imagen porque Render construye solo con ./backend como contexto. Ver docs/obsidian/31.
COPY --from=build /src/seed /app/seed
ENV DATASET_SEED_DIRECTORY=/app/seed

# Render gratuito tiene 512 MB. Sin tope, la importación de GISTEMP llegó a 647 MB de pico (medido
# en local); con 256 MB y 2 hilos, la API completa (carga + consultas) se quedó en 423 MB.
ENV DuckDb__MemoryLimit=256MB
ENV DuckDb__Threads=2

ENTRYPOINT ["dotnet", "NasaTrendDetective.Api.dll"]
