import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getSession(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { contactId, content } = await request.json();

    const { data, error } = await supabase
      .from('notes')
      .insert({
        contact_id: contactId,
        user_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, note: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Add note error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
