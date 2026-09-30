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
ENTRYPOINT ["dotnet", "NasaTrendDetective.Api.dll"]
