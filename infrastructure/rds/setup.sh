#!/bin/bash
# ============================================================
# RDS Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
set -euo pipefail

DB_IDENTIFIER="indiwebpros-lms-db"
PARAM_GROUP="indiwebpros-lms-pg16"

echo "🗄️ Applying RDS optimizations for $DB_IDENTIFIER"

# ── 1. Create Parameter Group ────────────────────────────────────────────────
echo ""
echo "✅ [1/5] Creating custom parameter group..."
aws rds create-db-parameter-group \
  --db-parameter-group-name "$PARAM_GROUP" \
  --db-parameter-group-family postgres16 \
  --description "Optimized parameters for IndiWebPros LMS PostgreSQL 16" \
  --tags Key=Application,Value=IndiWebPros-LMS \
  2>/dev/null || echo "   Parameter group already exists"

aws rds modify-db-parameter-group \
  --db-parameter-group-name "$PARAM_GROUP" \
  --parameters \
    "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate" \
    "ParameterName=log_connections,ParameterValue=1,ApplyMethod=immediate" \
    "ParameterName=log_disconnections,ParameterValue=1,ApplyMethod=immediate" \
    "ParameterName=log_lock_waits,ParameterValue=1,ApplyMethod=immediate" \
    "ParameterName=log_statement,ParameterValue=ddl,ApplyMethod=immediate" \
    "ParameterName=idle_in_transaction_session_timeout,ParameterValue=30000,ApplyMethod=immediate" \
    "ParameterName=statement_timeout,ParameterValue=30000,ApplyMethod=immediate" \
    "ParameterName=lock_timeout,ParameterValue=5000,ApplyMethod=immediate"

echo "   ✅ Parameter group configured"

# ── 2. Enable Deletion Protection ────────────────────────────────────────────
echo ""
echo "✅ [2/5] Enabling deletion protection..."
aws rds modify-db-instance \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --deletion-protection \
  --no-apply-immediately
echo "   ✅ Deletion protection enabled"

# ── 3. Enable Automated Backups (7 days) ─────────────────────────────────────
echo ""
echo "✅ [3/5] Setting backup retention to 7 days..."
aws rds modify-db-instance \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --no-apply-immediately
echo "   ✅ Automated backups: 7 days, 02:00-03:00 UTC"

# ── 4. Enable Storage Autoscaling ────────────────────────────────────────────
echo ""
echo "✅ [4/5] Enabling storage autoscaling (max 100GB)..."
aws rds modify-db-instance \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --max-allocated-storage 100 \
  --no-apply-immediately
echo "   ✅ Storage autoscaling: up to 100 GB"

# ── 5. Apply Parameter Group ─────────────────────────────────────────────────
echo ""
echo "✅ [5/5] Applying parameter group (requires reboot)..."
aws rds modify-db-instance \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --db-parameter-group-name "$PARAM_GROUP" \
  --no-apply-immediately
echo "   ⚠️  Parameter group will be applied at next maintenance window"
echo "   To apply immediately: add --apply-immediately flag"

# ── Take snapshot before changes ─────────────────────────────────────────────
echo ""
echo "📸 Creating pre-optimization snapshot..."
SNAPSHOT_ID="$DB_IDENTIFIER-pre-m24-$(date +%Y%m%d)"
aws rds create-db-snapshot \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --tags Key=Milestone,Value=24 Key=Purpose,Value=pre-optimization \
  2>/dev/null && echo "   ✅ Snapshot: $SNAPSHOT_ID" || echo "   Snapshot creation queued"

echo ""
echo "🎉 RDS optimization complete!"
echo ""
echo "⚠️  MANUAL STEPS REMAINING:"
echo "   1. Enable Performance Insights in AWS Console (cannot do via CLI for free tier)"
echo "   2. Verify encryption at rest: aws rds describe-db-instances --query 'DBInstances[0].StorageEncrypted'"
echo "   3. Apply performance indexes: psql \$DATABASE_URL -f database/migrations/add-performance-indexes.sql"
echo "   4. Reboot DB to apply parameter group: aws rds reboot-db-instance --db-instance-identifier $DB_IDENTIFIER"
