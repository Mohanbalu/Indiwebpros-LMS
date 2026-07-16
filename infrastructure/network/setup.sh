#!/bin/bash
# ============================================================
# Network Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
set -euo pipefail

REGION="us-east-1"
APP_NAME="indiwebpros-lms"

echo "🔒 Setting up Security Groups for $APP_NAME"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get or prompt for VPC ID
VPC_ID=${VPC_ID:-""}
if [ -z "$VPC_ID" ]; then
  echo "Enter your VPC ID (e.g. vpc-xxxxxxxx):"
  read -r VPC_ID
fi
echo "📍 VPC: $VPC_ID"

# ── 1. ALB Security Group ─────────────────────────────────────────────────────
echo ""
echo "✅ [1/3] Creating ALB security group (public HTTPS)..."
ALB_SG=$(aws ec2 create-security-group \
  --group-name "$APP_NAME-alb-sg" \
  --description "ALB — public HTTPS/HTTP from internet" \
  --vpc-id "$VPC_ID" \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=$APP_NAME-alb-sg},{Key=Application,Value=IndiWebPros-LMS}]" \
  --query GroupId --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$APP_NAME-alb-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text)
echo "   ALB SG: $ALB_SG"

# Allow HTTPS from internet
aws ec2 authorize-security-group-ingress \
  --group-id "$ALB_SG" \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  2>/dev/null || true

# Allow HTTP from internet (redirects to HTTPS)
aws ec2 authorize-security-group-ingress \
  --group-id "$ALB_SG" \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  2>/dev/null || true

# ── 2. EC2 Security Group ─────────────────────────────────────────────────────
echo "✅ [2/3] Creating EC2 security group (ALB-only access)..."
echo "Enter your office/admin IP for SSH access (e.g. 203.0.113.1/32):"
read -r ADMIN_IP

EC2_SG=$(aws ec2 create-security-group \
  --group-name "$APP_NAME-ec2-sg" \
  --description "EC2 App Server — only from ALB" \
  --vpc-id "$VPC_ID" \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=$APP_NAME-ec2-sg},{Key=Application,Value=IndiWebPros-LMS}]" \
  --query GroupId --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$APP_NAME-ec2-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text)
echo "   EC2 SG: $EC2_SG"

# Allow port 5000 from ALB only
aws ec2 authorize-security-group-ingress \
  --group-id "$EC2_SG" \
  --protocol tcp --port 5000 \
  --source-group "$ALB_SG" \
  2>/dev/null || true

# Allow SSH from admin IP only
aws ec2 authorize-security-group-ingress \
  --group-id "$EC2_SG" \
  --protocol tcp --port 22 --cidr "$ADMIN_IP" \
  2>/dev/null || true

# ── 3. RDS Security Group ─────────────────────────────────────────────────────
echo "✅ [3/3] Creating RDS security group (EC2-only access)..."
RDS_SG=$(aws ec2 create-security-group \
  --group-name "$APP_NAME-rds-sg" \
  --description "RDS PostgreSQL — EC2 only, no public access" \
  --vpc-id "$VPC_ID" \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=$APP_NAME-rds-sg},{Key=Application,Value=IndiWebPros-LMS}]" \
  --query GroupId --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$APP_NAME-rds-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text)
echo "   RDS SG: $RDS_SG"

# Allow PostgreSQL from EC2 only
aws ec2 authorize-security-group-ingress \
  --group-id "$RDS_SG" \
  --protocol tcp --port 5432 \
  --source-group "$EC2_SG" \
  2>/dev/null || true

# Dev access from admin IP (REMOVE IN STRICT PRODUCTION)
aws ec2 authorize-security-group-ingress \
  --group-id "$RDS_SG" \
  --protocol tcp --port 5432 --cidr "$ADMIN_IP" \
  2>/dev/null || true

# ── Remove default outbound from RDS (optional - strict mode) ──────────────
# Uncomment for maximum security:
# aws ec2 revoke-security-group-egress --group-id "$RDS_SG" \
#   --protocol -1 --cidr 0.0.0.0/0 2>/dev/null || true

echo ""
echo "🎉 Security groups created!"
echo ""
echo "📋 Security Group IDs:"
echo "   ALB:  $ALB_SG"
echo "   EC2:  $EC2_SG"
echo "   RDS:  $RDS_SG"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Attach EC2 SG to your EC2 instance"
echo "   2. Attach RDS SG to your RDS instance"
echo "   3. Create ALB with $ALB_SG and point to EC2 $EC2_SG"
echo "   4. Update RDS security group to use $RDS_SG instead of current one"
echo ""
echo "   Apply RDS SG:"
echo "   aws rds modify-db-instance --db-instance-identifier indiwebpros-lms-db --vpc-security-group-ids $RDS_SG"
