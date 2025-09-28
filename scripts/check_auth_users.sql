-- Check auth.users table for all users
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Check if dentist user exists
SELECT
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'dentist@dental.com';

-- Check profiles for comparison
SELECT
    id,
    email,
    full_name,
    created_at
FROM public.profiles
ORDER BY created_at DESC;