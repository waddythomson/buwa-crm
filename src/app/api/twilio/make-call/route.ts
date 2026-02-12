import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient, getTwilioPhoneNumber } from '@/lib/twilio';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateConversation, updateConversationTimestamp } from '@/lib/conversations';

export async function POST(request: NextRequest) {
  try {
    const { contactId, to, userId } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Format phone number
    let formattedPhone = to.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1')) {
      formattedPhone = '1' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buwa-crm.vercel.app';

    // Initiate call via Twilio
    const call = await getTwilioClient().calls.create({
      url: `${baseUrl}/api/twilio/outbound-call`,
      from: getTwilioPhoneNumber(),
      to: formattedPhone,
      record: true,
      recordingStatusCallback: `${baseUrl}/api/twilio/recording`
    });

    // If we have a contactId, log the call
    if (contactId) {
      // Get or create conversation
      const conversationId = await getOrCreateConversation(contactId);

      await supabaseAdmin
        .from('communications')
        .insert({
          contact_id: contactId,
          conversation_id: conversationId,
          type: 'call',
          direction: 'outbound',
          content: 'Outbound call initiated',
          twilio_sid: call.sid,
          user_id: userId
        });

      // Update conversation timestamp
      await updateConversationTimestamp(conversationId);
    }

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid 
    });
  } catch (error: any) {
    console.error('Make call error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to initiate call' 
    }, { status: 500 });
  }
}
