import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { decodeSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const sessionCookie = (await cookies()).get('session');
    const session = decodeSessionCookie(sessionCookie?.value);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, phone, email } = await request.json();

    if (!name && !phone && !email) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        name: name || null,
        phone: phone || null,
        email: email || null,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    const session = decodeSessionCookie(sessionCookie?.value);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, phone, email } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update({
        name: name || null,
        phone: phone || null,
        email: email || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
