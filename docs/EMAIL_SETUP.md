# Email Invitation System - Setup & Troubleshooting Guide

## Overview
This document covers the complete setup and fixes for the WorkNest email invitation system using Brevo (formerly Sendinblue).

---

## Problem Summary

### Issue 1: Sender Not Verified (Local & Production)
**Error:** `Sending has been rejected because the sender you used noreply@worknest.com is not valid`

**Cause:** Brevo only allows sending emails from verified sender addresses.

**Solution:** Changed sender to verified email: `ayushraj150103@gmail.com`

### Issue 2: SMTP Port Blocking on Render
**Error:** `Connection timeout` - `code: 'ETIMEDOUT'`

**Cause:** Render's free tier blocks outbound SMTP connections on ports 587/465 for security.

**Solution:** Switched from SMTP (nodemailer) to Brevo's HTTP API.

### Issue 3: IP Restriction
**Error:** `We have detected you are using an unrecognised IP address`

**Cause:** Brevo's IP whitelist blocking requests from new IPs.

**Solution:** Disable IP restrictions in Brevo settings.

---

## Complete Setup Guide

### 1. Get Brevo API Key

1. Log in to Brevo: https://app.brevo.com/
2. Go to **Settings** → **API Keys**: https://app.brevo.com/settings/keys/api
3. Click **"Create a new API key"**
4. Name: `WorkNest Production`
5. Copy the API key (starts with `xkeysib-`)

### 2. Configure Brevo Settings

**Disable IP Restrictions (Recommended for Render):**
1. Go to: https://app.brevo.com/security/authorised_ips
2. Click **"Disable IP restriction"** or **"Allow all IPs"**
3. Save

This allows Render's dynamic IPs to work without issues.

### 3. Local Development Setup

Add to `server/.env`:

```bash
# Brevo API Configuration
BREVO_API_KEY=xkeysib-YOUR-API-KEY-HERE
SMTP_FROM_EMAIL=ayushraj150103@gmail.com

# Legacy SMTP (optional, kept for reference)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=924151003@smtp-brevo.com
SMTP_PASS=your-smtp-password
SMTP_FROM=WorkNest <ayushraj150103@gmail.com>
```

### 4. Production Setup (Render)

1. Go to Render Dashboard: https://dashboard.render.com/
2. Select your backend service (`worknest-11ib`)
3. Navigate to **Environment** tab
4. Add the following environment variables:

```
BREVO_API_KEY=xkeysib-YOUR-API-KEY-HERE
SMTP_FROM_EMAIL=ayushraj150103@gmail.com
```

5. Click **Save Changes**
6. Render will automatically redeploy

### 5. Frontend Configuration

Ensure `src/utils/axios.ts` connects to the correct backend:

```typescript
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? 'http://localhost:5001' : 'https://worknest-11ib.onrender.com'),
  // ... rest of config
});
```

---

## Technical Changes Made

### 1. Installed Brevo SDK

```bash
cd server
npm install @getbrevo/brevo --save
```

### 2. Updated Email Configuration

**File:** `server/config/email.js`

**Before:** Using nodemailer with SMTP
```javascript
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  // ... SMTP config
});
```

**After:** Using Brevo HTTP API
```javascript
import * as brevo from '@getbrevo/brevo';
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);
```

### 3. Updated Environment Variables

**File:** `server/.env.example`

Added Brevo API configuration and marked SMTP as legacy.

---

## Testing

### Test Local Setup

```bash
cd server
node test-brevo.js
```

Expected output:
```
🧪 Testing Brevo API Integration...
📧 Attempting to send email via Brevo API to: ayushraj150103@gmail.com
✅ Email sent successfully via Brevo API
✅ Test complete! Check your email inbox.
```

### Test via Application

1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev` (from root)
3. Navigate to a project
4. Click **"Invite Member"**
5. Enter an email and role
6. Click **"Send Invite"**

### Verify in Brevo Dashboard

1. Go to: https://app.brevo.com/transactional-email/deliverability
2. View recent email logs
3. Check status: Should show **"Delivered"** ✅

---

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause:** Invalid or missing API key

**Solution:** 
- Verify `BREVO_API_KEY` is correct
- Check API key has not been revoked
- Ensure no extra spaces in environment variable

### Issue: IP Blocked
**Cause:** Brevo IP restrictions enabled

**Solution:**
- Go to https://app.brevo.com/security/authorised_ips
- Disable IP restrictions

### Issue: Email Not Delivered
**Cause:** Various (rate limit, invalid recipient, etc.)

**Solution:**
1. Check Brevo dashboard logs
2. Verify sender email is verified
3. Check daily sending limit (300 emails/day on free tier)
4. Ensure recipient email is valid

### Issue: Connection Timeout (SMTP)
**Cause:** Hosting provider blocks SMTP ports

**Solution:**
- Use Brevo HTTP API instead of SMTP (already implemented)
- This is why we switched from nodemailer to Brevo SDK

---

## Environment Variables Reference

### Required for Brevo API
| Variable | Description | Example |
|----------|-------------|---------|
| `BREVO_API_KEY` | Brevo API key for HTTP requests | `xkeysib-xxx...` |
| `SMTP_FROM_EMAIL` | Verified sender email address | `ayushraj150103@gmail.com` |

### Legacy SMTP (Optional)
| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `924151003@smtp-brevo.com` |
| `SMTP_PASS` | SMTP password | `xsmtpsib-xxx...` |
| `SMTP_FROM` | Sender name and email | `WorkNest <email@example.com>` |

---

## Brevo Account Limits

### Free Tier
- **300 emails/day**
- Unlimited contacts
- Transactional email API access
- Email templates

### Recommendations
- Monitor daily usage in Brevo dashboard
- Upgrade to paid plan if exceeding limits
- Use email templates for consistency

---

## Useful Links

- **Brevo Dashboard:** https://app.brevo.com/
- **API Keys:** https://app.brevo.com/settings/keys/api
- **Email Logs:** https://app.brevo.com/transactional-email/deliverability
- **IP Whitelist:** https://app.brevo.com/security/authorised_ips
- **Brevo API Docs:** https://developers.brevo.com/docs

---

## Deployment Checklist

### Before Deploying to Render

- [ ] Get Brevo API key
- [ ] Disable IP restrictions in Brevo
- [ ] Add `BREVO_API_KEY` to Render environment
- [ ] Add `SMTP_FROM_EMAIL` to Render environment
- [ ] Verify sender email in Brevo (if using custom domain)
- [ ] Test locally first

### After Deployment

- [ ] Check Render logs for email sending attempts
- [ ] Verify emails in Brevo dashboard
- [ ] Test invitation flow from production frontend
- [ ] Monitor email delivery rates

---

## Maintenance

### Regular Tasks
1. Monitor Brevo dashboard for delivery rates
2. Check for bounced/failed emails
3. Update API keys if compromised
4. Review sender reputation

### Troubleshooting
1. Check Render logs for errors
2. Review Brevo email logs
3. Verify environment variables are set
4. Test with different email providers (Gmail, Outlook, etc.)

---

## Summary of Changes

### Files Modified
1. `server/config/email.js` - Switched to Brevo HTTP API
2. `server/.env.example` - Added Brevo configuration
3. `server/package.json` - Added `@getbrevo/brevo` dependency
4. `src/utils/axios.ts` - Fixed port configuration (5001)

### Files Created
1. `docs/EMAIL_SETUP.md` - This documentation

### Environment Variables Added
1. `BREVO_API_KEY` - API key for Brevo
2. `SMTP_FROM_EMAIL` - Verified sender email

---

**Last Updated:** 2026-01-03  
**Author:** Development Team  
**Version:** 1.0
