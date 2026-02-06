import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, status } = await request.json();

    if (!conversationId || !status) {
      return NextResponse.json({ error: 'Conversation ID and status required' }, { status: 400 });
    }

    if (!['open', 'pending', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ status })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation: data });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
