import { supabaseAdmin } from './supabase';

/**
 * Gets the active conversation for a contact, or creates a new one.
 * An "active" conversation is one that's open or pending.
 */
export async function getOrCreateConversation(contactId: string): Promise<string> {
  // First, try to find an existing open/pending conversation
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('contact_id', contactId)
    .in('status', ['open', 'pending'])
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return existing.id;
  }

  // No active conversation, create a new one
  const { data: newConv, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      contact_id: contactId,
      status: 'open'
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return newConv.id;
}

/**
 * Updates the last_message_at timestamp for a conversation
 */
export async function updateConversationTimestamp(conversationId: string): Promise<void> {
  await supabaseAdmin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
}

/**
 * Reopens a closed conversation (e.g., when a contact sends a new message)
 */
export async function reopenConversation(conversationId: string): Promise<void> {
  await supabaseAdmin
    .from('conversations')
    .update({ 
      status: 'open',
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .eq('status', 'closed');
}
