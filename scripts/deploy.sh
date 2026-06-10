#!/bin/bash
# EVA Covenant 一键部署脚本
# Usage: curl -sSL https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master/scripts/deploy.sh | bash

set -e

# --- Config ---
DEPLOY_DIR="${DEPLOY_DIR:-/opt/eva-covenant}"
IMAGE="${IMAGE:-xiaoyuyu123/eva-covenant:latest}"
PORT="${PORT:-8092}"
REPO_RAW="https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master"

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

# --- Preflight ---
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     EVA Covenant - 一键部署          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
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
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# --- Download compose & env ---
info "下载配置文件..."
curl -sSL "$REPO_RAW/docker-compose.yml" -o docker-compose.yml
curl -sSL "$REPO_RAW/.env.production.example" -o .env.production.example
ok "配置文件已下载"

# --- Environment ---
if [ ! -f .env ]; then
  cp .env.production.example .env

  # Generate random secret
  RANDOM_SECRET=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
  sed -i.bak "s/change-me-to-a-random-secret/$RANDOM_SECRET/" .env && rm -f .env.bak

  echo ""
  warn "请设置管理员密码（直接回车使用默认值 admin123）"
  read -p "ADMIN_PASSWORD: " -r ADMIN_PW
  if [ -n "$ADMIN_PW" ]; then
    sed -i.bak "s/change-me-to-a-strong-password/$ADMIN_PW/" .env && rm -f .env.bak
  fi

  # Set image
  sed -i.bak "s|# IMAGE=|IMAGE=$IMAGE|" .env && rm -f .env.bak
  sed -i.bak "s|PORT=8092|PORT=$PORT|" .env && rm -f .env.bak

  ok ".env 已生成"
else
  ok ".env 已存在，跳过配置"
fi

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
    # Get public IP
    PUBLIC_IP=$(curl -sf --connect-timeout 3 ifconfig.me 2>/dev/null || echo "<服务器IP>")
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          部署成功！                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}应用地址${NC}    http://${PUBLIC_IP}:${PORT}"
    echo -e "  ${CYAN}管理后台${NC}    http://${PUBLIC_IP}:${PORT}/admin"
    echo -e "  ${CYAN}配置文件${NC}    ${DEPLOY_DIR}/.env"
    echo -e "  ${CYAN}数据目录${NC}    Docker Volume: eva-covenant-db"
    echo -e "  ${CYAN}自动备份${NC}    每日备份，保留 30 天"
    echo ""
    echo -e "  ${YELLOW}常用命令${NC}"
    echo "  查看日志:    docker compose logs -f"
    echo "  重启服务:    docker compose restart"
    echo "  停止服务:    docker compose down"
    echo "  更新部署:    docker pull $IMAGE && docker compose up -d"
    echo ""
    exit 0
  fi
  echo "  尝试 $i/12..."
done

echo ""
fail "健康检查失败，查看日志: docker compose logs -f"
