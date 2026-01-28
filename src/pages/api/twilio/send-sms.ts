import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { sendSMS } from '../../../lib/twilio';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getSession(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { to, message } = await request.json();

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

    // Send SMS via Twilio
    const twilioMessage = await sendSMS(to, message);

    // Log communication
    await supabase.from('communications').insert({
      contact_id: contact!.id,
      type: 'sms',
      direction: 'outbound',
      content: message,
      twilio_sid: twilioMessage.sid,
      user_id: user.id
    });

    return new Response(JSON.stringify({ success: true, sid: twilioMessage.sid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Send SMS error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
