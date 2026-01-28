import { supabase } from './supabase';
import type { User } from './supabase';

// Get current session from cookie
export async function getSession(cookies: { get: (name: string) => { value: string } | undefined }) {
  const sessionToken = cookies.get('session')?.value;
  if (!sessionToken) return null;

  const { data: session } = await supabase
    .from('sessions')
    .select('*, user:users(*)')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!session) return null;
  return session.user as User;
}

// Create session after OTP verification
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await supabase.from('sessions').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString()
  });

  return token;
}

// Find user by phone or email
export async function findUser(identifier: string): Promise<User | null> {
  const isPhone = identifier.startsWith('+') || /^\d+$/.test(identifier);
  const column = isPhone ? 'phone' : 'email';
  
  // Normalize phone number
  let value = identifier;
  if (isPhone && !identifier.startsWith('+')) {
    value = '+1' + identifier.replace(/\D/g, '');
  }

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq(column, value)
    .single();

  return data as User | null;
}

// Logout - delete session
export async function deleteSession(token: string) {
  await supabase.from('sessions').delete().eq('token', token);
}
