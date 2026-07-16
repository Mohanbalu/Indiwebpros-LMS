# AWS Architecture — IndiWebPros LMS
# Milestone 24: Production Infrastructure

## Full Architecture Diagram

```mermaid
graph TB
    subgraph Internet["🌐 Internet"]
        Student["👤 Student Browser"]
        Instructor["👨‍🏫 Instructor Browser"]
        Admin["🔑 Admin Browser"]
    end

    subgraph DNS["Route 53 DNS"]
        R53["Route 53\nlearn.indiwebpros.in\napi.indiwebpros.in"]
    end

    subgraph CDN["CloudFront CDN (Global)"]
        CF["CloudFront Distribution\nHTTPS Only | OAC\nTLS 1.2+"]
    end

    subgraph ALB_Layer["AWS — us-east-1"]
        ACM["ACM Certificate\n*.indiwebpros.in"]
        ALB["Application Load Balancer\nHTTPS :443\nHTTP :80 → redirect HTTPS"]
    end

    subgraph Compute["Private Subnet (EC2)"]
        EC2["EC2 Instance\nNode.js + Express\nPort 5000\nIAM Role attached"]
    end

    subgraph Data["Private Subnet (RDS)"]
        RDS["RDS PostgreSQL 16\nMulti-AZ\nEncrypted at rest\n5432"]
    end

    subgraph Storage["AWS S3"]
        S3["S3 Bucket\nindiwebpros-lms-bucket\nPrivate | Versioned\nAES256 Encrypted\nLifecycle Rules"]
    end

    subgraph Email["AWS SES"]
        SES["SES\nSPF + DKIM + DMARC\nConfiguration Set\nBounce Handling"]
    end

    subgraph Secrets["AWS Secrets Manager"]
        SM["Secrets Manager\nindiwebpros-lms/production\nDB Password, JWT, Razorpay\nAuto-rotation ready"]
    end

    subgraph Monitoring["AWS CloudWatch"]
        CW["CloudWatch\nDashboard + Alarms\nSNS Notifications\nLog Groups"]
    end

    subgraph Payment["Razorpay (External)"]
        RZP["Razorpay API\nOrder API\nWebhook → Backend\nHMAC Verified"]
    end

    Student --> R53
    Instructor --> R53
    Admin --> R53
    R53 -->|"CNAME"| CF
    R53 -->|"A Record"| ALB
    CF -->|"OAC + SigV4"| S3
    ALB --> ACM
    ALB -->|"Internal"| EC2
    EC2 -->|"Port 5432"| RDS
    EC2 -->|"S3 SDK"| S3
    EC2 -->|"SES API"| SES
    EC2 -->|"GetSecretValue"| SM
    EC2 -->|"PutMetricData"| CW
    RZP -->|"Webhook POST"| EC2

    style Internet fill:#e8f4f8
    style CDN fill:#fff3cd
    style ALB_Layer fill:#d4edda
    style Compute fill:#cce5ff
    style Data fill:#f8d7da
    style Storage fill:#e2d9f3
    style Email fill:#d1ecf1
    style Secrets fill:#ffeeba
    style Monitoring fill:#d4edda
    style Payment fill:#f5c6cb
```

---

## Service Summary

| Service | Purpose | Configuration |
|---------|---------|--------------|
| **Route 53** | DNS | CNAME → CloudFront, A → ALB |
| **ACM** | SSL/TLS | Wildcard cert `*.indiwebpros.in` |
| **CloudFront** | CDN | OAC, HTTPS-only, cache behaviors |
| **ALB** | Load Balancer | HTTP→HTTPS redirect, port 443 |
| **EC2** | App Server | Node.js, IAM role, private subnet |
| **RDS** | Database | PostgreSQL 16, Multi-AZ, encrypted |
| **S3** | File Storage | Private, versioned, AES256, lifecycle |
| **SES** | Email | SPF/DKIM/DMARC, configuration set |
| **Secrets Manager** | Secrets | All credentials, auto-rotation ready |
| **CloudWatch** | Monitoring | Dashboard, alarms, SNS notifications |
| **Razorpay** | Payments | Webhook HMAC verified, no SDK |

---

## Deployment Flow

```
Developer Push → GitHub
    → GitHub Actions (CI)
        → pnpm build (TypeScript compile)
        → Run tests
        → Deploy to EC2 via SSM
            → pm2 reload app
            → Health check
```

---

## Data Flow: Student Course Purchase

```
1. Student clicks "Buy" 
   → POST /api/v1/purchases (ALB → EC2)
   → EC2 fetches course from RDS
   → EC2 calls Razorpay API: create order
   → Returns order_id + key_id to frontend

2. Student completes Razorpay popup
   → Frontend gets razorpay_order_id, razorpay_payment_id, razorpay_signature

3. POST /api/v1/payments/razorpay/verify
   → EC2 verifies HMAC SHA256
   → Updates Payment in RDS
   → Creates Enrollment in RDS
   → SES sends confirmation email
   → CloudWatch metric: EnrollmentsCreated + PaymentSuccesses

4. Razorpay sends webhook: payment.captured
   → POST /api/v1/payments/razorpay/webhook
   → EC2 verifies HMAC on rawBody
   → Idempotently confirms enrollment (already created in step 3)
```
