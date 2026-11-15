#!/usr/bin/env bash
# Runs the API image with the limits of the Render free tier (512 MB, a quarter of a CPU) and asks for a
# long series of trend grids for periods that are NOT precomputed, printing the container memory after
# each one. What it answers: does memory settle, or does it climb until the container is killed?
# See docs/obsidian/42 (section 4.5).
#
# Usage: scripts/stress-api-memory.sh [image] [memory] [extra docker run arguments, e.g. -e DuckDb__X=Y]
#   docker build -t nasa-api:new -f backend/Dockerfile backend
#   scripts/stress-api-memory.sh nasa-api:new 512m
IMAGE=${1:-nasa-api:new}; MEMORY=${2:-512m}; NAME=nasa-api-stress; shift 2 2>/dev/null
docker rm -f $NAME >/dev/null 2>&1
docker run -d --name $NAME --memory=$MEMORY --memory-swap=$MEMORY --cpus=0.25 -p 5000:5000 "$@" $IMAGE >/dev/null
STARTED=$(date +%s%N)
elapsed() { echo $(( ($(date +%s%N) - STARTED) / 1000000 )); }
memory() { docker stats $NAME --no-stream --format '{{.MemUsage}}' | cut -d/ -f1 | tr -d ' '; }

until curl -s -m 2 http://localhost:5000/api/datasets 2>/dev/null | grep -q observed; do sleep 0.2; done
echo "catalog with real data: $(elapsed) ms | observed variables: $(curl -s http://localhost:5000/api/datasets | grep -o '"status":"observed"' | wc -l)"
for attempt in $(seq 1 150); do
  ready=$(docker logs $NAME 2>&1 | grep -cE "Trend grid (warmed|loaded from the image)"); [ "$ready" -ge 9 ] && break; sleep 0.4
done
echo "default grids ready: $ready at $(elapsed) ms (read from the image: $(docker logs $NAME 2>&1 | grep -c 'loaded from the image'), computed: $(docker logs $NAME 2>&1 | grep -c 'Trend grid warmed'))"
echo "memory after startup: $(memory)"

grid() {
  result=$(curl -s -o /dev/null -m 120 -H "Accept-Encoding: br" -w "http %{http_code} %{time_total}s %{size_download}B" "http://localhost:5000/api/trends/grid?variable=$2&startYear=$3&endYear=$4")
  state=$(docker inspect $NAME --format '{{.State.Status}}{{if .State.OOMKilled}} KILLED-OUT-OF-MEMORY{{end}}')
  echo "$1 | $result | memory $(memory) | $state"
}
echo "--- default grids (must come from the cache)"
grid "GISTEMP 2000-2026" 1 2000 2026; grid "NDVI 2000-2025" 2 2000 2025; grid "GRACE 2002-2025" 3 2002 2025; grid "CO2 2015-2025" 4 2015 2025
grid "T2M 1981-2025" 5 1981 2025; grid "PRECIP 1981-2025" 6 1981 2025; grid "EVAP 1981-2025" 7 1981 2025; grid "SOIL 1981-2025" 8 1981 2025; grid "GPM 1998-2025" 9 1998 2025
echo "--- periods that are not precomputed, one after another"
grid "T2M 1990-2025" 5 1990 2025
grid "GISTEMP 2001-2026" 1 2001 2026
grid "NDVI 2005-2020" 2 2005 2020
grid "GRACE 2005-2020" 3 2005 2020
grid "GPM 2000-2020" 9 2000 2020
grid "PRECIP 1985-2020" 6 1985 2020
grid "GISTEMP 2005-2025" 1 2005 2025
grid "T2M 2000-2025" 5 2000 2025
grid "GPM 2005-2025" 9 2005 2025
grid "GISTEMP 1880-2026 (wider than the coverage)" 1 1880 2026
grid "GISTEMP 2010-2026" 1 2010 2026
grid "PRECIP 1995-2025" 6 1995 2025
grid "T2M 1985-2015" 5 1985 2015
grid "GISTEMP 2002-2024" 1 2002 2024
echo "--- two at once"
( grid "GISTEMP 2003-2023 (simultaneous)" 1 2003 2023 ) & ( grid "T2M 1995-2020 (simultaneous)" 5 1995 2020 ); wait
echo "--- end"
echo "state: $(docker inspect $NAME --format '{{.State.Status}} OOMKilled={{.State.OOMKilled}}') | memory $(memory)"
echo "errors in the log: $(docker logs $NAME 2>&1 | grep -ciE 'fail:|Exception')"
docker logs $NAME 2>&1 | grep "Trend grid computed" | sed -E 's/^ +//' | cut -c1-170
