'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface Props {
  contacts: Contact[];
}

export default function ContactSearch({ contacts }: Props) {
  const [query, setQuery] = useState('');

  const filtered = contacts.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="card">
        {filtered.length > 0 ? (
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
              {filtered.map((contact) => (
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
            {query ? 'No contacts match your search' : (
              <>No contacts yet. <Link href="/contacts/new">Add your first contact</Link></>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
