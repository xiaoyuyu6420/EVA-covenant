#!/bin/bash
# EVA Covenant - 数据库恢复脚本
# Usage: ./scripts/restore-db.sh [备份文件路径]
# 如果不指定路径，会列出可用备份供选择

set -e

# --- Config ---
DEPLOY_DIR="${DEPLOY_DIR:-/opt/eva-covenant}"
HEALTH_URL="http://localhost:8092/api/stats"
CONTAINER_NAME="eva-covenant"
COMPOSE_SERVICE="app"

# --- Locate volumes ---
# Try to find volume mount points via Docker, with fallback defaults
find_volume_path() {
  local volume_name="$1"
  local fallback="$2"
  local path
  path=$(docker volume inspect "$volume_name" --format '{{.Mountpoint}}' 2>/dev/null) || true
  if [ -n "$path" ] && [ -d "$path" ]; then
    echo "$path"
  else
    echo "$fallback"
  fi
}

BACKUP_DIR=$(find_volume_path "eva-covenant-backups" "/var/lib/docker/volumes/eva-covenant-backups/_data")
DB_VOLUME_PATH=$(find_volume_path "eva-covenant-db" "/var/lib/docker/volumes/eva-covenant-db/_data")
DB_PATH="$DB_VOLUME_PATH/eva-covenant.db"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# --- Header ---
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     EVA Covenant - 数据库恢复工具    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# --- Preflight ---
command -v docker >/dev/null 2>&1 || fail "Docker 未安装"
docker compose version >/dev/null 2>&1 || fail "Docker Compose 未安装"

if [ ! -d "$BACKUP_DIR" ]; then
  fail "备份目录不存在: $BACKUP_DIR"
fi

# --- Find backups (support both .db and .db.gz formats) ---
backups=()
while IFS= read -r f; do
  [ -n "$f" ] && backups+=("$f")
done < <(ls -t "$BACKUP_DIR"/eva-covenant_*.db "$BACKUP_DIR"/eva-covenant_*.db.gz 2>/dev/null)

if [ ${#backups[@]} -eq 0 ]; then
  fail "没有找到备份文件 ($BACKUP_DIR)"
fi

# --- Select backup ---
if [ -n "$1" ]; then
  selected_backup="$1"
  if [ ! -f "$selected_backup" ]; then
    fail "备份文件不存在: $selected_backup"
  fi
else
  info "可用备份 (${#backups[@]} 个):"
  echo ""
  for i in "${!backups[@]}"; do
    backup_file="${backups[$i]}"
    backup_name=$(basename "$backup_file")
    # Cross-platform date formatting
    backup_date=$(stat -c %y "$backup_file" 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup_file" 2>/dev/null || stat -f "%Sm" "$backup_file")
    backup_size=$(du -h "$backup_file" | cut -f1)
    echo -e "  ${CYAN}[$i]${NC} $backup_name ($backup_size) - $backup_date"
  done
  echo ""

  read -p "选择备份编号 (默认 0): " selection
  selection=${selection:-0}

  if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -ge "${#backups[@]}" ] || [ "$selection" -lt 0 ]; then
    fail "无效的选择: $selection"
  fi
  selected_backup="${backups[$selection]}"
fi

# --- Confirm ---
echo ""
echo -e "选择的备份: ${GREEN}$(basename "$selected_backup")${NC}"
echo -e "数据库路径: $DB_PATH"
echo -e "部署目录:   $DEPLOY_DIR"
echo ""
read -p "这将覆盖当前数据库，确定继续吗？(y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  info "已取消"
  exit 0
fi

# --- Stop service ---
echo ""
info "停止服务..."
cd "$DEPLOY_DIR"
docker compose stop "$COMPOSE_SERVICE"
ok "服务已停止"

# --- Backup current database before restore ---
if [ -f "$DB_PATH" ]; then
  before_restore="$DB_PATH.before-restore.$(date +%Y%m%d_%H%M%S)"
  cp "$DB_PATH" "$before_restore"
  ok "已备份当前数据库: $(basename "$before_restore")"
else
  warn "当前数据库文件不存在，跳过恢复前备份"
fi

# --- Restore database ---
info "恢复数据库..."
case "$selected_backup" in
  *.gz)
    gunzip -c "$selected_backup" > "$DB_PATH"
    ;;
  *)
    cp "$selected_backup" "$DB_PATH"
    ;;
esac
ok "数据库已恢复"

# --- Start service ---
info "启动服务..."
docker compose start "$COMPOSE_SERVICE"
ok "服务已启动"

# --- Health check ---
info "等待服务启动..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         恢复成功！服务已正常运行      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    echo ""
    exit 0
  fi
  echo "  尝试 $i/12..."
done

echo ""
warn "服务可能未正常启动，请检查日志:"
echo "  docker compose -f $DEPLOY_DIR/docker-compose.yml logs -f"
exit 1
