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

# Stage 3: Seed the database at build time
# The API used to import the nine datasets on every boot. Measured in a 512 MB container: it answered
# after 3 s with every variable still unloaded, the first dataset took 48 s, and the import was killed
# for lack of memory at 77 s. On a host that sleeps when idle, that happens each time it wakes up.
# Loading here moves that cost to the build: the image ships the database ready, startup only checks
# that each Parquet hash matches, and the runtime never holds an import in memory.
# If seeding fails the tool exits with 1 and the build stops, so a half-empty database is never deployed.
#
# The default trend grid of each dataset is computed here too, by the API itself (so the body is exactly
# what it would send), and written next to the database. Measured: computing the nine grids at startup
# took 38.6 s on a quarter of a CPU and left the process at 270-340 MB of the 512 MB it has; one more grid
# from there got the container killed. Shipped as files (1.6 MB in total) they are ready at once.
FROM build AS seed
WORKDIR /src
RUN dotnet publish "tools/NasaTrendDetective.EtlCli/NasaTrendDetective.EtlCli.csproj" -c Release -o /app/etl /p:UseAppHost=false
ENV DUCKDB_DATABASE_PATH=/app/data/nasa_earth_trends.duckdb
# Same DuckDB limits as the runtime, so the build asks for no more memory than the import already needed there.
ENV DuckDb__MemoryLimit=110MB
ENV DuckDb__Threads=1
RUN mkdir -p /app/data     && dotnet /app/etl/NasaTrendDetective.EtlCli.dll seed --directory /src/seed
COPY --from=publish /app/publish /app/api
WORKDIR /app/api
RUN DATASET_SEED_DIRECTORY=/src/seed ASPNETCORE_ENVIRONMENT=Production ASPNETCORE_URLS=http://127.0.0.1:5099 \
    GridCache__Directory=/app/data/grids GridCache__ExportAndExit=true dotnet NasaTrendDetective.Api.dll \
    && test "$(ls /app/data/grids/*.json.br | wc -l)" -eq "$(ls /src/seed/*.provenance.json | wc -l)"

# Stage 4: Production Runtime (Debian/glibc: DuckDB native library does not support musl/Alpine)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# wget for docker-compose healthcheck and DuckDB data directory with app user permissions
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

# Parquet + provenance manifests. The database below was built from these same files; at startup
# the API compares each hash and reimports only what differs (nothing, in a normal build). Included in
# the image because Render builds with only ./backend as context. See docs/obsidian/31.
COPY --from=build /src/seed /app/seed
ENV DATASET_SEED_DIRECTORY=/app/seed
COPY --from=seed --chown=app:app /app/data/ /app/data/
# Default trend grids computed in the seed stage; a grid with no file here is computed at startup.
ENV GridCache__Directory=/app/data/grids

# Constrain managed GC, glibc malloc arenas, and DuckDB buffers to fit Render's 512 MB tier across all 9 datasets.
ENV DOTNET_gcServer=0
ENV DOTNET_GCConserveMemory=9
ENV DOTNET_GCHeapHardLimit=0x8000000
ENV MALLOC_ARENA_MAX=2
ENV DuckDb__MemoryLimit=110MB
ENV DuckDb__Threads=1
# DuckDB's memory limit bounds what it uses, not what its allocator keeps after freeing it. Measured in a
# 512 MB container over 16 trend grids of periods that are not precomputed: without these two settings
# the container settled at 370-388 MB; with them, at 225-240 MB.
ENV DuckDb__AllocatorBackgroundThreads=true
ENV DuckDb__AllocatorFlushThreshold=16MB

ENTRYPOINT ["dotnet", "NasaTrendDetective.Api.dll"]
