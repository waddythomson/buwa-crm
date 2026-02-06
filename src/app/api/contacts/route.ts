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
