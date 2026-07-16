#!/bin/bash
# ============================================================
# IAM Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
set -euo pipefail

ROLE_NAME="indiwebpros-lms-app-role"
POLICY_NAME="indiwebpros-lms-app-policy"
INSTANCE_PROFILE_NAME="indiwebpros-lms-instance-profile"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "👤 Setting up IAM roles and policies"
echo "📍 Account: $ACCOUNT_ID"

# ── 1. Create the application role ──────────────────────────────────────────
echo ""
echo "✅ [1/5] Creating application IAM role..."
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file://trust-policy.json \
  --description "IndiWebPros LMS application role — least privilege" \
  --tags Key=Application,Value=IndiWebPros-LMS Key=Environment,Value=production \
  || echo "   Role already exists, skipping..."

# ── 2. Create and attach the app policy ─────────────────────────────────────
echo "✅ [2/5] Creating application IAM policy..."
# Inject account ID into policy
sed "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" app-role-policy.json > /tmp/app-policy-resolved.json

POLICY_ARN=$(aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document file:///tmp/app-policy-resolved.json \
  --description "Least-privilege policy for IndiWebPros LMS application" \
  --query "Policy.Arn" \
  --output text 2>/dev/null || \
  aws iam list-policies --scope Local --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)

echo "   Policy ARN: $POLICY_ARN"

echo "✅ [3/5] Attaching policy to role..."
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN"

# ── 3. Create EC2 Instance Profile ──────────────────────────────────────────
echo "✅ [4/5] Creating EC2 instance profile..."
aws iam create-instance-profile \
  --instance-profile-name "$INSTANCE_PROFILE_NAME" \
  || echo "   Instance profile already exists, skipping..."

aws iam add-role-to-instance-profile \
  --instance-profile-name "$INSTANCE_PROFILE_NAME" \
  --role-name "$ROLE_NAME" \
  || echo "   Role already added to instance profile, skipping..."

# ── 4. Create deployment policy (for CI/CD) ─────────────────────────────────
echo "✅ [5/5] Creating CI/CD deployment policy..."
sed "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" deployment-policy.json > /tmp/deploy-policy-resolved.json

aws iam create-policy \
  --policy-name "indiwebpros-lms-deploy-policy" \
  --policy-document file:///tmp/deploy-policy-resolved.json \
  --description "CI/CD deployment policy — limited, no admin" \
  || echo "   Deployment policy already exists, skipping..."

echo ""
echo "🎉 IAM setup complete!"
echo ""
echo "📋 Summary:"
echo "   App Role ARN: arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
echo "   Instance Profile: $INSTANCE_PROFILE_NAME"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Attach instance profile to your EC2 instance:"
echo "      aws ec2 associate-iam-instance-profile --instance-id i-XXXX --iam-instance-profile Name=$INSTANCE_PROFILE_NAME"
echo "   2. Remove hardcoded AWS credentials from .env (use IAM role instead)"
echo "   3. Delete/deactivate the old IAM access key from AWS console"
