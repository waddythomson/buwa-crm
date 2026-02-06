import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const sessionCookie = cookies().get('session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // Check if user is admin
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.userId)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite users' }, { status: 403 });
    }

    const { name, email, phone, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        role: role || 'user',
        status: 'invited',
        invited_by: session.userId
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Send invite magic link via Supabase
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buwa-crm.vercel.app';
    const { error: inviteError } = await supabaseAdmin.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`,
        shouldCreateUser: false
      }
    });

    if (inviteError) {
      console.error('Failed to send invite:', inviteError);
      return NextResponse.json({ 
        error: `User created but invite email failed: ${inviteError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
