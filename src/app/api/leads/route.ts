import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTwilioClient, getTwilioPhoneNumber } from '@/lib/twilio';
import { getOrCreateConversation, updateConversationTimestamp } from '@/lib/conversations';

const TASKLET_WEBHOOK_URL = 'https://webhooks.tasklet.ai/v1/public/webhook?token=86476b4beecf3371cf943d3b0c22a085';

// Simple shared secret to prevent random submissions.
// Set LEADS_WEBHOOK_SECRET in .env.local and pass it as ?secret=... or in the Authorization header.
const WEBHOOK_SECRET = process.env.LEADS_WEBHOOK_SECRET || '';

const WELCOME_MESSAGE = `Thanks for signing up with BuWa Digital! We're excited to work with you. One of our team members will reach out shortly. Reply to this message anytime if you have questions.`;

async function notifyTasklet(data: Record<string, unknown>) {
  try {
    await fetch(TASKLET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error notifying Tasklet:', error);
  }
}

function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('1')) {
    digits = '1' + digits;
  }
  return '+' + digits;
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth check ---
    if (WEBHOOK_SECRET) {
      const url = new URL(request.url);
      const secretParam = url.searchParams.get('secret');
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.replace('Bearer ', '');

      if (secretParam !== WEBHOOK_SECRET && bearerToken !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // --- Parse body ---
    const body = await request.json();
    const { name, email, phone, source } = body;

    if (!name && !email && !phone) {
      return NextResponse.json({ error: 'At least name, email, or phone is required' }, { status: 400 });
    }

    // --- Check for existing contact by email or phone ---
    let contact: { id: string } | null = null;

    if (email) {
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1)
        .single();
      contact = data;
    }

    if (!contact && phone) {
      const formatted = formatPhoneNumber(phone);
      const digits = phone.replace(/\D/g, '');
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .or(`phone.eq.${formatted},phone.eq.${digits},phone.eq.+1${digits}`)
        .limit(1)
        .single();
      contact = data;
    }

    // --- Create contact if new ---
    const isNew = !contact;

    if (!contact) {
      const { data: newContact, error: createError } = await supabaseAdmin
        .from('contacts')
        .insert({
          name: name || null,
          email: email ? email.toLowerCase() : null,
          phone: phone ? formatPhoneNumber(phone) : null,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating lead contact:', createError);
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
      }

      contact = newContact;
    }

    // --- Open a conversation ---
    const conversationId = await getOrCreateConversation(contact!.id);
    await updateConversationTimestamp(conversationId);

    // --- Log the form submission as a note ---
    const noteContent = [
      `📋 New lead from ${source || 'buwatv.com'}`,
      name && `Name: ${name}`,
      email && `Email: ${email}`,
      phone && `Phone: ${phone}`,
    ].filter(Boolean).join('\n');

    await supabaseAdmin
      .from('notes')
      .insert({
        contact_id: contact!.id,
        conversation_id: conversationId,
        content: noteContent,
      });

    // --- Send welcome SMS if phone provided ---
    let smsSid: string | null = null;

    if (phone) {
      try {
        const formatted = formatPhoneNumber(phone);
        const twilioMessage = await getTwilioClient().messages.create({
          body: WELCOME_MESSAGE,
          from: getTwilioPhoneNumber(),
          to: formatted,
        });

        smsSid = twilioMessage.sid;

        // Log the SMS in communications
        await supabaseAdmin
          .from('communications')
          .insert({
            contact_id: contact!.id,
            conversation_id: conversationId,
            type: 'sms',
            direction: 'outbound',
            content: WELCOME_MESSAGE,
            twilio_sid: twilioMessage.sid,
          });

        await updateConversationTimestamp(conversationId);
      } catch (smsError: any) {
        console.error('Failed to send welcome SMS:', smsError.message);
        // Don't fail the whole request if SMS fails
      }
    }

    // --- Notify Tasklet ---
    await notifyTasklet({
      type: 'new_lead',
      contact_id: contact!.id,
      conversation_id: conversationId,
      name,
      email,
      phone,
      source: source || 'buwatv.com',
      is_new_contact: isNew,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      contact_id: contact!.id,
      conversation_id: conversationId,
      is_new_contact: isNew,
      welcome_sms_sent: !!smsSid,
    });
  } catch (error: any) {
    console.error('Lead webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
