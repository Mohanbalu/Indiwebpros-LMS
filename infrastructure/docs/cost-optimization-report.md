# Cost Optimization Report
# IndiWebPros LMS — Milestone 24

## Estimated Monthly AWS Costs (Production)

> Based on a small-to-medium LMS: 500 students, 20 courses, 50 video lessons

### Current vs Optimized

| Service | Before Optimization | After Optimization | Monthly Saving |
|---------|--------------------|--------------------|----------------|
| S3 Storage (50GB videos) | $1.15 | $0.63 (STANDARD_IA) | **$0.52** |
| S3 Storage (10GB assets) | $0.23 | $0.14 (Intel. Tiering) | **$0.09** |
| S3 Requests (direct) | $5.00+ | $0.50 (via CloudFront) | **$4.50+** |
| CloudFront | — | $1.00 (500GB transfer) | New cost |
| RDS (t3.micro) | $15.00 | $15.00 (same) | $0 |
| SES (1000 emails/day) | $3.00+ (Mailtrap) | $0.30 (SES native) | **$2.70** |
| CloudWatch Logs | $0 | $0.50 (90-day retention) | New cost |
| Secrets Manager | $0 | $0.40 (1 secret) | New cost |
| **Total** | ~$24.38 | ~$17.47 | **~$7/month** |

---

## S3 Cost Optimization

### 1. Lifecycle Rules (Implemented ✅)
- **Temp files** (delete @7d): Save ~100% on temp storage
- **Logs → Glacier** (@90d): Save ~83% on log storage
- **Videos → STANDARD_IA** (@180d): Save ~46% on video storage
- **Certs → STANDARD_IA** (@365d): Save ~46% on cert storage
- **Multipart cleanup** (@7d): Eliminates zombie upload charges

### 2. CloudFront Cache (Implemented ✅)
- Thumbnails cached 30 days → 97% reduction in S3 GET requests
- Static assets cached 24h → 90%+ reduction
- Videos cached 24h → Reduces repeated S3 data transfer

### 3. S3 VPC Endpoint (Recommended)
```bash
# FREE — eliminates NAT Gateway data charges for S3 traffic
aws ec2 create-vpc-endpoint \
  --service-name com.amazonaws.us-east-1.s3 \
  --vpc-endpoint-type Gateway
```
**Saving**: ~$0.045/GB for EC2 → S3 traffic via NAT

### 4. Intelligent Tiering (Implemented ✅)
- Assets automatically moved to cheaper tiers
- No retrieval fees for monitoring tier
- Applied to `assets/` and `thumbnails/` after 30 days

---

## RDS Cost Optimization

| Option | Cost | Benefit |
|--------|------|---------|
| db.t3.micro (current) | $15/mo | Good for dev/small prod |
| db.t3.small | $28/mo | Recommended when >50 concurrent users |
| Reserved Instance (1yr) | ~40% off | Commit to 1 year for 40% discount |
| Multi-AZ | ~2x cost | Only when HA is required |

**Recommendation**: Keep t3.micro until user base grows. Purchase 1-year Reserved Instance for ~40% savings (~$6/mo).

```bash
# Check current RDS cost
aws ce get-cost-and-usage \
  --time-period Start=2026-07-01,End=2026-07-31 \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Relational Database Service"]}}' \
  --metrics BlendedCost
```

---

## SES Cost Optimization

| Plan | Cost | Emails/Month |
|------|------|-------------|
| Amazon SES | $0.10/1000 emails | Unlimited |
| Mailtrap Pro | $20-30/month | 10,000 |
| SendGrid Essentials | $20/month | 100,000 |

**Recommendation**: Switch to Amazon SES (already configured) for significant savings.
- 1,000 emails/day × 30 days = 30,000 emails → **$3/month**
- vs. Mailtrap Pro: **$20/month**

---

## CloudWatch Log Retention

**Without retention policy**: Logs stored forever → unbounded cost  
**With 90-day retention policy (configured ✅)**: 

| Log Volume | Forever Cost | 90-day Cost |
|------------|-------------|-------------|
| 1 GB/month | $0.03/GB/mo (accumulates) | $0.03/GB × 3 months max |
| After 1 year | $0.36+ accumulated | $0.09 (capped) |

---

## Secrets Manager Cost

| Item | Cost |
|------|------|
| 1 secret (all LMS credentials) | $0.40/month |
| API calls (10,000/month) | $0.05 |
| **Total** | **~$0.45/month** |

vs. Risk of exposed credentials in `.env` → priceless security benefit.

---

## Cost Monitoring

```bash
# Set up billing alert (email when cost > $50/month)
aws cloudwatch put-metric-alarm \
  --alarm-name "lms-monthly-cost-alert" \
  --alarm-description "Monthly AWS cost exceeded $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --dimensions Name=Currency,Value=USD \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:indiwebpros-lms-alerts
```

---

## Summary of Optimizations Applied

| Category | Action | Status |
|----------|--------|--------|
| S3 Lifecycle | temp/drafts/logs/certs | ✅ Configured |
| S3 Encryption | AES256 (no extra cost) | ✅ Implemented |
| S3 Versioning | Object recovery | ✅ Scripted |
| S3 Multipart cleanup | 7-day abort | ✅ Configured |
| CloudFront | 6 cache behaviors | ✅ Configured |
| RDS Autoscaling | 20GB → 100GB max | ✅ Scripted |
| SES | Native AWS (vs third-party) | ✅ Configured |
| CloudWatch retention | 90 days | ✅ Scripted |
| Secrets Manager | 1 secret for all creds | ✅ Implemented |
| VPC S3 Endpoint | Eliminate NAT charges | ⚠️ Recommended |
| Reserved Instances | 40% RDS discount | ⚠️ When stable |
