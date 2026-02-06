'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Communication {
  id: string;
  type: 'sms' | 'call' | 'voicemail';
  direction: 'inbound' | 'outbound';
  content: string;
  duration: number | null;
  recording_url: string | null;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  users?: { name: string };
}

interface Props {
  contactId: string;
  contactPhone: string | null;
  communications: Communication[];
  notes: Note[];
  userId: string;
  showTimeline?: boolean;
}

export default function ContactTimeline({ 
  contactId, 
  contactPhone, 
  communications, 
  notes, 
  userId,
  showTimeline = false 
}: Props) {
  const router = useRouter();
  const [smsText, setSmsText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  // Combine and sort communications and notes for timeline
  const timelineItems = [
    ...communications.map(c => ({ ...c, itemType: 'communication' as const })),
    ...notes.map(n => ({ ...n, itemType: 'note' as const }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const sendSMS = async () => {
    if (!smsText.trim() || !contactPhone) return;
    setLoading(true);

    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId, 
          to: contactPhone, 
          message: smsText,
          userId
        }),
      });

      if (res.ok) {
        setSmsText('');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to send SMS:', err);
    } finally {
      setLoading(false);
    }
  };

  const makeCall = async () => {
    if (!contactPhone) return;
    setLoading(true);

    try {
      const res = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, to: contactPhone, userId }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to make call:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, content: noteText, userId }),
      });

      if (res.ok) {
        setNoteText('');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showTimeline) {
    // Just show action buttons
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {contactPhone && (
          <>
            <button onClick={makeCall} className="btn btn-success" disabled={loading}>
              📞 Call
            </button>
          </>
        )}
      </div>
    );
  }

  // Full timeline view
  return (
    <div>
      {/* SMS Input */}
      {contactPhone && (
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && sendSMS()}
            />
            <button onClick={sendSMS} className="btn" disabled={loading || !smsText.trim()}>
              Send SMS
            </button>
          </div>
        </div>
      )}

      {/* Note Input */}
      <div style={{ marginBottom: '20px', padding: '16px', background: '#fffbeb', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
          />
          <button onClick={addNote} className="btn btn-secondary" disabled={loading || !noteText.trim()}>
            Add Note
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {timelineItems.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No activity yet</p>
        ) : (
          timelineItems.map((item) => (
            <div 
              key={`${item.itemType}-${item.id}`} 
              className={`timeline-item ${item.itemType === 'note' ? 'note' : (item as Communication).type}`}
            >
              <div className="timeline-date">
                {new Date(item.created_at).toLocaleString()}
                {item.itemType === 'note' && (item as Note).users?.name && (
                  <span> • {(item as Note).users?.name}</span>
                )}
              </div>
              <div className="timeline-content">
                {item.itemType === 'communication' ? (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span className={`badge badge-${(item as Communication).type}`}>
                        {(item as Communication).type}
                      </span>
                      <span className={`badge badge-${(item as Communication).direction}`}>
                        {(item as Communication).direction}
                      </span>
                    </div>
                    {(item as Communication).content && (
                      <p>{(item as Communication).content}</p>
                    )}
                    {(item as Communication).duration && (
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        Duration: {Math.round((item as Communication).duration! / 60)}m {(item as Communication).duration! % 60}s
                      </p>
                    )}
                    {(item as Communication).recording_url && (
                      <audio controls src={(item as Communication).recording_url!} style={{ marginTop: '8px' }} />
                    )}
                  </>
                ) : (
                  <p style={{ fontStyle: 'italic' }}>📝 {(item as Note).content}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
