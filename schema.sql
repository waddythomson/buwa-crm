-- BuWa CRM Database Schema
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Users table (CRM users who can log in)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'active')),
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table (people you communicate with)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Communications table (SMS, calls, voicemails)
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'call', 'voicemail')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT,
    duration INTEGER,
    recording_url TEXT,
    twilio_sid VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES users(id)
);

-- Notes table (inline notes on contact timelines)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    position_after_communication_id UUID REFERENCES communications(id)
);

-- Sessions table (for auth)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_communications_contact_id ON communications(contact_id);
CREATE INDEX idx_communications_created_at ON communications(created_at);
CREATE INDEX idx_notes_contact_id ON notes(contact_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Create the first admin user (YOU!)
INSERT INTO users (phone, email, name, role, status) 
VALUES ('+18032001614', 'waddythomson@arsenalhill.com', 'Waddy Thomson', 'admin', 'active');

