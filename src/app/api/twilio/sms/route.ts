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
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    console.log('Incoming SMS:', { from, to, body: body?.substring(0, 50) });

    // Normalize phone number (remove +1 prefix for matching)
    const normalizedPhone = from.replace(/^\+1/, '');

    // Find or create contact
    let { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .or(`phone.eq.${from},phone.eq.${normalizedPhone},phone.eq.+1${normalizedPhone}`)
      .limit(1)
      .single();

    if (!contact) {
      // Create new contact
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
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { 'Content-Type': 'text/xml' }
        });
      }
      contact = newContact;
    }

    // Get or create conversation for this contact
    const conversationId = await getOrCreateConversation(contact.id);

    // Store the message
    const { error: msgError } = await supabaseAdmin
      .from('communications')
      .insert({
        contact_id: contact.id,
        conversation_id: conversationId,
        type: 'sms',
        direction: 'inbound',
        content: body,
        twilio_sid: messageSid
      });

    if (msgError) {
      console.error('Error storing message:', msgError);
    } else {
      // Notify Tasklet of new inbound message
      await notifyTasklet({
        type: 'inbound_sms',
        contact_id: contact.id,
        conversation_id: conversationId,
        from,
        content: body,
        timestamp: new Date().toISOString()
      });
    }

    // Update conversation timestamp
    await updateConversationTimestamp(conversationId);

    // Return empty TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
