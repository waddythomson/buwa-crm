import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  // Get stats
  const { count: contactCount } = await supabaseAdmin
    .from('contacts')
    .select('*', { count: 'exact', head: true });

  const { data: recentComms } = await supabaseAdmin
    .from('communications')
    .select(`
      *,
      contacts (name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const { count: todayComms } = await supabaseAdmin
    .from('communications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().split('T')[0]);

  return (
    <DashboardLayout user={user}>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Contacts</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{contactCount || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Today's Activity</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{todayComms || 0}</div>
        </div>
        <div className="card">
          <Link href="/contacts/new" className="btn" style={{ display: 'block', textAlign: 'center' }}>
            + New Contact
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Recent Activity</h2>
        {recentComms && recentComms.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Contact</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentComms.map((comm: any) => (
                <tr key={comm.id}>
                  <td>
                    <Link href={`/contacts/${comm.contact_id}`}>
                      {comm.contacts?.name || comm.contacts?.phone || 'Unknown'}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${comm.type}`}>
                      {comm.type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${comm.direction}`}>
                      {comm.direction}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280' }}>
                    {new Date(comm.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280' }}>No recent activity</p>
        )}
      </div>
    </DashboardLayout>
  );
}
