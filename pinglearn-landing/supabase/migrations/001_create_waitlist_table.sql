-- Create the waitlist_signups table
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(100) DEFAULT 'landing_page',
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB,
    -- Add a unique constraint on email to prevent duplicates
    CONSTRAINT unique_email UNIQUE (email)
);

-- Create an index on email for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist_signups(email);

-- Create an index on created_at for sorting
CREATE INDEX idx_waitlist_created_at ON public.waitlist_signups(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows inserting new signups
CREATE POLICY "Allow anonymous inserts" ON public.waitlist_signups
    FOR INSERT
    WITH CHECK (true);

-- Create a function to notify admin on new signup (optional)
CREATE OR REPLACE FUNCTION notify_new_waitlist_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- You can add logic here to send notifications
    -- For now, just return the new record
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the notification function
CREATE TRIGGER on_waitlist_signup
    AFTER INSERT ON public.waitlist_signups
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_waitlist_signup();

-- Add some comments for documentation
COMMENT ON TABLE public.waitlist_signups IS 'Stores email addresses of users who signed up for early access to PingLearn';
COMMENT ON COLUMN public.waitlist_signups.email IS 'Email address of the user';
COMMENT ON COLUMN public.waitlist_signups.source IS 'Where the signup came from (landing_page, social, etc.)';
COMMENT ON COLUMN public.waitlist_signups.referrer IS 'HTTP referrer if available';
COMMENT ON COLUMN public.waitlist_signups.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN public.waitlist_signups.ip_address IS 'IP address of the user';
COMMENT ON COLUMN public.waitlist_signups.metadata IS 'Additional metadata in JSON format';