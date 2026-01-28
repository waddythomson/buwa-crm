import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { makeCall } from '../../../lib/twilio';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getSession(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { to } = await request.json();
    const baseUrl = new URL(request.url).origin;

    // Find or create contact
    let { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', to)
      .single();

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({ phone: to, name: to, created_by: user.id })
        .select()
        .single();
      contact = newContact;
    }

    // Make call via Twilio
    const call = await makeCall(to, `${baseUrl}/api/twilio/twiml/outbound`);

    // Log communication (will be updated with duration when call ends)
    await supabase.from('communications').insert({
      contact_id: contact!.id,
      type: 'call',
      direction: 'outbound',
      twilio_sid: call.sid,
      user_id: user.id
    });

    return new Response(JSON.stringify({ success: true, sid: call.sid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Make call error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
