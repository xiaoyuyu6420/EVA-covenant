#!/bin/bash
# 数据库备份脚本
# Usage: ./scripts/backup-db.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_DIR/prisma/eva-covenant.db"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found: $DB_PATH"
    exit 1
fi

# 使用 SQLite 备份 (跨平台兼容)
if command -v sqlite3 &> /dev/null; then
    sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/backup_$DATE.db'"
    echo "✅ Backup created: backups/backup_$DATE.db"
else
    # 如果没有 sqlite3，直接复制 (可能不保证一致性)
    cp "$DB_PATH" "$BACKUP_DIR/backup_$DATE.db"
    echo "⚠️ sqlite3 not found, copied file (may not be consistent): backups/backup_$DATE.db"
fi

# 保留最近 10 个备份
ls -t "$BACKUP_DIR"/backup_*.db 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "📊 Total backups: $(ls -1 "$BACKUP_DIR"/backup_*.db 2>/dev/null | wc -l)"
