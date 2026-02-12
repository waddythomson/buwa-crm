import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getOpenConversationCount } from '@/lib/stats';
import DashboardLayout from '@/components/DashboardLayout';
import UserManagement from '@/components/UserManagement';

export default async function UsersPage() {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  // Only admins can access this page
  if (user.role !== 'admin') {
    redirect('/');
  }

  const [{ data: users }, openCount] = await Promise.all([
    supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
    getOpenConversationCount(),
  ]);

  return (
    <DashboardLayout user={user} openConversationCount={openCount}>
      <h1 style={{ marginBottom: '24px' }}>User Management</h1>

      <UserManagement users={users || []} currentUserId={user.id} />
    </DashboardLayout>
  );
}
