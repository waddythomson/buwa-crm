import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for general queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role for auth operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Types
export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  role: 'admin' | 'user';
  status: 'invited' | 'active';
  invited_by: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  created_by: string;
}

export interface Communication {
  id: string;
  contact_id: string;
  type: 'sms' | 'call' | 'voicemail';
  direction: 'inbound' | 'outbound';
  content: string | null;
  duration: number | null;
  recording_url: string | null;
  twilio_sid: string | null;
  created_at: string;
  user_id: string | null;
}

export interface Note {
  id: string;
  contact_id: string;
  user_id: string;
  content: string;
  created_at: string;
  position_after_communication_id: string | null;
}
