# Cloudflare Pages Deployment Guide

## Quick Setup (5 minutes)

### 1. Connect GitHub to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Authorize Cloudflare to access your GitHub
5. Select repository: `virtual-tutor-v7`
6. Select branch: `phase-3-stabilization-uat`

### 2. Build Configuration

Set these build settings:

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `pinglearn-landing`

### 3. Environment Variables

Add these in Cloudflare Pages settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Deploy

Click **Save and Deploy**

### 5. Custom Domain Setup

After deployment:

1. Go to **Custom domains** tab
2. Click **Set up a custom domain**
3. Add `pinglearn.app`
4. Follow DNS configuration instructions:
   - Add CNAME record pointing to your Pages project
   - Or transfer DNS to Cloudflare (recommended)

## Alternative: Deploy via CLI

If you prefer command line:

```bash
# Install Cloudflare CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy directly
npx wrangler pages deploy .next --project-name=pinglearn-landing

# Add custom domain
wrangler pages domains add pinglearn.app --project-name=pinglearn-landing
```

## Post-Deployment

1. **Test the site**: Visit your `.pages.dev` URL
2. **Configure DNS**: Point `pinglearn.app` to Cloudflare
3. **Enable SSL**: Automatic with Cloudflare
4. **Set up redirects**: www → non-www if needed

## Features Currently Disabled

- Email notifications (nodemailer doesn't work on Edge runtime)
  - Consider using Cloudflare Email Workers or SendGrid API instead

## Troubleshooting

**Build fails?**
- Check Node version (use 18.x or 20.x)
- Verify environment variables are set

**Domain not working?**
- DNS propagation can take up to 48 hours
- Check Cloudflare DNS settings

**API not working?**
- Ensure Supabase credentials are correct
- Check CORS settings in Supabase

---

Your site will be live at:
- **Temporary**: `pinglearn-landing.pages.dev`
- **Production**: `pinglearn.app` (after DNS setup)

🚀 Launch ready for October 4, 2025!