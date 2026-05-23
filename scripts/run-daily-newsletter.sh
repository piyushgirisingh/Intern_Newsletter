#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/output/logs"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"

{
  echo "[$(date --iso-8601=seconds)] Starting Xome Learning Brief"
  npm run generate
  echo "[$(date --iso-8601=seconds)] Finished Xome Learning Brief"
} >> "$LOG_DIR/daily-newsletter.log" 2>> "$LOG_DIR/daily-newsletter-error.log"
