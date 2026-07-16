#!/bin/bash
# ============================================================
# CloudFront Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
set -euo pipefail

BUCKET="indiwebpros-lms-bucket"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🌐 Setting up CloudFront CDN for IndiWebPros LMS"

# ── Step 1: Create Origin Access Control ────────────────────────────────────
echo ""
echo "✅ [1/4] Creating Origin Access Control (OAC)..."
OAC_RESULT=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config file://oac-config.json \
  --output json)

OAC_ID=$(echo "$OAC_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['OriginAccessControl']['Id'])")
echo "   OAC ID: $OAC_ID"

# ── Step 2: Update distribution config with OAC ID ───────────────────────────
echo "✅ [2/4] Updating distribution config with OAC ID..."
sed -e "s/OAC_ID_PLACEHOLDER/$OAC_ID/g" \
    -e "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" \
    distribution-config.json > /tmp/dist-config-resolved.json

# ── Step 3: Create CloudFront Distribution ───────────────────────────────────
echo "✅ [3/4] Creating CloudFront distribution (this may take 5-15 minutes to deploy)..."
DIST_RESULT=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/dist-config-resolved.json \
  --output json)

DIST_ID=$(echo "$DIST_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['Distribution']['Id'])")
DIST_DOMAIN=$(echo "$DIST_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['Distribution']['DomainName'])")

echo "   Distribution ID: $DIST_ID"
echo "   Distribution Domain: https://$DIST_DOMAIN"

# ── Step 4: Update S3 bucket policy with real distribution ID ────────────────
echo "✅ [4/4] Updating S3 bucket policy with CloudFront distribution ARN..."
cd ../s3
sed -e "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" \
    -e "s/YOUR_DISTRIBUTION_ID/$DIST_ID/g" \
    bucket-policy.json > /tmp/bucket-policy-resolved.json

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy file:///tmp/bucket-policy-resolved.json

echo ""
echo "🎉 CloudFront setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add CLOUDFRONT_URL=https://$DIST_DOMAIN to your .env (or Secrets Manager)"
echo "   2. Point learn.indiwebpros.in CNAME → $DIST_DOMAIN in Route 53"
echo "   3. Request ACM certificate for learn.indiwebpros.in"
echo "   4. Update distribution with custom domain + ACM cert"
echo ""
echo "   Distribution ID (save this): $DIST_ID"
echo "   CloudFront URL: https://$DIST_DOMAIN"
