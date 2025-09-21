# PingLearn Waitlist Setup Guide

## Quick Setup

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration SQL from `supabase/migrations/001_create_waitlist_table.sql` in the SQL Editor
3. Copy your project URL and anon key from Settings > API

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and add your credentials:

```env
# Required for database storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Features Implemented

✅ **Database Storage**
- Emails stored in Supabase PostgreSQL
- Duplicate detection (prevents same email twice)
- Metadata tracking (source, referrer, user agent)

✅ **Email Notifications** (Optional)
- Admin notification to support@pinglearn.app
- Welcome email to new signups
- Works without SMTP config (just stores in DB)

✅ **User Experience**
- Loading states with animated lightning bolt
- Error messages for validation/duplicates
- Success confirmation message
- Auto-clear after 7 seconds

✅ **Security**
- Email validation
- Rate limiting ready (add middleware if needed)
- SQL injection protection via parameterized queries
- RLS (Row Level Security) enabled

## Testing the Flow

1. Enter email in the form
2. Click "Join Waitlist"
3. Check Supabase dashboard for stored email
4. Try entering same email again (should show duplicate message)

## Production Checklist

- [ ] Add real Supabase credentials
- [ ] Configure SMTP for email notifications
- [ ] Add rate limiting middleware
- [ ] Set up monitoring/analytics
- [ ] Test with real email addresses
- [ ] Monitor Supabase usage/limits

## Troubleshooting

**Emails not saving?**
- Check Supabase credentials in `.env.local`
- Verify table exists in Supabase
- Check browser console for errors

**Emails not sending?**
- SMTP is optional - DB storage works without it
- For Gmail: Use app-specific password, not regular password
- Check SMTP credentials and ports

**Duplicate email error not showing?**
- Ensure unique constraint exists on email column
- Check API response handling in frontend

## Next Steps

1. **Analytics**: Add tracking for conversion rates
2. **A/B Testing**: Test different CTA copy
3. **Segmentation**: Track where users come from
4. **Follow-up**: Set up drip email campaigns
5. **Export**: Build admin dashboard for CSV export

---

Launch Date: **October 4, 2025** 🚀