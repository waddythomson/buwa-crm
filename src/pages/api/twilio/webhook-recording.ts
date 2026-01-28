import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = parseInt(formData.get('RecordingDuration') as string) || 0;

    console.log(`Recording received for call ${callSid}: ${recordingUrl}`);

    // Update the communication with recording info
    await supabase
      .from('communications')
      .update({
        recording_url: recordingUrl + '.mp3',
        duration: recordingDuration,
        type: 'voicemail'
      })
      .eq('twilio_sid', callSid);

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you. Goodbye.</Say></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Webhook recording error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
};
