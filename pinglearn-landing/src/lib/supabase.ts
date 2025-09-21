import { createClient } from '@supabase/supabase-js';

// Database types
export interface WaitlistSignup {
  id?: string;
  email: string;
  created_at?: string;
  source?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Email functionality will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to save email to waitlist
export async function saveToWaitlist(email: string, metadata?: {
  source?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('waitlist_signups')
      .insert([
        {
          email: email.toLowerCase().trim(),
          source: metadata?.source || 'landing_page',
          referrer: metadata?.referrer,
          user_agent: metadata?.user_agent,
          ip_address: metadata?.ip_address,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      // Check for duplicate email
      if (error.code === '23505') {
        return { success: false, error: 'You are already on the waitlist!' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving to waitlist:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.'
    };
  }
}