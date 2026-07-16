#!/bin/bash

# Automatic Rollback Engine — Milestone 27
# Restores the application to the last known stable state in case of deployment failures

echo "🚨 [ROLLBACK] Initiating rollback procedure..."

# 1. Restore previous environment file if backup exists
if [ -f .env.bak ]; then
  echo "[ROLLBACK] Reverting environment variables config..."
  cp .env.bak .env
fi

# 2. Extract rollback tag
ROLLBACK_TAG="latest"
if [ -f .rollback_tag ]; then
  source .rollback_tag
  ROLLBACK_TAG=$CURRENT_TAG
fi

echo "[ROLLBACK] Reverting service image tags to: $ROLLBACK_TAG"

# 3. Pull last known stable images if needed and restart
IMAGE_TAG=$ROLLBACK_TAG docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 4. Verify rollback success
echo "[ROLLBACK] Verifying rolled-back services status..."
sleep 5

# Probes liveness checks only during rollback to ensure basic server is functional
BACKEND_URL="http://localhost:5000/api/v1/health"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/live" || echo "000")

if [ "$STATUS_CODE" -eq 200 ]; then
  echo "✅ [ROLLBACK] Rollback successfully completed! Application has been restored to stable version: $ROLLBACK_TAG"
  exit 0
else
  echo "❌ [ROLLBACK] CRITICAL ERROR: Rollback failed. Stable services could not be restored. Manual intervention required."
  exit 1
fi
