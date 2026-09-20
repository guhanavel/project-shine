#!/usr/bin/env bash
# Starts everything needed for local development:
#   1. Docker Desktop (if not already running)
#   2. The local Supabase stack (Postgres, Auth, Storage, Studio)
#   3. The Vite dev server
#
# Run from Git Bash on Windows: bash run.sh

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

DOCKER_DESKTOP="/c/Program Files/Docker/Docker/Docker Desktop.exe"

echo "==> Checking Docker..."
if ! docker info >/dev/null 2>&1; then
  if [ ! -f "$DOCKER_DESKTOP" ]; then
    echo "Docker daemon isn't running and Docker Desktop wasn't found at:"
    echo "  $DOCKER_DESKTOP"
    echo "Start Docker Desktop manually, then re-run this script."
    exit 1
  fi
  echo "    Docker daemon not running, launching Docker Desktop..."
  "$DOCKER_DESKTOP" &
  disown

  echo "    Waiting for Docker to be ready..."
  tries=0
  until docker info >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [ "$tries" -gt 40 ]; then
      echo "Docker didn't come up after 2 minutes. Check Docker Desktop and try again."
      exit 1
    fi
    sleep 3
  done
fi
echo "    Docker is ready."

echo "==> Installing dependencies (if needed)..."
if [ ! -d node_modules ]; then
  npm install
fi

echo "==> Starting local Supabase stack..."
npx supabase start

echo "==> Starting dev server..."
exec npm run dev
