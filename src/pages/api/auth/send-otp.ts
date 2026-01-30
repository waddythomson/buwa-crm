import type { APIRoute } from 'astro';
import { findUser } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { identifier } = await request.json();
    
    // Check if user exists in our users table
    const user = await findUser(identifier);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found. Contact admin for access.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine if email or phone
    const isPhone = identifier.startsWith('+') || /^\d+$/.test(identifier);
    
    if (isPhone) {
      // For phone, we'll still need Twilio later
      // For now, require email login
      return new Response(JSON.stringify({ error: 'Phone login coming soon! Please use your email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send magic link via Supabase Auth
    const redirectTo = `${url.origin}/auth/callback`;
    
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email: identifier,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false // Don't auto-create users
      }
    });

    if (error) {
      console.error('Supabase auth error:', error);
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ success: true, method: 'magic_link' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send login link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
