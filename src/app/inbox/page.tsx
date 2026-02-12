import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getOpenConversationCount } from '@/lib/stats';
import DashboardLayout from '@/components/DashboardLayout';
import InboxList from '@/components/InboxList';

export default async function InboxPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch open and pending conversations with latest message
  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      contact:contacts(*),
      assigned_user:users!conversations_assigned_to_fkey(id, name, email)
    `)
    .in('status', ['open', 'pending'])
    .order('last_message_at', { ascending: false });

  // Get last message for each conversation
  const conversationsWithLastMessage = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: lastMessage } = await supabaseAdmin
        .from('communications')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return { ...conv, lastMessage };
    })
  );

  const openCount = await getOpenConversationCount();

  return (
    <DashboardLayout user={session} openConversationCount={openCount}>
      <div className="page-header">
        <h1>Inbox</h1>
      </div>
      <InboxList 
        conversations={conversationsWithLastMessage} 
        currentUserId={session.id}
      />
    </DashboardLayout>
  );
}
