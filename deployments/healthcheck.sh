#!/bin/bash

# Health Check Probe — Milestone 27
# Probes backend liveness/readiness and frontend responsiveness

BACKEND_URL="http://localhost:5000/api/v1/health"
FRONTEND_URL="http://localhost:80"
MAX_ATTEMPTS=5
DELAY_SECONDS=3

echo "[HEALTH] Starting service health checks..."

# 1. Probe Backend Liveness
for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
  echo "[HEALTH] Attempting backend liveness check ($attempt/$MAX_ATTEMPTS)..."
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/live" || echo "000")
  if [ "$STATUS_CODE" -eq 200 ]; then
    echo "✓ [HEALTH] Backend liveness check passed."
    break
  fi
  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "🚨 [HEALTH] Backend liveness check failed with status $STATUS_CODE after $MAX_ATTEMPTS attempts."
    exit 1
  fi
  sleep "$DELAY_SECONDS"
done

# 2. Probe Backend Readiness (DB & cache check)
for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
  echo "[HEALTH] Attempting backend readiness check ($attempt/$MAX_ATTEMPTS)..."
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/ready" || echo "000")
  if [ "$STATUS_CODE" -eq 200 ]; then
    echo "✓ [HEALTH] Backend readiness check passed."
    break
  fi
  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "🚨 [HEALTH] Backend readiness check failed with status $STATUS_CODE after $MAX_ATTEMPTS attempts."
    exit 1
  fi
  sleep "$DELAY_SECONDS"
done

# 3. Probe Frontend UI
for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
  echo "[HEALTH] Attempting frontend UI responsiveness check ($attempt/$MAX_ATTEMPTS)..."
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
  if [ "$STATUS_CODE" -eq 200 ]; then
    echo "✓ [HEALTH] Frontend UI check passed."
    break
  fi
  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "🚨 [HEALTH] Frontend UI check failed with status $STATUS_CODE after $MAX_ATTEMPTS attempts."
    exit 1
  fi
  sleep "$DELAY_SECONDS"
done

echo "✅ [HEALTH] All health checks passed successfully!"
exit 0
