# Resend Email Setup Guide - PingLearn.app

## Current Status
- ✅ Domain: pinglearn.app registered
- ⏳ Resend: Need to add domain and configure
- ⏳ Supabase: Need to configure SMTP
- ⏳ Email forwarding: Need to set up receiving

## Step-by-Step Setup

### 1. Add Domain to Resend
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `pinglearn.app`
4. Note the DNS records provided

### 2. Configure DNS in Cloudflare
Add these records to your Cloudflare DNS:

**SPF Record (Required)**:
```
Type: TXT
Name: pinglearn.app
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records (Required)** - Copy exact values from Resend:
```
Type: CNAME
Name: [resend-key-1]._domainkey
Value: [resend-value-1].resend.com

Type: CNAME  
Name: [resend-key-2]._domainkey
Value: [resend-value-2].resend.com
```

### 3. Verify Domain in Resend
1. Return to Resend dashboard
2. Click "Verify Domain"
3. Wait for verification (5-30 minutes)
4. Status should show "verified"

### 4. Configure Supabase SMTP
1. Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/settings/auth)
2. Enable "Custom SMTP"
3. Configure:
   ```
   Sender Email: noreply@pinglearn.app
   Sender Name: PingLearn
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: re_F9aoGiJC_Jar47oSXQa3ftYex84632jmh
   ```
4. Save settings

### 5. Set Up Email Forwarding (Choose One)

#### Option A: Cloudflare Email Routing (FREE)
1. Go to Cloudflare → pinglearn.app → Email
2. Enable Email Routing
3. Add forwarding rules:
   ```
   support@pinglearn.app → your-email@gmail.com
   privacy@pinglearn.app → your-email@gmail.com
   legal@pinglearn.app → your-email@gmail.com
   ```

#### Option B: ForwardEmail.net (FREE)
1. Add TXT record to Cloudflare DNS:
   ```
   Type: TXT
   Name: pinglearn.app
   Value: forward-email=your-email@gmail.com
   ```
2. Add MX record:
   ```
   Type: MX
   Name: pinglearn.app
   Value: mx1.forwardemail.net
   Priority: 10
   ```

### 6. Test Email Configuration
1. From Supabase dashboard, send test email
2. Check delivery and sender address
3. Send email to support@pinglearn.app
4. Verify forwarding works

## Email Architecture

### Sending Emails (via Resend)
- `noreply@pinglearn.app` - Automated emails
- All emails sent through Resend SMTP

### Receiving Emails (via Forwarding)
- `support@pinglearn.app` → Your inbox
- `privacy@pinglearn.app` → Your inbox  
- `legal@pinglearn.app` → Your inbox

## Testing Checklist

- [ ] Domain verified in Resend
- [ ] Supabase SMTP configured
- [ ] Test email sent successfully
- [ ] Email forwarding working
- [ ] Sender shows pinglearn.app domain
- [ ] Reply-to addresses working

## Troubleshooting

**Domain verification fails**:
- Check DNS propagation with [whatsmydns.net](https://whatsmydns.net)
- Verify exact DNS record values

**Emails not sending**:
- Check Supabase auth logs
- Verify API key in environment variables
- Test with Resend dashboard directly

**Forwarding not working**:
- Check MX records configuration
- Verify forwarding service setup
- Test with different email providers

## Environment Variables

Current configuration in `.env.local`:
```env
RESEND_API_KEY=re_F9aoGiJC_Jar47oSXQa3ftYex84632jmh
RESEND_FROM_EMAIL=noreply@pinglearn.app
RESEND_SUPPORT_EMAIL=support@pinglearn.app
RESEND_PRIVACY_EMAIL=privacy@pinglearn.app
```

## Next Steps

1. Complete domain verification
2. Test Supabase auth emails
3. Set up email forwarding
4. Create email templates
5. Document support processes

---

**Setup Date**: September 19, 2025  
**Domain**: pinglearn.app  
**API Key**: Stored in `.creds/resend-creds.md`