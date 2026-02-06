import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'user';
  status: 'invited' | 'active';
}

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Verify user still exists and is active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (error || !user || user.status !== 'active') {
      return null;
    }

    return user as User;
  } catch {
    return null;
  }
}

export function setSession(userId: string): string {
  const session = JSON.stringify({ userId, createdAt: Date.now() });
  return session;
}
