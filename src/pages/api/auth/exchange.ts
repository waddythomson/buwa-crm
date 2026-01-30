import type { APIRoute } from 'astro';
import { supabaseAdmin, supabase } from '../../../lib/supabase';
import { findUserByEmail, createSession, activateUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { accessToken, refreshToken } = await request.json();

    // Verify the session with Supabase
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !authUser) {
      console.error('Auth verification error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the user in our users table
    const user = await findUserByEmail(authUser.email!);
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
    console.error('Exchange error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to complete sign in' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
