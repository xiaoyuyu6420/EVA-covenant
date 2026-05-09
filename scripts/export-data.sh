#!/bin/bash
# 导出生产数据到本地开发环境
# Usage: ./scripts/export-data.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXPORT_FILE="$PROJECT_DIR/backups/export_$(date +%Y%m%d_%H%M%S).sql"

mkdir -p "$PROJECT_DIR/backups"

echo ">>> Exporting data..."

# 导出为 SQL (schema + data)
npx prisma migrate diff \
    --from-empty \
    --to-schema-datamodel "$PROJECT_DIR/prisma/schema.prisma" \
    --script > "$EXPORT_FILE.schema.sql"

echo "✅ Schema exported"

# 注意：要导出数据，需要在服务器上运行:
# sqlite3 prisma/eva-covenant.db .dump > backup.sql
# 然后下载 backup.sql 到本地

echo ""
echo "💡 To export production data, run on server:"
echo "   sqlite3 prisma/eva-covenant.db .dump > data.sql"
echo ""
echo "💡 Then import locally:"
echo "   sqlite3 prisma/eva-covenant.db < data.sql"
