import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { setSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (token_hash && type === 'magiclink') {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'magiclink',
    });

    if (error || !data.user?.email) {
      console.error('Magic link verification error:', error);
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid or expired link`);
    }

    // Get user from our users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', data.user.email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.redirect(`${baseUrl}/login?error=No account found`);
    }

    // Update status to active if invited
    if (user.status === 'invited') {
      await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);
    }

    const session = setSession(user.id);
    const response = NextResponse.redirect(`${baseUrl}/`);
    const isSecure = request.nextUrl.protocol === 'https:';
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });

    return response;
  }

  return NextResponse.redirect(`${baseUrl}/login?error=Invalid request`);
}
