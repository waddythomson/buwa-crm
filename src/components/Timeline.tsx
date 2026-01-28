import { useState } from 'react';

interface TimelineItem {
  id: string;
  created_at: string;
  itemType: 'communication' | 'note';
  // Communication fields
  type?: 'sms' | 'call' | 'voicemail';
  direction?: 'inbound' | 'outbound';
  content?: string;
  duration?: number;
  recording_url?: string;
  // Note fields
  user?: { name: string };
}

interface Props {
  contactId: string;
  items: TimelineItem[];
  currentUserId: string;
}

export default function Timeline({ contactId, items, currentUserId }: Props) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          content: newNote
        })
      });

      if (res.ok) {
        setNewNote('');
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
    setSaving(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = (item: TimelineItem) => {
    if (item.itemType === 'note') return '📝';
    switch (item.type) {
      case 'sms': return item.direction === 'inbound' ? '📩' : '📤';
      case 'call': return item.direction === 'inbound' ? '📞' : '📱';
      case 'voicemail': return '🎙️';
      default: return '💬';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add Note Form */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        padding: '16px', 
        background: '#f0f9ff', 
        borderRadius: '8px',
        marginBottom: '8px'
      }}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          style={{ 
            flex: 1, 
            padding: '12px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            resize: 'none',
            fontSize: '14px'
          }}
        />
        <button
          onClick={addNote}
          disabled={saving || !newNote.trim()}
          style={{
            padding: '12px 24px',
            background: saving ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 500
          }}
        >
          {saving ? 'Saving...' : 'Add Note'}
        </button>
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
          No communications yet.
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              background: item.itemType === 'note' ? '#fef3c7' : 
                          item.direction === 'inbound' ? '#f3f4f6' : '#eff6ff',
              borderRadius: '8px',
              borderLeft: `4px solid ${
                item.itemType === 'note' ? '#f59e0b' :
                item.direction === 'inbound' ? '#6b7280' : '#2563eb'
              }`
            }}
          >
            <div style={{ fontSize: '24px' }}>{getIcon(item)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>
                  {item.itemType === 'note' ? `Note by ${item.user?.name || 'Unknown'}` :
                   `${item.direction === 'inbound' ? 'Received' : 'Sent'} ${item.type}`}
                </span>
                <span>{formatTime(item.created_at)}</span>
              </div>
              
              {item.content && (
                <div style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>
              )}
              
              {item.type === 'call' && item.duration && (
                <div style={{ color: '#666', marginTop: '4px' }}>
                  Duration: {formatDuration(item.duration)}
                </div>
              )}
              
              {item.recording_url && (
                <audio controls style={{ marginTop: '8px', width: '100%' }}>
                  <source src={item.recording_url} type="audio/mpeg" />
                </audio>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
