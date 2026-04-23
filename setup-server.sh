#!/bin/bash
# EVA-Covenant 服务器初始化脚本
# 用法: 在新服务器上运行 bash setup-server.sh
#
# 前置条件:
#   - Ubuntu 20.04+ / Debian 11+ / CentOS 8+
#   - 有 root 或 sudo 权限
#   - 开放了 80/443/3002 端口

set -e

DEPLOY_DIR="${1:-/opt/eva-covenant}"
echo "=== EVA-Covenant 服务器初始化 ==="
echo "部署目录: $DEPLOY_DIR"
echo ""

# 1. 安装 Docker
if ! command -v docker &>/dev/null; then
  echo ">>> 安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "Docker 安装完成"
else
  echo "Docker 已安装，跳过"
fi

# 2. 安装 docker compose
if ! docker compose version &>/dev/null; then
  echo ">>> 安装 Docker Compose..."
  apt-get update && apt-get install -y docker-compose-plugin 2>/dev/null || true
fi

# 3. 安装 git
if ! command -v git &>/dev/null; then
  echo ">>> 安装 Git..."
  apt-get update && apt-get install -y git
fi

# 4. 克隆仓库
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo ">>> 克隆仓库到 $DEPLOY_DIR ..."
  git clone https://github.com/YOUR_USERNAME/EVA-covenant.git "$DEPLOY_DIR"
else
  echo "仓库已存在: $DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

# 5. 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
  echo ">>> 创建 .env ..."
  cat > .env << 'ENVEOF'
# 管理员密码（必改）
ADMIN_PASSWORD=你的管理员密码
# JWT 密钥（必改）
ADMIN_SECRET=换一个随机字符串
# 端口
PORT=3002
ENVEOF
  echo "已创建 .env，请编辑 $DEPLOY_DIR/.env 修改密码！"
fi

# 6. 构建并启动
echo ">>> 构建并启动容器..."
docker compose up -d --build

echo ""
echo "=== 部署完成! ==="
echo "访问: http://你的服务器IP:3002"
echo "后台: http://你的服务器IP:3002/admin"
echo ""
echo "下一步:"
echo "  1. 编辑 .env 修改管理员密码"
echo "  2. 在 GitHub 仓库 Settings → Secrets 中添加:"
echo "     SERVER_HOST = 你的服务器IP"
echo "     SERVER_USER = root (或你的用户名)"
echo "     SERVER_SSH_KEY = 服务器 SSH 私钥"
echo "     DEPLOY_PATH = $DEPLOY_DIR"
