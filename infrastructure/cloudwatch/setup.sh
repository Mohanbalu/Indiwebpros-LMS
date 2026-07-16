#!/bin/bash
# ============================================================
# CloudWatch Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
set -euo pipefail

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
SNS_TOPIC_NAME="indiwebpros-lms-alerts"

echo "📊 Setting up CloudWatch monitoring for IndiWebPros LMS"
echo "📍 Account: $ACCOUNT_ID | Region: $REGION"

# ── 1. Create SNS Topic for Alerts ──────────────────────────────────────────
echo ""
echo "✅ [1/6] Creating SNS alert topic..."
SNS_ARN=$(aws sns create-topic \
  --name "$SNS_TOPIC_NAME" \
  --tags Key=Application,Value=IndiWebPros-LMS Key=Environment,Value=production \
  --query TopicArn \
  --output text)
echo "   SNS Topic ARN: $SNS_ARN"

# Subscribe your email to the topic
echo "📧 Enter your alert email address (e.g. devops@indiwebpros.in):"
read -r ALERT_EMAIL
aws sns subscribe \
  --topic-arn "$SNS_ARN" \
  --protocol email \
  --notification-endpoint "$ALERT_EMAIL"
echo "   ✉️ Confirmation email sent to $ALERT_EMAIL — please confirm the subscription!"

# ── 2. Create Log Groups ─────────────────────────────────────────────────────
echo ""
echo "✅ [2/6] Creating CloudWatch log groups..."

LOG_GROUPS=(
  "/indiwebpros-lms/application"
  "/indiwebpros-lms/audit"
  "/indiwebpros-lms/security"
  "/indiwebpros-lms/payment"
  "/indiwebpros-lms/email"
)

for group in "${LOG_GROUPS[@]}"; do
  aws logs create-log-group \
    --log-group-name "$group" \
    --region "$REGION" \
    --tags Application=IndiWebPros-LMS,Environment=production \
    2>/dev/null || echo "   Log group $group already exists"
  
  # Set 90-day retention to control costs
  aws logs put-retention-policy \
    --log-group-name "$group" \
    --retention-in-days 90
  echo "   Created/updated: $group (90-day retention)"
done

# ── 3. Create CloudWatch Dashboard ──────────────────────────────────────────
echo ""
echo "✅ [3/6] Creating CloudWatch dashboard..."
sed "s/YOUR_DISTRIBUTION_ID/REPLACE_AFTER_CLOUDFRONT_SETUP/g" \
  dashboards/main-dashboard.json > /tmp/dashboard-resolved.json

aws cloudwatch put-dashboard \
  --dashboard-name "IndiWebPros-LMS" \
  --dashboard-body file:///tmp/dashboard-resolved.json
echo "   Dashboard URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=IndiWebPros-LMS"

# ── 4. Create CloudWatch Alarms ──────────────────────────────────────────────
echo ""
echo "✅ [4/6] Creating CloudWatch alarms..."

# RDS CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "lms-rds-cpu-high" \
  --alarm-description "RDS CPU utilization exceeded 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --dimensions Name=DBInstanceIdentifier,Value=indiwebpros-lms-db \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$SNS_ARN" \
  --ok-actions "$SNS_ARN"

# RDS Connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "lms-rds-connections-high" \
  --alarm-description "RDS connections approaching limit" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --dimensions Name=DBInstanceIdentifier,Value=indiwebpros-lms-db \
  --statistic Average \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$SNS_ARN"

# RDS Free Storage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "lms-rds-storage-low" \
  --alarm-description "RDS free storage below 2GB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --dimensions Name=DBInstanceIdentifier,Value=indiwebpros-lms-db \
  --statistic Average \
  --period 3600 \
  --evaluation-periods 1 \
  --threshold 2147483648 \
  --comparison-operator LessThanThreshold \
  --alarm-actions "$SNS_ARN"

# App-level alarms (custom metrics — namespace IndiWebPros/LMS)
aws cloudwatch put-metric-alarm \
  --alarm-name "lms-api-server-errors" \
  --alarm-description "API server error spike" \
  --metric-name ServerErrors \
  --namespace "IndiWebPros/LMS" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$SNS_ARN"

aws cloudwatch put-metric-alarm \
  --alarm-name "lms-payment-failures" \
  --alarm-description "Payment failure spike (>3 in 5 min)" \
  --metric-name PaymentFailures \
  --namespace "IndiWebPros/LMS" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 3 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$SNS_ARN"

aws cloudwatch put-metric-alarm \
  --alarm-name "lms-auth-failures" \
  --alarm-description "Auth failure spike — possible brute force (>20 in 5 min)" \
  --metric-name AuthFailures \
  --namespace "IndiWebPros/LMS" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$SNS_ARN"

echo "   ✅ 6 alarms created"

# ── 5. SES Configuration Set & Bounce Alarms ────────────────────────────────
echo ""
echo "✅ [5/6] Creating SES configuration set..."
aws ses create-configuration-set \
  --configuration-set Name=indiwebpros-lms \
  2>/dev/null || echo "   SES configuration set already exists"

aws ses create-configuration-set-event-destination \
  --configuration-set-name indiwebpros-lms \
  --event-destination '{
    "Name": "cloudwatch-metrics",
    "Enabled": true,
    "MatchingEventTypes": ["send","bounce","complaint","delivery","reject"],
    "CloudWatchDestination": {
      "DimensionConfigurations": [{
        "DimensionName": "MessageTag",
        "DimensionValueSource": "messageTag",
        "DefaultDimensionValue": "transactional"
      }]
    }
  }' 2>/dev/null || echo "   Event destination already configured"

# ── 6. Create RDS Parameter Group ────────────────────────────────────────────
echo ""
echo "✅ [6/6] Creating RDS parameter group..."
aws rds create-db-parameter-group \
  --db-parameter-group-name indiwebpros-lms-pg16 \
  --db-parameter-group-family postgres16 \
  --description "Optimized parameters for IndiWebPros LMS" \
  --tags Key=Application,Value=IndiWebPros-LMS \
  2>/dev/null || echo "   Parameter group already exists"

# Apply key parameters
aws rds modify-db-parameter-group \
  --db-parameter-group-name indiwebpros-lms-pg16 \
  --parameters \
    "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate" \
    "ParameterName=log_connections,ParameterValue=1,ApplyMethod=immediate" \
    "ParameterName=log_disconnections,ParameterValue=1,ApplyMethod=immediate" \
    "ParameterName=log_lock_waits,ParameterValue=1,ApplyMethod=immediate" \
    "ParameterName=idle_in_transaction_session_timeout,ParameterValue=30000,ApplyMethod=immediate" \
    "ParameterName=statement_timeout,ParameterValue=30000,ApplyMethod=immediate"

# Apply parameter group to RDS instance
aws rds modify-db-instance \
  --db-instance-identifier indiwebpros-lms-db \
  --db-parameter-group-name indiwebpros-lms-pg16 \
  --no-apply-immediately \
  2>/dev/null || echo "   Could not modify RDS — apply manually in console"

echo ""
echo "🎉 CloudWatch + Monitoring setup complete!"
echo ""
echo "📋 Console Links:"
echo "   Dashboard: https://$REGION.console.aws.amazon.com/cloudwatch/home#dashboards:name=IndiWebPros-LMS"
echo "   Alarms:    https://$REGION.console.aws.amazon.com/cloudwatch/home#alarmsV2:"
echo "   Log Groups: https://$REGION.console.aws.amazon.com/cloudwatch/home#logsV2:log-groups"
