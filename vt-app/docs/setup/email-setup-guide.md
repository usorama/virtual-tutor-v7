# Email Setup Guide - Virtual Tutor

## Current Status
- **Resend Account**: Created ✅
- **API Key**: Configured ✅
- **Domain**: Pending ⏳
- **SMTP Configuration**: Ready to configure once domain is added

## Resend API Details
- **API Key**: Stored in `.env.local`
- **Free Tier**: 3,000 emails/month (100/day max)
- **Account Created**: September 19, 2025

## Steps to Complete Setup

### 1. Get a Domain
Choose one of these options:

#### Quick & Free Options:
- **Freenom**: Free `.tk`, `.ml`, `.ga` domains
- **eu.org**: Free subdomain (virtualtutor.eu.org)
- **afraid.org**: Free subdomains

#### Cheap Paid Options:
- **Porkbun**: `.click` for $3.50/year
- **Namecheap**: `.xyz` for $1.99/year
- **Cloudflare**: `.com` for $9.77/year

### 2. Add Domain to Resend
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `virtualtutor.com`)
4. Add the DNS records provided:
   - SPF record (TXT)
   - DKIM records (3 CNAME records)
   - Optional: DMARC record

### 3. Configure Supabase SMTP
Once domain is verified in Resend:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/settings/auth)
2. Navigate to **Authentication** → **Email Templates** → **SMTP Settings**
3. Enable "Custom SMTP" and configure:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: re_F9aoGiJC_Jar47oSXQa3ftYex84632jmh
   Sender Email: noreply@yourdomain.com
   Sender Name: Virtual Tutor
   ```
4. Click Save

### 4. Update Environment Variables
Update `.env.local`:
```env
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Replace with your actual domain
```

## Alternative: Quick Setup with Brevo
If you need email working TODAY without a domain:

1. Sign up at [brevo.com](https://www.brevo.com)
2. Get SMTP credentials (works with shared domain)
3. Configure in Supabase:
   ```
   Host: smtp-relay.brevo.com
   Port: 587
   Username: [Your Brevo login email]
   Password: [Your SMTP password from Brevo]
   ```

## Testing Configuration
Once configured, test from Supabase Dashboard:
1. Go to Email Templates
2. Click "Send Test Email" 
3. Verify delivery and check sender domain

## Important Notes
- **Bounce Rate**: Must stay under 4%
- **Spam Rate**: Must stay under 0.08%
- **Use valid emails** during development
- **Monitor**: Check Resend dashboard for delivery status

## Next Steps
1. ⏳ Purchase/obtain domain
2. ⏳ Add domain to Resend
3. ⏳ Configure DNS records
4. ⏳ Complete Supabase SMTP setup
5. ⏳ Test email delivery