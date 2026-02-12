import { supabaseAdmin } from './supabase';

export async function getOpenConversationCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'pending']);

  return count || 0;
}
