#!/bin/bash
set -e

# Enterprise Deploy Script — Milestone 27
# Deploys backend and frontend services via Docker Compose and triggers health validation

echo "[DEPLOY] Starting LMS deployment sequence..."

# 1. Back up currently running image tags for rollback if needed
if [ -f .env ]; then
  echo "[DEPLOY] Saving current environment states..."
  cp .env .env.bak || true
fi

# Store currently running image tag for rollback
CURRENT_TAG=$(docker inspect --format='{{.Config.Image}}' lms-backend-prod 2>/dev/null | cut -d':' -f2 || echo "latest")
echo "CURRENT_TAG=$CURRENT_TAG" > .rollback_tag

# 2. Pull new Docker images from Registry
echo "[DEPLOY] Pulling production images from ECR..."
docker compose -f docker-compose.prod.yml pull backend frontend redis

# 3. Gracefully recreate services
echo "[DEPLOY] Recreating containers with zero-downtime parameters..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 4. Wait for services to warm up
echo "[DEPLOY] Waiting for service startup initialization (10 seconds)..."
sleep 10

# 5. Verify deployment health
echo "[DEPLOY] Running health validation checks..."
if ! ./deployments/healthcheck.sh; then
  echo "🚨 [DEPLOY] Health checks FAILED. Triggering automatic rollback..."
  ./deployments/rollback.sh
  exit 1
fi

echo "✅ [DEPLOY] LMS successfully deployed and verified healthy!"
rm -f .env.bak .rollback_tag || true
