import { NextRequest, NextResponse } from 'next/server';
import { twilioClient, twilioPhoneNumber } from '@/lib/twilio';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateConversation, updateConversationTimestamp } from '@/lib/conversations';

export async function POST(request: NextRequest) {
  try {
    const { contactId, to, message, userId } = await request.json();

    if (!to || !message) {
      return NextResponse.json({ error: 'Phone number and message required' }, { status: 400 });
    }

    // Format phone number
    let formattedPhone = to.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1')) {
      formattedPhone = '1' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    // Send via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    // If we have a contactId, store the message
    if (contactId) {
      // Get or create conversation
      const conversationId = await getOrCreateConversation(contactId);

      await supabaseAdmin
        .from('communications')
        .insert({
          contact_id: contactId,
          conversation_id: conversationId,
          type: 'sms',
          direction: 'outbound',
          content: message,
          twilio_sid: twilioMessage.sid,
          user_id: userId
        });

      // Update conversation timestamp
      await updateConversationTimestamp(conversationId);
    }

    return NextResponse.json({ 
      success: true, 
      messageSid: twilioMessage.sid 
    });
  } catch (error: any) {
    console.error('Send SMS error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send SMS' 
    }, { status: 500 });
  }
}
