import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// Twilio sends webhooks as form data
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    console.log(`Incoming SMS from ${from}: ${body}`);

    // Find or create contact
    let { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', from)
      .single();

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({ phone: from, name: from })
        .select()
        .single();
      contact = newContact;
    }

    // Log communication
    await supabase.from('communications').insert({
      contact_id: contact!.id,
      type: 'sms',
      direction: 'inbound',
      content: body,
      twilio_sid: messageSid
    });

    // Return empty TwiML (no auto-reply)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Webhook SMS error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
};
