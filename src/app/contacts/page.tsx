import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default async function ContactsPage() {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <DashboardLayout user={user}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Contacts</h1>
        <Link href="/contacts/new" className="btn">+ New Contact</Link>
      </div>

      <div className="card">
        {contacts && contacts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact: any) => (
                <tr key={contact.id}>
                  <td>
                    <Link href={`/contacts/${contact.id}`} style={{ fontWeight: 500 }}>
                      {contact.name || 'Unnamed'}
                    </Link>
                  </td>
                  <td>{contact.phone || '-'}</td>
                  <td>{contact.email || '-'}</td>
                  <td style={{ color: '#6b7280' }}>
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
            No contacts yet. <Link href="/contacts/new">Add your first contact</Link>
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
