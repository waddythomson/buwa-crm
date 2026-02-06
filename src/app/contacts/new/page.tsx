'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
    };

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create contact');
      }

      const result = await res.json();
      router.push(`/contacts/${result.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simple user object for layout (will be replaced with real data)
  const user = { name: 'User', role: 'user' };

  return (
    <DashboardLayout user={user}>
      <h1 style={{ marginBottom: '24px' }}>New Contact</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input type="tel" id="phone" name="phone" placeholder="+1..." />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Contact'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
