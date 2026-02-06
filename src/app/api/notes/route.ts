import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { contactId, conversationId, userId, content, positionAfterCommunicationId } = await request.json();

    if (!contactId || !content) {
      return NextResponse.json({ error: 'Contact ID and content required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        contact_id: contactId,
        conversation_id: conversationId || null,
        user_id: userId,
        content,
        position_after_communication_id: positionAfterCommunicationId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, note: data });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
