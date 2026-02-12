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

export interface SessionData {
  userId: string;
  createdAt: number;
}

export function decodeSessionCookie(value?: string | null): SessionData | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as SessionData;
  } catch {
    // Fall back to base64 decoding for newer sessions.
  }

  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = decodeSessionCookie(sessionCookie.value);
    if (!session?.userId) {
      return null;
    }
    
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
  return Buffer.from(session).toString('base64');
}
