# SES DNS Records — IndiWebPros LMS
# Milestone 24: SES Production Configuration
# ============================================================
# Apply these DNS records in your domain registrar or Route 53.
# Domain: indiwebpros.in | SES Region: us-east-1
# ============================================================

## 1. SPF Record (Sender Policy Framework)
Protects against email spoofing.

**Type**: TXT  
**Name**: indiwebpros.in (root domain)  
**Value**: `v=spf1 include:amazonses.com ~all`  
**TTL**: 3600

> If you send from multiple services, combine them:  
> `v=spf1 include:amazonses.com include:mailtrap.io ~all`

---

## 2. DKIM Records (DomainKeys Identified Mail)
Cryptographically signs all outgoing emails from SES.

Run this command to get your DKIM tokens:
```bash
aws ses get-identity-dkim-attributes --identities indiwebpros.in
```

AWS SES will provide 3 DKIM tokens. Add each as a CNAME:

**Record 1:**
- Type: CNAME
- Name: `TOKEN1._domainkey.indiwebpros.in`
- Value: `TOKEN1.dkim.amazonses.com`

**Record 2:**
- Type: CNAME
- Name: `TOKEN2._domainkey.indiwebpros.in`
- Value: `TOKEN2.dkim.amazonses.com`

**Record 3:**
- Type: CNAME
- Name: `TOKEN3._domainkey.indiwebpros.in`
- Value: `TOKEN3.dkim.amazonses.com`

> TTL: 300 (propagate faster during setup, increase to 3600 after verified)

---

## 3. DMARC Record (Domain-based Message Authentication)
Defines what happens to emails that fail SPF/DKIM checks.

**Type**: TXT  
**Name**: `_dmarc.indiwebpros.in`  
**Value**: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@indiwebpros.in; ruf=mailto:dmarc-failures@indiwebpros.in; sp=reject; adkim=s; aspf=s; pct=100`  
**TTL**: 3600

**Policy Explanation:**
- `p=quarantine` → Failed emails go to spam (start here, move to `p=reject` after monitoring)
- `rua=mailto:...` → Aggregate reports sent to this email
- `ruf=mailto:...` → Failure reports sent to this email
- `pct=100` → Apply policy to 100% of emails
- `adkim=s` → Strict DKIM alignment
- `aspf=s` → Strict SPF alignment

---

## 4. Mail From Domain (Return-Path)
Optional but recommended. Improves deliverability.

**Type**: MX  
**Name**: `mail.indiwebpros.in`  
**Value**: `10 feedback-smtp.us-east-1.amazonses.com`  
**TTL**: 3600

**Type**: TXT  
**Name**: `mail.indiwebpros.in`  
**Value**: `v=spf1 include:amazonses.com ~all`  
**TTL**: 3600

---

## 5. Verification Status Check

After adding DNS records, verify in AWS:
```bash
# Check domain verification
aws ses get-identity-verification-attributes --identities indiwebpros.in

# Check DKIM status
aws ses get-identity-dkim-attributes --identities indiwebpros.in

# Check mail from
aws ses get-identity-mail-from-domain-attributes --identities indiwebpros.in
```

---

## 6. Production Sending Limit

After verifying domain, request production access (removes sandbox):
1. Go to AWS SES Console → Account Dashboard
2. Click "Request Production Access"
3. Fill the use case form:
   - **Mail type**: Transactional
   - **Website URL**: https://indiwebpros.in
   - **Use case**: LMS enrollment confirmations, certificate emails, OTP verification
   - **Expected volume**: 500–5000 emails/day

---

## 7. Suppression List Management

Check bounce and complaint suppression list:
```bash
# List suppressed addresses
aws sesv2 list-suppressed-destinations --filter Reasons=BOUNCE,COMPLAINT

# Remove a specific address (if confirmed legitimate)
aws sesv2 delete-suppressed-destination --email-address user@example.com
```
