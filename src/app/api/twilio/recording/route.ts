import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Recording received:', recordingUrl, 'Duration:', recordingDuration);

    if (callSid && recordingUrl) {
      // Update the communication record with recording info
      await supabaseAdmin
        .from('communications')
        .update({
          recording_url: recordingUrl,
          duration: parseInt(recordingDuration) || null
        })
        .eq('twilio_sid', callSid);
    }

    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Recording webhook error:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
