import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ 
        assigned_to: userId || null 
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Error assigning conversation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation: data });
  } catch (error) {
    console.error('Assign conversation error:', error);
    return NextResponse.json({ error: 'Failed to assign conversation' }, { status: 500 });
  }
}
