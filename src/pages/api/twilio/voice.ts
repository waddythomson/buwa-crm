import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log(`Incoming call from ${from}, status: ${callStatus}`);

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

    // Log the incoming call
    if (callStatus === 'ringing') {
      await supabase.from('communications').insert({
        contact_id: contact!.id,
        type: 'call',
        direction: 'inbound',
        twilio_sid: callSid
      });
    }

    const baseUrl = new URL(request.url).origin;

    // Return TwiML to handle the call (ring user's phone or go to voicemail)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please leave a message after the beep.</Say>
  <Record 
    maxLength="120" 
    action="${baseUrl}/api/twilio/webhook-recording"
    transcribe="true"
    transcribeCallback="${baseUrl}/api/twilio/webhook-transcription"
  />
  <Say>We did not receive a recording. Goodbye.</Say>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Webhook voice error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred.</Say></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
};
