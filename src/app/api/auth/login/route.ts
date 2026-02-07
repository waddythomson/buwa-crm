import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Get user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Password not set. Contact admin.' }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Update status to active if invited
    if (user.status === 'invited') {
      await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);
    }

    // Set session cookie (base64 encoded to avoid special char issues)
    const sessionData = JSON.stringify({ userId: user.id, createdAt: Date.now() });
    const sessionToken = Buffer.from(sessionData).toString('base64');
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
