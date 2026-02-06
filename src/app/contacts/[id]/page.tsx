import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import ContactTimeline from '@/components/ContactTimeline';

interface PageProps {
  params: { id: string };
}

export default async function ContactDetailPage({ params }: PageProps) {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!contact) {
    notFound();
  }

  // Get communications
  const { data: communications } = await supabaseAdmin
    .from('communications')
    .select('*')
    .eq('contact_id', params.id)
    .order('created_at', { ascending: true });

  // Get notes
  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('*, users(name)')
    .eq('contact_id', params.id)
    .order('created_at', { ascending: true });

  return (
    <DashboardLayout user={user}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/contacts" style={{ color: '#6b7280', fontSize: '14px' }}>← Back to Contacts</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Contact Info */}
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>{contact.name || 'Unnamed Contact'}</h2>
          
          {contact.phone && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Phone</div>
              <div>{contact.phone}</div>
            </div>
          )}
          
          {contact.email && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Email</div>
              <div>{contact.email}</div>
            </div>
          )}

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>Quick Actions</div>
            <ContactTimeline 
              contactId={params.id} 
              contactPhone={contact.phone}
              communications={communications || []}
              notes={notes || []}
              userId={user.id}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Timeline</h2>
          <ContactTimeline 
            contactId={params.id}
            contactPhone={contact.phone}
            communications={communications || []}
            notes={notes || []}
            userId={user.id}
            showTimeline={true}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
