import { NextRequest, NextResponse } from 'next/server';
import { saveToWaitlist } from '@/lib/supabase';
import nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('Email configuration not complete. Notification emails will not be sent.');
    return null;
  }

  return nodemailer.createTransporter({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

// Send notification email to admin
async function sendAdminNotification(email: string) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email transporter not configured, skipping notification');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'support@pinglearn.app';
  const fromEmail = process.env.SMTP_FROM || 'noreply@pinglearn.app';

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `New PingLearn Waitlist Signup: ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">New Waitlist Signup! 🎉</h2>
          <p style="font-size: 16px; color: #333;">
            A new user has joined the PingLearn waitlist:
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #06b6d4;">
              <strong>${email}</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Signed up at: ${new Date().toLocaleString()}
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Total signups can be viewed in your Supabase dashboard.
          </p>
        </div>
      `,
      text: `New PingLearn waitlist signup: ${email}\nSigned up at: ${new Date().toLocaleString()}`,
    });
    console.log('Admin notification sent successfully');
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

// Send welcome email to the user
async function sendWelcomeEmail(email: string) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email transporter not configured, skipping welcome email');
    return;
  }

  const fromEmail = process.env.SMTP_FROM || 'noreply@pinglearn.app';

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Welcome to PingLearn - You\'re on the list! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #06b6d4; font-size: 36px; margin: 0;">PingLearn</h1>
            <p style="color: #888; margin-top: 10px;">The future of learning is personal</p>
          </div>

          <h2 style="color: #fff; font-size: 24px;">Welcome to the future of education!</h2>

          <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
            Thank you for joining the PingLearn waitlist! You're now part of an exclusive group of
            educators and students who will be the first to experience our revolutionary AI-powered
            learning platform.
          </p>

          <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3);
                      border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #06b6d4; margin-top: 0;">What happens next?</h3>
            <ul style="color: #ccc; font-size: 14px; line-height: 1.8;">
              <li>You'll be the first to know when we launch on October 4, 2025</li>
              <li>Exclusive early access to beta features</li>
              <li>Special founding member pricing</li>
              <li>Direct input on features and development</li>
            </ul>
          </div>

          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Have questions? Reply to this email or reach out at
            <a href="mailto:support@pinglearn.app" style="color: #06b6d4;">support@pinglearn.app</a>
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              © 2025 PingLearn. Building the future of education.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to PingLearn!\n\nThank you for joining our waitlist. You'll be the first to know when we launch on October 4, 2025.\n\nWhat happens next:\n- Early access to beta features\n- Special founding member pricing\n- Direct input on development\n\nQuestions? Email us at support@pinglearn.app\n\n© 2025 PingLearn`,
    });
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Get metadata
    const metadata = {
      source: 'landing_page',
      referrer: request.headers.get('referer') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') || undefined,
    };

    // Save to database
    const result = await saveToWaitlist(email, metadata);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save email' },
        { status: result.error?.includes('already') ? 409 : 500 }
      );
    }

    // Send notifications asynchronously (don't wait for them)
    Promise.all([
      sendAdminNotification(email),
      sendWelcomeEmail(email),
    ]).catch(console.error);

    return NextResponse.json(
      {
        message: 'Successfully joined the waitlist!',
        email: email
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}