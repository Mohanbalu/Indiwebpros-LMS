# Backup Strategy & Disaster Recovery
# Milestone 24 — IndiWebPros LMS

## Backup Overview

| Asset | Backup Method | Frequency | Retention | Recovery Time |
|-------|--------------|-----------|-----------|---------------|
| RDS PostgreSQL | Automated backups | Daily | 7 days | < 1 hour |
| RDS PostgreSQL | Manual snapshots | Weekly | 30 days | 1-2 hours |
| S3 Files | Versioning | Every write | Indefinite | Minutes |
| Certificates (PDF) | S3 Versioning + Glacier | Every write | Forever | Minutes |
| Application Code | GitHub | Every commit | Forever | < 30 min |
| Secrets | Secrets Manager rotation | 90 days | Previous version | < 5 min |

---

## 1. RDS Automated Backups

### Enable Automated Backups (AWS CLI)
```bash
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --no-apply-immediately
```

### Create Manual Snapshot (before major changes)
```bash
aws rds create-db-snapshot \
  --db-instance-identifier indiwebpros-lms-db \
  --db-snapshot-identifier indiwebpros-lms-$(date +%Y%m%d)-pre-deploy
```

### List Snapshots
```bash
aws rds describe-db-snapshots \
  --db-instance-identifier indiwebpros-lms-db \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

---

## 2. Database Point-in-Time Restore (PITR)

RDS provides PITR to any second within the backup retention period.

### Restore to specific time
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier indiwebpros-lms-db \
  --target-db-instance-identifier indiwebpros-lms-db-restored \
  --restore-time 2026-07-14T03:00:00Z \
  --db-instance-class db.t3.micro \
  --no-multi-az
```

### Steps after restore:
1. Test restored instance: verify data integrity
2. Update `DATABASE_URL` in Secrets Manager to point to restored instance
3. Restart EC2 application (pm2 restart)
4. Promote restored instance to primary
5. Delete old instance

---

## 3. S3 Object Recovery

### Restore specific file version
```bash
# List versions of a specific object
aws s3api list-object-versions \
  --bucket indiwebpros-lms-bucket \
  --prefix certificates/CERT_ID.pdf

# Restore specific version
aws s3api get-object \
  --bucket indiwebpros-lms-bucket \
  --key certificates/CERT_ID.pdf \
  --version-id VERSION_ID \
  /tmp/restored-cert.pdf
```

### Restore accidentally deleted objects
```bash
# Find delete markers
aws s3api list-object-versions \
  --bucket indiwebpros-lms-bucket \
  --query 'DeleteMarkers[?Key==`path/to/file`]'

# Remove delete marker to restore object
aws s3api delete-object \
  --bucket indiwebpros-lms-bucket \
  --key path/to/file \
  --version-id DELETE_MARKER_VERSION_ID
```

---

## 4. Secret Recovery

```bash
# Get current secret value
aws secretsmanager get-secret-value \
  --secret-id indiwebpros-lms/production

# List previous versions
aws secretsmanager list-secret-version-ids \
  --secret-id indiwebpros-lms/production

# Restore previous version
aws secretsmanager get-secret-value \
  --secret-id indiwebpros-lms/production \
  --version-id PREVIOUS_VERSION_ID
```

---

## 5. Disaster Recovery Runbook

### Scenario A: EC2 Instance Failure

**RTO**: < 30 minutes

1. Launch new EC2 instance from AMI
2. Attach IAM instance profile: `indiwebpros-lms-instance-profile`
3. Register with ALB target group
4. Application loads secrets from Secrets Manager automatically
5. Health check passes → traffic resumes

### Scenario B: RDS Failure (Single AZ)

**RTO**: < 1 hour

1. If Multi-AZ: automatic failover (3-5 minutes, AWS managed)
2. If Single-AZ: restore from latest automated backup (30-60 min)
3. Update DATABASE_URL in Secrets Manager if endpoint changes
4. Restart application

### Scenario C: S3 Bucket Accidental Deletion

**RTO**: < 2 hours  
**Note**: Cannot delete versioning-enabled bucket with objects

1. Create new bucket with same name
2. Re-enable versioning, encryption, lifecycle rules
3. Restore objects from Glacier/backup if available
4. Certificates: regenerate from database records + PDFCertificateProvider

### Scenario D: Secrets Compromise

**RTO**: < 15 minutes

1. Immediately rotate all exposed secrets:
   ```bash
   # Rotate JWT secrets (requires app restart)
   aws secretsmanager put-secret-value \
     --secret-id indiwebpros-lms/production \
     --secret-string '{"JWT_SECRET": "NEW_STRONG_SECRET"}'
   
   # Invalidate all active JWT tokens (update JWT_SECRET)
   # Users will be logged out and need to re-authenticate
   ```
2. Rotate Razorpay API keys in Razorpay dashboard
3. Deactivate compromised IAM access key
4. Update DATABASE_URL password in RDS + Secrets Manager
5. Audit CloudTrail for unauthorized access

---

## 6. Backup Validation Schedule

| Test | Frequency | Procedure |
|------|-----------|-----------|
| RDS restore test | Monthly | Restore to new instance, verify row counts |
| S3 restore test | Quarterly | Restore random file, verify integrity |
| Secret rotation test | Monthly | Rotate non-critical secret, verify app health |
| Full DR drill | Quarterly | Simulate EC2 failure, measure RTO |
