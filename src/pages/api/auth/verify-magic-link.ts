import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { findUserByEmail, createSession, activateUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { tokenHash, type } = await request.json();

    // Verify the OTP/magic link token with Supabase
    const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any
    });
    
    if (verifyError || !data.user) {
      console.error('Verify error:', verifyError);
      return new Response(JSON.stringify({ error: 'Invalid or expired link. Please try again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the user in our users table
    const user = await findUserByEmail(data.user.email!);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found. Contact admin for access.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Activate user if they were invited
    if (user.status === 'invited') {
      await activateUser(user.id);
    }

    // Create our own session
    const sessionToken = await createSession(user.id);

    // Set cookie
    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Verify magic link error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to verify' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
