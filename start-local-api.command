#!/bin/zsh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "Starting Lycan local API at http://127.0.0.1:4000"
echo "Keep this window open while using the app."
exec python3 backend/mock_api_server.py
