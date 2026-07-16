# Secrets Management Flow
# IndiWebPros LMS — Milestone 24

## Architecture Overview

```mermaid
flowchart TD
    subgraph Development["🛠️ Development (Local)"]
        DevEnv[".env file\n(not committed to git)"]
        DevApp["Node.js App\ndotenv loads .env"]
        DevEnv --> DevApp
    end

    subgraph Production["🚀 Production (EC2)"]
        SM["AWS Secrets Manager\nindiwebpros-lms/production\n\n• DATABASE_URL\n• JWT_SECRET\n• JWT_REFRESH_SECRET\n• AWS keys\n• Razorpay secrets\n• SES credentials"]
        IAMRole["EC2 IAM Instance Role\nindiwebpros-lms-app-role\n(no static keys needed)"]
        SecretsTS["secrets.ts\nloadSecrets()\ncalls GetSecretValue"]
        AppTS["app.ts\nstartServer():\n1. loadSecrets()\n2. initializeAll()"]
        EnvTS["env.ts\nZod validation\nprocess.env"]

        IAMRole -->|"Assume Role"| SM
        SM -->|"GetSecretValue"| SecretsTS
        SecretsTS -->|"inject into process.env"| EnvTS
        AppTS --> SecretsTS
        EnvTS -->|"Validated config"| AppTS
    end

    subgraph SecretCreation["🔑 Secret Setup (one-time)"]
        Admin["Admin / DevOps"]
        AdminCLI["aws secretsmanager\ncreate-secret\n--name indiwebpros-lms/production\n--secret-string '{...}'"]
        Admin --> AdminCLI --> SM
    end
```

---

## Secret JSON Structure

Store this JSON in AWS Secrets Manager under `indiwebpros-lms/production`:

```json
{
  "DATABASE_URL": "postgresql://postgres:PASSWORD@indiwebpros-lms-db.XXXX.us-east-1.rds.amazonaws.com:5432/postgres?schema=public",
  "JWT_SECRET": "REPLACE_WITH_STRONG_SECRET_MIN_64_CHARS",
  "JWT_REFRESH_SECRET": "REPLACE_WITH_STRONG_REFRESH_SECRET",
  "AWS_ACCESS_KEY": "AKIAXXXXXXXXXXXXXXXX",
  "AWS_SECRET_KEY": "REPLACE_WITH_AWS_SECRET_ACCESS_KEY",
  "SMTP_HOST": "email-smtp.us-east-1.amazonaws.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "REPLACE_WITH_SES_SMTP_USERNAME",
  "SMTP_PASSWORD": "REPLACE_WITH_SES_SMTP_PASSWORD",
  "RAZORPAY_KEY_ID": "rzp_live_XXXXXXXXXX",
  "RAZORPAY_KEY_SECRET": "REPLACE_WITH_RAZORPAY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET": "REPLACE_WITH_RAZORPAY_WEBHOOK_SECRET"
}
```

---

## AWS CLI Commands to Create Secret

```bash
# 1. Create the secret
aws secretsmanager create-secret \
  --name "indiwebpros-lms/production" \
  --description "IndiWebPros LMS production secrets" \
  --secret-string file://secret-template.json \
  --tags Key=Application,Value=IndiWebPros-LMS Key=Environment,Value=production \
  --region us-east-1

# 2. Update a specific value
aws secretsmanager put-secret-value \
  --secret-id "indiwebpros-lms/production" \
  --secret-string '{"RAZORPAY_KEY_ID": "rzp_live_newkey"}'

# 3. Enable automatic rotation (optional — for DB passwords)
aws secretsmanager rotate-secret \
  --secret-id "indiwebpros-lms/production" \
  --rotation-rules AutomaticallyAfterDays=90
```

---

## Security Properties

| Property | Value |
|----------|-------|
| Encryption | AWS KMS (default key or CMK) |
| Access Control | IAM policy: `secretsmanager:GetSecretValue` on specific ARN |
| Audit | CloudTrail logs every `GetSecretValue` call |
| Rotation | Manual or automatic (90 days recommended) |
| Versioning | Previous version kept for rollback |
| Cross-account | Not needed for this architecture |

---

## Migration from .env to Secrets Manager

1. Create secret in AWS Secrets Manager (above)
2. Set `NODE_ENV=production` on EC2
3. Remove sensitive values from EC2's `.env` file:
   - Keep: `PORT`, `NODE_ENV`, `AWS_REGION`, `AWS_BUCKET`, `FRONTEND_URL`
   - Remove: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `SMTP_*`, `RAZORPAY_*`
4. Attach IAM instance profile to EC2
5. Restart application — `loadSecrets()` will pull from Secrets Manager

> **Note**: `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` in `.env` are only needed for local development or if the EC2 instance does NOT have an IAM role. In production with an IAM role, the SDK automatically uses instance credentials — no keys needed!
