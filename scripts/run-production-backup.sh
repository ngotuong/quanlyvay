#!/bin/zsh
set -euo pipefail

repo="/Users/ngotuong/AppsScript/QuanLyVayCaNhan"
log_dir="$repo/.backups/logs"
mkdir -p "$log_dir"

if ! /usr/local/bin/node "$repo/scripts/production-backup.mjs" ensure >>"$log_dir/launchd.log" 2>&1; then
  /usr/bin/osascript -e 'display notification "Backup Production thất bại. Mở PROJECT_CONTEXT.md để kiểm tra." with title "QuanLyVayCaNhan" subtitle "RPO backup cần xử lý"' || true
  exit 1
fi
