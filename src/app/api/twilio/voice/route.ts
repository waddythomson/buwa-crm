import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateConversation, updateConversationTimestamp } from '@/lib/conversations';

const TASKLET_WEBHOOK_URL = 'https://webhooks.tasklet.ai/v1/public/webhook?token=86476b4beecf3371cf943d3b0c22a085';

async function notifyTasklet(data: Record<string, unknown>) {
  try {
    await fetch(TASKLET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Error notifying Tasklet:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log('Incoming call:', { from, to, callSid, callStatus });

    // Normalize phone number
    const normalizedPhone = from.replace(/^\+1/, '');

    // Find or create contact
    let { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .or(`phone.eq.${from},phone.eq.${normalizedPhone},phone.eq.+1${normalizedPhone}`)
      .limit(1)
      .single();

    if (!contact) {
      const { data: newContact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .insert({
          phone: from,
          name: null
        })
        .select('id')
        .single();

      if (contactError) {
        console.error('Error creating contact:', contactError);
      } else {
        contact = newContact;
      }
    }

    if (contact) {
      // Get or create conversation
      const conversationId = await getOrCreateConversation(contact.id);

      // Log the call
      const { error: callError } = await supabaseAdmin
        .from('communications')
        .insert({
          contact_id: contact.id,
          conversation_id: conversationId,
          type: 'call',
          direction: 'inbound',
          content: `Incoming call - ${callStatus}`,
          twilio_sid: callSid
        });

      if (!callError) {
        // Notify Tasklet of incoming call
        await notifyTasklet({
          type: 'inbound_call',
          contact_id: contact.id,
          conversation_id: conversationId,
          from,
          status: callStatus,
          timestamp: new Date().toISOString()
        });
      }

      // Update conversation timestamp
      await updateConversationTimestamp(conversationId);
    }

    // Return TwiML to handle the call
    // For now, we'll record a voicemail
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buwa-crm.vercel.app';
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello, you've reached BuWa Digital. Please leave a message after the beep.</Say>
  <Record 
    maxLength="120" 
    action="${baseUrl}/api/twilio/recording"
    transcribe="true"
    transcribeCallback="${baseUrl}/api/twilio/transcription"
  />
  <Say>We did not receive a recording. Goodbye.</Say>
</Response>`;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, we're experiencing technical difficulties. Please try again later.</Say>
</Response>`;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
