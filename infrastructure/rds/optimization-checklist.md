# RDS Optimization Checklist
# IndiWebPros LMS — Milestone 24

## Current Database
- **Identifier**: `indiwebpros-lms-db`
- **Engine**: PostgreSQL
- **Endpoint**: `indiwebpros-lms-db.c0vy4gm62vv8.us-east-1.rds.amazonaws.com`
- **Region**: `us-east-1`

---

## ✅ Recommended Settings (Apply in AWS Console)

### 1. Backup Retention — 7 Days
```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --no-apply-immediately
```
**Console**: RDS → Databases → indiwebpros-lms-db → Modify → Backup retention period = 7

---

### 2. Enable Deletion Protection
```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --deletion-protection \
  --no-apply-immediately
```
**Console**: RDS → Databases → indiwebpros-lms-db → Modify → Deletion protection ✅

---

### 3. Enable Storage Autoscaling
```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --max-allocated-storage 100 \
  --no-apply-immediately
```
- **Initial**: 20 GB  
- **Max**: 100 GB  
- AWS automatically increases storage when 90% full

---

### 4. Enable Performance Insights
```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --no-apply-immediately
```
**Console**: RDS → Databases → indiwebpros-lms-db → Modify → Performance Insights ✅

---

### 5. Enable Automatic Minor Version Upgrades
```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --auto-minor-version-upgrade \
  --no-apply-immediately
```

---

### 6. Apply Custom Parameter Group
Run `infrastructure/cloudwatch/setup.sh` — it creates and applies `indiwebpros-lms-pg16`.

**Key parameters applied:**
| Parameter | Value | Effect |
|-----------|-------|--------|
| `log_min_duration_statement` | 1000ms | Log slow queries |
| `log_connections` | 1 | Audit connections |
| `log_disconnections` | 1 | Audit disconnections |
| `log_lock_waits` | 1 | Detect deadlocks |
| `idle_in_transaction_session_timeout` | 30000ms | Kill idle transactions |
| `statement_timeout` | 30000ms | Kill runaway queries |
| `shared_preload_libraries` | pg_stat_statements | Query analysis |

⚠️ **Reboot required** after applying parameter group.

---

### 7. Encryption at Rest
> **Note**: Encryption at rest must be set during DB creation and cannot be changed.
> If your current instance is not encrypted, you need to:
> 1. Create an encrypted snapshot: `aws rds copy-db-snapshot --source-db-snapshot-identifier <snap> --target-db-snapshot-identifier <snap-encrypted> --kms-key-id aws/rds`
> 2. Restore from encrypted snapshot to a new encrypted instance
> 3. Update `DATABASE_URL` in Secrets Manager

**Check current encryption status:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier indiwebpros-lms-db \
  --query 'DBInstances[0].StorageEncrypted'
```

---

### 8. Multi-AZ (High Availability — Future)
Enables automatic failover in case of AZ failure.
- **Cost**: ~2x instance cost
- **RTO**: 1-3 minutes automatic failover
- **Recommended when**: Production traffic > 100 users/day

```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --multi-az \
  --apply-immediately
```

---

### 9. Database Indexes
Apply performance indexes:
```bash
psql $DATABASE_URL -f database/migrations/add-performance-indexes.sql
```
Indexes created (CONCURRENTLY — zero downtime):
- `idx_enrollment_userId_status`
- `idx_payment_userId_status`
- `idx_auditLog_userId_action`
- `idx_notification_userId_isRead`
- `idx_courseProgress_userId_lessonId`
- `idx_course_status_createdAt`
- `idx_user_email` (unique)
- +8 more

---

### 10. Connection Pool Limits
| Instance Type | Max Connections | Recommended Pool |
|--------------|----------------|-----------------|
| db.t3.micro | 85 | 20-30 |
| db.t3.small | 170 | 40-60 |
| db.t3.medium | 340 | 80-100 |

Current `max_connections` set to 100 in parameter group.  
For high traffic: add **PgBouncer** as a connection pooler in front of RDS.

---

## Monitoring Commands

```bash
# Check instance status
aws rds describe-db-instances \
  --db-instance-identifier indiwebpros-lms-db \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Class:DBInstanceClass,Storage:AllocatedStorage,MultiAZ:MultiAZ,Encrypted:StorageEncrypted,BackupRetention:BackupRetentionPeriod}'

# Check performance insights (last 1 hour)
aws pi get-resource-metrics \
  --service-type RDS \
  --identifier db:indiwebpros-lms-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --metric-queries MetricName=db.load.avg,GroupBy="{Group=db.sql,Limit=10}"
```
