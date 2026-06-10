#!/bin/bash
# EVA Covenant 一键部署脚本
# Usage: bash scripts/deploy.sh

set -e

DEPLOY_DIR="${DEPLOY_DIR:-/opt/eva-covenant}"
IMAGE="${IMAGE:-xiaoyuyu123/eva-covenant:latest}"
PORT="${PORT:-8092}"

echo "=== EVA Covenant Deploy ==="
echo "Target: $DEPLOY_DIR"
echo "Image:  $IMAGE"
echo "Port:   $PORT"
echo ""

# Clone or update
if [ -d "$DEPLOY_DIR" ]; then
  echo ">>> Updating existing deployment..."
  cd "$DEPLOY_DIR"
  git pull origin master
else
  echo ">>> Cloning repository..."
  git clone https://github.com/xiaoyuyu6420/EVA-covenant.git "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# Configure environment
if [ ! -f .env ]; then
  echo ">>> Creating .env from template..."
  cp .env.production.example .env
  echo ""
  echo "  ⚠️  Please edit $DEPLOY_DIR/.env and set:"
  echo "    - ADMIN_PASSWORD (管理后台密码)"
  echo "    - ADMIN_SECRET (Session 密钥)"
  echo ""
  read -p "  Press Enter to continue after editing .env, or Ctrl+C to abort..."
fi

# Pull latest image
echo ">>> Pulling latest image..."
docker pull "$IMAGE"

# Start services
echo ">>> Starting services..."
docker compose up -d

# Wait for health check
echo ">>> Waiting for health check..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf "http://localhost:$PORT/api/stats" > /dev/null 2>&1; then
    echo ""
    echo "=== Deploy Complete ==="
    echo "  URL:      http://localhost:$PORT"
    echo "  Admin:    http://localhost:$PORT/admin"
    echo "  Status:   Healthy"
    echo "  Backup:   Daily at midnight (30-day retention)"
    exit 0
  fi
  echo "  Attempt $i/12..."
done

echo ""
echo "=== Health check failed ==="
echo "Check logs: docker compose logs -f"
exit 1
