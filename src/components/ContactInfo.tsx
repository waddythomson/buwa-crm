'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  contact: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
}

export default function ContactInfo({ contact }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(contact.name || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [email, setEmail] = useState(contact.email || '');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contact.id, name, phone, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(contact.name || '');
    setPhone(contact.phone || '');
    setEmail(contact.email || '');
    setEditing(false);
    setError('');
  };

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>{contact.name || 'Unnamed Contact'}</h2>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            Edit
          </button>
        </div>

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
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Edit Contact</h2>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

      <div className="form-group">
        <label htmlFor="edit-name">Name</label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-phone">Phone</label>
        <input
          id="edit-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-email">Email</label>
        <input
          id="edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} className="btn" disabled={saving} style={{ fontSize: '13px' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handleCancel} className="btn btn-secondary" style={{ fontSize: '13px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
