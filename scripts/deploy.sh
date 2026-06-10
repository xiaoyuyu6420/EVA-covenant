#!/bin/bash
# EVA Covenant 一键部署脚本
# Usage: curl -sSL https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master/scripts/deploy.sh | bash
# 回滚: cd $DEPLOY_DIR && ./scripts/deploy.sh --rollback

set -e

# --- Config ---
DEPLOY_DIR="${DEPLOY_DIR:-/home/eva-covenant}"
IMAGE="${IMAGE:-xiaoyuyu123/eva-covenant:latest}"
PORT="${PORT:-8092}"
REPO_RAW="https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master"
# GitHub 镜像加速（国内）
GITHUB_PROXY="${GITHUB_PROXY:-https://ghfast.top/https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master}"

# --- Version Management ---
VERSION_FILE="$DEPLOY_DIR/.current-version"

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

# --- Download with mirror fallback ---
download_file() {
  local path="$1"
  local output="$2"
  if curl -sSf --connect-timeout 10 -o "$output" "${REPO_RAW}/${path}" 2>/dev/null; then
    return 0
  fi
  warn "直连失败，尝试镜像加速..."
  curl -sSf --connect-timeout 10 -o "$output" "${GITHUB_PROXY}/${path}"
}

# --- Rollback ---
rollback() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║     EVA Covenant - 版本回滚          ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
  echo ""

  if [ ! -f "$VERSION_FILE" ]; then
    fail "没有版本记录文件 ($VERSION_FILE)，无法回滚"
  fi

  current=$(cat "$VERSION_FILE")
  previous=$(grep -v "^${current}$" "${VERSION_FILE}.history" 2>/dev/null | tail -1)

  if [ -z "$previous" ]; then
    fail "没有找到上一个版本，请检查 ${VERSION_FILE}.history"
  fi

  info "当前版本: $current"
  info "回滚版本: $previous"
  read -p "确定回滚吗？[y/N] " -r confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    info "已取消回滚"
    exit 0
  fi

  cd "$DEPLOY_DIR"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|image: .*xiaoyuyu123/eva-covenant:.*|image: xiaoyuyu123/eva-covenant:${previous}|" docker-compose.yml
  else
    sed -i "s|image: .*xiaoyuyu123/eva-covenant:.*|image: xiaoyuyu123/eva-covenant:${previous}|" docker-compose.yml
  fi

  info "拉取镜像: xiaoyuyu123/eva-covenant:${previous}"
  docker compose pull
  docker compose up -d

  echo "$previous" > "$VERSION_FILE"

  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║     回滚完成！版本: ${previous}$(printf '%*s' $((20 - ${#previous})) '')║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
  exit 0
}

# --- Check rollback flag ---
if [ "$1" = "--rollback" ] || [ "$1" = "-r" ]; then
  rollback
fi

# --- Preflight ---
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     EVA Covenant - 一键部署          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}提示: 使用 --rollback 可回滚到上一个版本${NC}"
echo ""

command -v docker >/dev/null 2>&1 || fail "Docker 未安装，请先安装 Docker"
docker compose version >/dev/null 2>&1 || fail "Docker Compose 未安装"

# --- Docker mirror (China) ---
info "检测 Docker 镜像加速..."
DAEMON_JSON="/etc/docker/daemon.json"
if [ ! -f "$DAEMON_JSON" ] || ! grep -q "registry-mirrors" "$DAEMON_JSON" 2>/dev/null; then
  warn "未检测到镜像加速配置"
  read -p "是否配置国内镜像加速？[Y/n] " -r -n 1 CONFIRM_MIRROR
  echo ""
  if [[ ! "$CONFIRM_MIRROR" =~ ^[Nn]$ ]]; then
    MIRROR_URL="${DOCKER_MIRROR:-https://docker.1ms.run}"
    info "配置镜像加速: $MIRROR_URL"
    if [ -f "$DAEMON_JSON" ]; then
      TMP=$(mktemp)
      python3 -c "
import json
with open('$DAEMON_JSON') as f: d = json.load(f)
d.setdefault('registry-mirrors', []).insert(0, '$MIRROR_URL')
with open('$TMP', 'w') as f: json.dump(d, f, indent=2)
" 2>/dev/null && mv "$TMP" "$DAEMON_JSON"
    else
      mkdir -p /etc/docker
      cat > "$DAEMON_JSON" << EOF2
{
  "registry-mirrors": ["$MIRROR_URL"]
}
EOF2
    fi
    systemctl daemon-reload && systemctl restart docker
    ok "镜像加速已配置"
  fi
else
  ok "镜像加速已配置"
fi

# --- Deploy directory ---
info "部署目录: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"/{data,backups}
cd "$DEPLOY_DIR"

# --- Backup & Download compose & env ---
info "下载配置文件..."
if [ -f docker-compose.yml ]; then
  backup_name="docker-compose.yml.backup.$(date +%Y%m%d%H%M%S)"
  cp docker-compose.yml "$backup_name"
  info "已备份: $backup_name"
fi
download_file "docker-compose.yml" "docker-compose.yml"
download_file ".env.production.example" ".env.production.example"
ok "配置文件已下载"

# --- Environment ---
if [ ! -f .env ]; then
  # Prompt password BEFORE creating .env
  echo ""
  warn "首次部署，请设置管理后台密码"
  ADMIN_PW=""
  while true; do
    read -sp "请输入管理密码: " ADMIN_PW
    echo ""
    if [ -z "$ADMIN_PW" ]; then
      warn "密码不能为空"
      continue
    fi
    read -sp "确认密码: " ADMIN_PW_CONFIRM
    echo ""
    if [ "$ADMIN_PW" != "$ADMIN_PW_CONFIRM" ]; then
      warn "密码不匹配，请重新输入"
      continue
    fi
    break
  done

  # Create .env from template
  cp .env.production.example .env

  RANDOM_SECRET=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | xxd -p)

  TMP_ENV=$(mktemp)
  awk -v secret="$RANDOM_SECRET" '{gsub(/change-me-to-a-random-secret/, secret); print}' .env > "$TMP_ENV" && mv "$TMP_ENV" .env
  TMP_ENV=$(mktemp)
  awk -v pw="$ADMIN_PW" '{gsub(/change-me-to-a-strong-password/, pw); print}' .env > "$TMP_ENV" && mv "$TMP_ENV" .env
  # Replace full line to avoid concatenation bug
  TMP_ENV=$(mktemp)
  awk -v image="$IMAGE" '{gsub(/^#\s*IMAGE=.*/, "IMAGE=" image); print}' .env > "$TMP_ENV" && mv "$TMP_ENV" .env
  TMP_ENV=$(mktemp)
  awk -v port="$PORT" '{gsub(/^PORT=.*/, "PORT=" port); print}' .env > "$TMP_ENV" && mv "$TMP_ENV" .env

  ok ".env 已生成"
else
  ok ".env 已存在，跳过配置"
  # Fix corrupted IMAGE value (e.g. duplicated image name from old bug)
  if grep -q "^IMAGE=" .env 2>/dev/null; then
    CURRENT_IMG=$(grep "^IMAGE=" .env | cut -d= -f2)
    if [ "$CURRENT_IMG" != "$IMAGE" ]; then
      TMP_ENV=$(mktemp)
      awk -v image="$IMAGE" '{gsub(/^IMAGE=.*/, "IMAGE=" image); print}' .env > "$TMP_ENV" && mv "$TMP_ENV" .env
      info "已修正 IMAGE: $CURRENT_IMG -> $IMAGE"
    fi
  fi
fi

# --- Version tracking ---
CURRENT_VERSION="latest"
if [ -f "$VERSION_FILE" ]; then
  PREVIOUS_VERSION=$(cat "$VERSION_FILE")
  echo "$PREVIOUS_VERSION" >> "${VERSION_FILE}.history"
  info "记录版本历史: $PREVIOUS_VERSION"
fi
echo "$CURRENT_VERSION" > "$VERSION_FILE"

# --- Login Docker Hub ---
info "拉取镜像: $IMAGE"
if ! docker pull "$IMAGE" 2>/dev/null; then
  warn "拉取失败，可能需要登录 Docker Hub"
  read -p "Docker Hub 用户名 (回车跳过): " -r DH_USER
  if [ -n "$DH_USER" ]; then
    read -sp "Docker Hub Access Token: " -r DH_TOKEN
    echo ""
    echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin
    docker pull "$IMAGE"
  else
    fail "无法拉取镜像，请检查网络或手动 docker login"
  fi
fi
ok "镜像拉取成功"

# --- Start ---
info "启动服务..."
docker compose up -d

# --- Health check ---
info "等待健康检查..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf "http://localhost:$PORT/api/stats" > /dev/null 2>&1; then
    PUBLIC_IP=$(curl -sf --connect-timeout 3 ifconfig.me 2>/dev/null || echo "<服务器IP>")
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          部署成功！                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}应用地址${NC}    http://${PUBLIC_IP}:${PORT}"
    echo -e "  ${CYAN}管理后台${NC}    http://${PUBLIC_IP}:${PORT}/admin"
    echo -e "  ${CYAN}配置文件${NC}    ${DEPLOY_DIR}/.env"
    echo -e "  ${CYAN}数据目录${NC}    ${DEPLOY_DIR}/data"
    echo -e "  ${CYAN}备份目录${NC}    ${DEPLOY_DIR}/backups"
    echo -e "  ${CYAN}当前版本${NC}    ${CURRENT_VERSION}"
    echo -e "  ${CYAN}自动备份${NC}    每 6 小时备份，保留 30 份"
    echo ""
    echo -e "  ${YELLOW}常用命令${NC}"
    echo "  查看日志:    docker compose logs -f"
    echo "  重启服务:    docker compose restart"
    echo "  停止服务:    docker compose down"
    echo "  更新部署:    docker pull $IMAGE && docker compose up -d"
    echo "  回滚版本:    $0 --rollback"
    echo ""
    exit 0
  fi
  echo "  尝试 $i/12..."
done

echo ""
fail "健康检查失败，查看日志: docker compose logs -f"
