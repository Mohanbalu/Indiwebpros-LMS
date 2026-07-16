#!/bin/bash
# ============================================================
# S3 Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
# Usage: chmod +x setup.sh && ./setup.sh
# Prerequisites: AWS CLI configured with admin credentials

set -euo pipefail

BUCKET="indiwebpros-lms-bucket"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🪣 Setting up S3 infrastructure for bucket: $BUCKET"
echo "📍 Region: $REGION | Account: $ACCOUNT_ID"

# ── 1. Enable Versioning ────────────────────────────────────────────────────
echo ""
echo "✅ [1/7] Enabling bucket versioning..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

# ── 2. Block All Public Access ──────────────────────────────────────────────
echo "✅ [2/7] Blocking all public access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# ── 3. Enable Default Encryption (AES256) ──────────────────────────────────
echo "✅ [3/7] Enabling server-side encryption (AES256)..."
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'

# ── 4. Apply Lifecycle Rules ────────────────────────────────────────────────
echo "✅ [4/7] Applying lifecycle rules..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration file://lifecycle-rules.json

# ── 5. Apply CORS Configuration ─────────────────────────────────────────────
echo "✅ [5/7] Applying CORS configuration..."
aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration file://cors-config.json

# ── 6. Apply Bucket Policy ──────────────────────────────────────────────────
echo "✅ [6/7] Applying bucket policy..."
# Replace placeholders with actual values
sed -e "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" \
    -e "s/YOUR_DISTRIBUTION_ID/REPLACE_WITH_CF_DIST_ID/g" \
    bucket-policy.json > /tmp/bucket-policy-resolved.json
aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy file:///tmp/bucket-policy-resolved.json

# ── 7. Enable Intelligent Tiering Configuration ─────────────────────────────
echo "✅ [7/7] Adding bucket tags..."
aws s3api put-bucket-tagging \
  --bucket "$BUCKET" \
  --tagging 'TagSet=[
    {Key=Application,Value=IndiWebPros-LMS},
    {Key=Environment,Value=production},
    {Key=ManagedBy,Value=devops},
    {Key=CostCenter,Value=lms-infrastructure}
  ]'

echo ""
echo "🎉 S3 infrastructure setup complete!"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Create CloudFront distribution (infrastructure/cloudfront/setup.sh)"
echo "   2. Update bucket-policy.json with real CloudFront distribution ID"
echo "   3. Re-run: aws s3api put-bucket-policy --bucket $BUCKET --policy file://bucket-policy.json"
