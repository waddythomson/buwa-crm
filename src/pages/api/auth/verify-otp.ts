import type { APIRoute } from 'astro';
import { findUser, createSession } from '../../../lib/auth';
import { verifyOTP } from '../../../lib/twilio';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { identifier, code } = await request.json();

    // Normalize phone number
    const isPhone = identifier.startsWith('+') || /^\d+$/.test(identifier);
    let to = identifier;
    if (isPhone && !identifier.startsWith('+')) {
      to = '+1' + identifier.replace(/\D/g, '');
    }

    // Verify OTP with Twilio
    const verification = await verifyOTP(to, code);
    
    if (verification.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user and activate if needed
    const user = await findUser(identifier);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Activate user if invited
    if (user.status === 'invited') {
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);
    }

    // Create session
    const sessionToken = await createSession(user.id);

    // Set cookie
    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Verification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
