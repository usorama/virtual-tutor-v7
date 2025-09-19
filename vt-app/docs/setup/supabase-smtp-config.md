# Supabase SMTP Configuration

## Status: Ready to Configure

Your Resend domain is verified and ready. Now configure Supabase to use pinglearn.app for auth emails.

## Configuration Steps

1. **Go to Supabase Dashboard**: 
   https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/settings/auth

2. **Scroll to "SMTP Settings"**

3. **Toggle "Enable Custom SMTP"**

4. **Enter Configuration**:
   ```
   Sender Email: noreply@pinglearn.app
   Sender Name: PingLearn
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: re_F9aoGiJC_Jar47oSXQa3ftYex84632jmh
   Secure: Yes (SSL/TLS)
   ```

5. **Save Configuration**

6. **Test**: Send a test email from Supabase dashboard

## Expected Result

All Supabase auth emails (signup, password reset, etc.) will now come from `noreply@pinglearn.app` instead of the default Supabase domain.

## Reply Strategy (Current)

**Email Flow**:
```
Customer → support@pinglearn.app → Forward → uudhya@icloud.com
You → uudhya@icloud.com → Reply → Customer (shows personal email)
```

**Solution**: Set up "Send As" in your email client or build in-app support system.

---
**Date**: September 19, 2025
**Status**: Ready for implementation