#!/bin/bash
# ============================================================
# SES Infrastructure Setup Script
# Milestone 24 — IndiWebPros LMS
# ============================================================
set -euo pipefail

DOMAIN="indiwebpros.in"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CONFIG_SET="indiwebpros-lms"
SNS_ARN="arn:aws:sns:$REGION:$ACCOUNT_ID:indiwebpros-lms-alerts"

echo "📧 Setting up AWS SES for $DOMAIN"

# ── 1. Verify Domain ─────────────────────────────────────────────────────────
echo ""
echo "✅ [1/6] Initiating domain verification..."
VERIFICATION=$(aws ses verify-domain-identity --domain "$DOMAIN" --region "$REGION")
VERIFICATION_TOKEN=$(echo "$VERIFICATION" | python3 -c "import json,sys; print(json.load(sys.stdin)['VerificationToken'])")

echo ""
echo "📋 ADD THIS DNS RECORD to verify domain ownership:"
echo "   Type: TXT"
echo "   Name: _amazonses.$DOMAIN"
echo "   Value: $VERIFICATION_TOKEN"
echo "   TTL: 300"
echo ""
echo "Press ENTER after adding the DNS record..."
read -r

# ── 2. Enable DKIM ────────────────────────────────────────────────────────────
echo "✅ [2/6] Enabling DKIM..."
DKIM=$(aws ses verify-domain-dkim --domain "$DOMAIN" --region "$REGION")
echo "$DKIM" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tokens = data['DkimTokens']
print('\n📋 ADD THESE 3 CNAME RECORDS for DKIM:')
for token in tokens:
    print(f'  Name:  {token}._domainkey.$DOMAIN')
    print(f'  Value: {token}.dkim.amazonses.com')
    print()
"

# ── 3. Create Configuration Set ───────────────────────────────────────────────
echo "✅ [3/6] Creating SES configuration set..."
aws ses create-configuration-set \
  --configuration-set Name="$CONFIG_SET" \
  --region "$REGION" \
  2>/dev/null || echo "   Configuration set already exists"

# Add CloudWatch event destination
aws ses create-configuration-set-event-destination \
  --configuration-set-name "$CONFIG_SET" \
  --event-destination "{
    \"Name\": \"cloudwatch-all-events\",
    \"Enabled\": true,
    \"MatchingEventTypes\": [\"send\",\"reject\",\"bounce\",\"complaint\",\"delivery\",\"open\",\"click\"],
    \"CloudWatchDestination\": {
      \"DimensionConfigurations\": [{
        \"DimensionName\": \"MessageTag\",
        \"DimensionValueSource\": \"messageTag\",
        \"DefaultDimensionValue\": \"lms\"
      }]
    }
  }" \
  --region "$REGION" \
  2>/dev/null || echo "   CloudWatch destination already configured"

# Add SNS destination for bounces and complaints only
aws ses create-configuration-set-event-destination \
  --configuration-set-name "$CONFIG_SET" \
  --event-destination "{
    \"Name\": \"sns-bounce-complaint\",
    \"Enabled\": true,
    \"MatchingEventTypes\": [\"bounce\",\"complaint\"],
    \"SNSDestination\": {\"TopicARN\": \"$SNS_ARN\"}
  }" \
  --region "$REGION" \
  2>/dev/null || echo "   SNS destination already configured"

# ── 4. Set Up Bounce & Complaint Handling ─────────────────────────────────────
echo "✅ [4/6] Configuring bounce and complaint notifications..."
aws ses set-identity-notification-topic \
  --identity "$DOMAIN" \
  --notification-type Bounce \
  --sns-topic "$SNS_ARN" \
  --region "$REGION"

aws ses set-identity-notification-topic \
  --identity "$DOMAIN" \
  --notification-type Complaint \
  --sns-topic "$SNS_ARN" \
  --region "$REGION"

# ── 5. Enable Feedback Forwarding ─────────────────────────────────────────────
echo "✅ [5/6] Enabling email feedback forwarding..."
aws ses set-identity-feedback-forwarding-enabled \
  --identity "$DOMAIN" \
  --forwarding-enabled \
  --region "$REGION"

# ── 6. Apply Sending Policy ───────────────────────────────────────────────────
echo "✅ [6/6] Applying sending authorization policy..."
sed "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" sending-policy.json > /tmp/ses-policy-resolved.json
aws ses put-identity-policy \
  --identity "$DOMAIN" \
  --policy-name "lms-sending-policy" \
  --policy file:///tmp/ses-policy-resolved.json \
  --region "$REGION" \
  2>/dev/null || echo "   Sending policy already applied"

echo ""
echo "🎉 SES setup complete!"
echo ""
echo "⚠️  MANUAL ACTIONS REQUIRED:"
echo "   1. Wait for DKIM verification (can take up to 72 hours)"
echo "   2. Add DMARC DNS record: _dmarc.$DOMAIN → see dns-records.md"
echo "   3. Request production access (move out of sandbox):"
echo "      AWS Console → SES → Account Dashboard → Request Production Access"
echo ""
echo "📊 Check verification status:"
echo "   aws ses get-identity-verification-attributes --identities $DOMAIN"
echo "   aws ses get-identity-dkim-attributes --identities $DOMAIN"
