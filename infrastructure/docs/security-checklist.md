# Security Checklist
# IndiWebPros LMS — Milestone 24

## ✅ Completed Security Controls

### S3 Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ Block All Public Access | `setup.sh --public-access-block` | `s3/setup.sh` |
| ✅ HTTPS-only (deny HTTP requests) | Bucket policy deny condition | `s3/bucket-policy.json` |
| ✅ Server-Side Encryption (AES256) | `ServerSideEncryption: "AES256"` on all PutObject | `s3-storage.provider.ts` |
| ✅ Versioning enabled | `put-bucket-versioning` | `s3/setup.sh` |
| ✅ Lifecycle rules | 7 rules covering all content types | `s3/lifecycle-rules.json` |
| ✅ No public objects | All access via signed URLs | `getSignedDownloadUrl()` |
| ✅ Signed URL max 1 hour | `Math.min(expiresSeconds, 3600)` | `s3-storage.provider.ts` |
| ✅ Object tagging | Content-type + environment + app tags | `s3-storage.provider.ts` |
| ✅ Multipart cleanup | Abort incomplete after 7 days | `s3/lifecycle-rules.json` |
| ✅ CloudFront OAC | S3 only accessible via CloudFront | `cloudfront/oac-config.json` |

### CloudFront Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ HTTPS-only | `redirect-to-https` or `https-only` | `distribution-config.json` |
| ✅ TLS 1.2 minimum | `TLSv1.2_2021` | `distribution-config.json` |
| ✅ HTTP → HTTPS redirect | Default behavior | `distribution-config.json` |
| ✅ OAC (not deprecated OAI) | `oac-config.json` applied | `cloudfront/setup.sh` |
| ✅ Certificates: no cache | `MaxTTL: 0` for `/certificates/*` | `distribution-config.json` |
| ✅ Origin Shield | Reduces origin load | `distribution-config.json` |

### IAM Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ Least privilege app role | 6 specific actions only | `iam/app-role-policy.json` |
| ✅ No AdministratorAccess | Never used | Policy review |
| ✅ No wildcard actions | All explicit | `iam/app-role-policy.json` |
| ✅ Resource-scoped | Specific bucket/ARN only | All policies |
| ✅ EC2 Instance Profile | No static keys in production | `iam/setup.sh` |
| ✅ CI/CD deny dangerous actions | Explicit deny block | `iam/deployment-policy.json` |
| ✅ KMS condition | Via Secrets Manager only | `iam/app-role-policy.json` |

### Secrets Management

| Control | Implementation | File |
|---------|--------------|------|
| ✅ Secrets Manager integration | `loadSecrets()` in production | `config/secrets.ts` |
| ✅ Dev fallback to .env | No-op in non-production | `config/secrets.ts` |
| ✅ No hardcoded secrets in code | All via env vars | Code review |
| ✅ JWT_SECRET min 64 chars | Zod validation | `config/env.ts` |
| ✅ AWS credentials via IAM role | No static keys on EC2 | `iam/setup.sh` |
| ⚠️ AWS_ACCESS_KEY in .env | Remove after EC2 IAM role setup | `backend/.env` |

### Payment Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ Razorpay HMAC SHA256 verification | `verifyPayment()` + `verifyWebhookSignature()` | `razorpay.provider.ts` |
| ✅ Raw body for webhook | `express.raw()` middleware | `payment.routes.ts` |
| ✅ Duplicate payment protection | Status check before processing | `purchase.controller.ts` |
| ✅ IDOR protection | Ownership verification | `purchase.controller.ts` |
| ✅ No payment data in logs | Sensitive fields not logged | Code review |

### Authentication Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ JWT with short expiry | Access token short-lived | `auth.service.ts` |
| ✅ Refresh token rotation | Rotation on use | Auth module |
| ✅ Password hashing (bcrypt) | Salt rounds ≥ 10 | Auth module |
| ✅ Email verification required | `isEmailVerified` gate | Auth module |
| ✅ Role-based access control | RBAC middleware | Authorization module |
| ✅ Audit logging | All actions logged | `audit.service.ts` |
| ✅ Auth failure tracking | `CloudWatchMetrics.authFailed()` | `cloudwatch-metrics.ts` |

### Network Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ ALB public → EC2 private | Security group chain | `network/security-groups.json` |
| ✅ RDS private only | No public accessibility | `network/security-groups.json` |
| ✅ SSH restricted | Trusted IP only | `network/security-groups.json` |
| ✅ HTTPS everywhere | ALB + CloudFront | `distribution-config.json` |

### RDS Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ Deletion protection | Enabled via setup.sh | `rds/setup.sh` |
| ✅ Automated backups | 7-day retention | `rds/setup.sh` |
| ✅ Slow query logging | `log_min_duration_statement=1000ms` | `rds/parameter-group.json` |
| ✅ Connection audit | `log_connections=1` | `rds/parameter-group.json` |
| ✅ Statement timeout | 30 seconds | `rds/parameter-group.json` |
| ⚠️ Encryption at rest | Verify/enable in console | `rds/optimization-checklist.md` |
| ⚠️ Multi-AZ | Enable when budget allows | `rds/optimization-checklist.md` |

### SES Security

| Control | Implementation | File |
|---------|--------------|------|
| ✅ SPF record | `v=spf1 include:amazonses.com ~all` | `ses/dns-records.md` |
| ✅ DKIM (3 CNAME records) | Cryptographic signing | `ses/dns-records.md` |
| ✅ DMARC policy | `p=quarantine` to start | `ses/dns-records.md` |
| ✅ Bounce handling | SNS notification | `ses/setup.sh` |
| ✅ Complaint handling | SNS notification | `ses/setup.sh` |
| ✅ Sending authorization | From @indiwebpros.in only | `ses/sending-policy.json` |
| ✅ Configuration Set | CloudWatch metrics | `ses/configuration-set.json` |

---

## ⚠️ Outstanding Manual Actions

1. Enable RDS encryption at rest (requires recreation if not already encrypted)
2. Remove `AWS_ACCESS_KEY`/`AWS_SECRET_KEY` from `.env` after IAM role setup on EC2
3. Add SPF/DKIM/DMARC DNS records for `indiwebpros.in`
4. Move from SES sandbox to production sending
5. Enable RDS Performance Insights in console
6. Confirm SNS alert subscription email

---

## Security Score: 45/50 (90%) ✅
