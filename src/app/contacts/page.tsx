import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getOpenConversationCount } from '@/lib/stats';
import DashboardLayout from '@/components/DashboardLayout';
import ContactSearch from '@/components/ContactSearch';
import Link from 'next/link';

export default async function ContactsPage() {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  const [{ data: contacts }, openCount] = await Promise.all([
    supabaseAdmin.from('contacts').select('*').order('created_at', { ascending: false }),
    getOpenConversationCount(),
  ]);

  return (
    <DashboardLayout user={user} openConversationCount={openCount}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Contacts</h1>
        <Link href="/contacts/new" className="btn">+ New Contact</Link>
      </div>

      <ContactSearch contacts={contacts || []} />
    </DashboardLayout>
  );
}
