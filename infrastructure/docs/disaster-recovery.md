# Disaster Recovery Plan
# IndiWebPros LMS — Milestone 24

## Recovery Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| EC2 instance failure | < 30 min | 0 (stateless) |
| RDS single-AZ failure | < 60 min | < 5 min (PITR) |
| RDS Multi-AZ failover | < 5 min | < 1 min |
| S3 object deletion | < 5 min | 0 (versioning) |
| S3 bucket deletion | < 4 hours | Last version |
| Secrets compromise | < 15 min | N/A |
| Full region outage | < 4 hours | < 24 hours |

---

## Scenario 1: EC2 Instance Failure

**Detection**: CloudWatch alarm → SNS → Email  
**RTO**: < 30 minutes

```bash
# Step 1: Identify failed instance
aws ec2 describe-instances \
  --filters "Name=tag:Application,Values=IndiWebPros-LMS" \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name]'

# Step 2: Launch replacement from latest AMI
# (Create AMI first: aws ec2 create-image --instance-id i-XXX --name "lms-app-YYYYMMDD")
aws ec2 run-instances \
  --image-id ami-XXXXXXXX \
  --instance-type t3.small \
  --iam-instance-profile Name=indiwebpros-lms-instance-profile \
  --security-group-ids sg-XXXXXXXX \
  --subnet-id subnet-XXXXXXXX \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Application,Value=IndiWebPros-LMS}]'

# Step 3: Register with ALB
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-NEWINSTANCEID

# Step 4: Verify health check
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...
```

**App starts automatically** because:
- Secrets loaded from Secrets Manager (no .env needed)
- IAM instance profile provides all credentials
- PM2 configured as system service (`pm2 startup`)

---

## Scenario 2: RDS Database Failure

**Detection**: CloudWatch RDS alarm → SNS  
**RTO**: < 60 min (Single-AZ) | < 5 min (Multi-AZ auto-failover)

### Option A: Point-in-Time Recovery
```bash
# Restore to 5 minutes before incident
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier indiwebpros-lms-db \
  --target-db-instance-identifier indiwebpros-lms-db-dr \
  --restore-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --db-instance-class db.t3.micro \
  --no-multi-az

# Wait for available status (~20 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier indiwebpros-lms-db-dr

# Get new endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier indiwebpros-lms-db-dr \
  --query 'DBInstances[0].Endpoint.Address' --output text)

# Update Secrets Manager with new DATABASE_URL
aws secretsmanager put-secret-value \
  --secret-id indiwebpros-lms/production \
  --secret-string "{\"DATABASE_URL\": \"postgresql://postgres:PASSWORD@$NEW_ENDPOINT:5432/postgres?schema=public\"}"

# Restart application (loads new DATABASE_URL from Secrets Manager)
aws ssm send-command \
  --instance-ids i-EC2_INSTANCE_ID \
  --document-name AWS-RunShellScript \
  --parameters commands=["pm2 restart all"]
```

### Option B: Restore from Snapshot
```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier indiwebpros-lms-db \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier indiwebpros-lms-db-restored \
  --db-snapshot-identifier indiwebpros-lms-YYYYMMDD
```

---

## Scenario 3: S3 Object Recovery

```bash
# List all versions of a file
aws s3api list-object-versions \
  --bucket indiwebpros-lms-bucket \
  --prefix certificates/CERT_ID.pdf

# Restore deleted object (remove delete marker)
aws s3api delete-object \
  --bucket indiwebpros-lms-bucket \
  --key certificates/CERT_ID.pdf \
  --version-id DELETE_MARKER_VERSION_ID

# Download specific version
aws s3api get-object \
  --bucket indiwebpros-lms-bucket \
  --key certificates/CERT_ID.pdf \
  --version-id VERSION_ID \
  /tmp/restored-cert.pdf
```

---

## Scenario 4: Secrets Compromise

**IMMEDIATE RESPONSE (< 5 minutes):**

```bash
# 1. Rotate JWT secrets (forces all users to re-login)
NEW_JWT=$(openssl rand -hex 64)
NEW_REFRESH=$(openssl rand -hex 64)

# 2. Update Razorpay keys in Razorpay dashboard FIRST
# then update in Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id indiwebpros-lms/production \
  --secret-string "{
    \"JWT_SECRET\": \"$NEW_JWT\",
    \"JWT_REFRESH_SECRET\": \"$NEW_REFRESH\",
    \"RAZORPAY_KEY_SECRET\": \"NEW_KEY_FROM_RAZORPAY\"
  }"

# 3. Deactivate compromised IAM key
aws iam update-access-key \
  --access-key-id AKIAXXXXXXXX \
  --status Inactive

# 4. Create new IAM access key (if needed for dev)
aws iam create-access-key --user-name lms-dev-user

# 5. Restart application (loads new secrets)
aws ssm send-command \
  --instance-ids i-EC2_INSTANCE_ID \
  --document-name AWS-RunShellScript \
  --parameters commands=["pm2 restart all"]

# 6. Check CloudTrail for unauthorized access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=COMPROMISED_KEY \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)
```

---

## Scenario 5: Certificate PDF Recovery

Certificates are never deleted (lifecycle rule + Glacier transition).

```bash
# If in GLACIER_IR — restore first (takes 1-3 minutes)
aws s3api restore-object \
  --bucket indiwebpros-lms-bucket \
  --key certificates/CERT_ID.pdf \
  --restore-request Days=7

# If not in S3 at all — regenerate from database
# The PDFCertificateProvider can regenerate from enrollment + course data
```

---

## Emergency Contacts & Escalation

| Severity | Action |
|----------|--------|
| P1 (Production down) | Immediately start DR runbook + notify team |
| P2 (Data at risk) | Rotate secrets + audit access |
| P3 (Degraded performance) | Check CloudWatch alarms + scale if needed |

---

## Monthly DR Test Schedule

| Test | Frequency | Owner |
|------|-----------|-------|
| RDS restore drill | Monthly | DevOps |
| S3 recovery drill | Quarterly | DevOps |
| Secret rotation | Monthly | Security |
| Full EC2 replacement | Quarterly | DevOps |
| CloudWatch alerts fire test | Monthly | SRE |
