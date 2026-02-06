'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  contact_id: string;
  status: 'open' | 'pending' | 'closed';
  assigned_to: string | null;
  subject: string | null;
  created_at: string;
  last_message_at: string;
  contact: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  assigned_user: {
    id: string;
    name: string;
    email: string;
  } | null;
  lastMessage: {
    type: string;
    direction: string;
    content: string | null;
    created_at: string;
  } | null;
}

interface InboxListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export default function InboxList({ conversations, currentUserId }: InboxListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'mine') return conv.assigned_to === currentUserId;
    if (filter === 'unassigned') return !conv.assigned_to;
    return true;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: '#22c55e',
      pending: '#f59e0b',
      closed: '#6b7280'
    };
    return (
      <span style={{
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  const getTypeIcon = (type: string, direction: string) => {
    if (type === 'sms') return direction === 'inbound' ? '📥' : '📤';
    if (type === 'call') return direction === 'inbound' ? '📞' : '📱';
    if (type === 'voicemail') return '🎤';
    return '💬';
  };

  const handleAssign = async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const res = await fetch('/api/conversations/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, userId: currentUserId })
    });

    if (res.ok) {
      router.refresh();
    }
  };

  const handleStatusChange = async (conversationId: string, newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const res = await fetch('/api/conversations/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, status: newStatus })
    });

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: filter === 'all' ? '#3b82f6' : '#e5e7eb',
            color: filter === 'all' ? 'white' : '#374151'
          }}
        >
          All ({conversations.length})
        </button>
        <button
          onClick={() => setFilter('mine')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: filter === 'mine' ? '#3b82f6' : '#e5e7eb',
            color: filter === 'mine' ? 'white' : '#374151'
          }}
        >
          Mine ({conversations.filter(c => c.assigned_to === currentUserId).length})
        </button>
        <button
          onClick={() => setFilter('unassigned')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: filter === 'unassigned' ? '#3b82f6' : '#e5e7eb',
            color: filter === 'unassigned' ? 'white' : '#374151'
          }}
        >
          Unassigned ({conversations.filter(c => !c.assigned_to).length})
        </button>
      </div>

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <p>No conversations to show</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredConversations.map(conv => (
            <Link 
              href={`/contacts/${conv.contact_id}?conversation=${conv.id}`} 
              key={conv.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ 
                padding: '16px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                borderLeft: conv.status === 'open' ? '4px solid #22c55e' : conv.status === 'pending' ? '4px solid #f59e0b' : '4px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>
                        {conv.contact?.name || conv.contact?.phone || conv.contact?.email || 'Unknown'}
                      </strong>
                      {getStatusBadge(conv.status)}
                      {conv.assigned_user && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          → {conv.assigned_user.name}
                        </span>
                      )}
                    </div>
                    
                    {conv.lastMessage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                        <span>{getTypeIcon(conv.lastMessage.type, conv.lastMessage.direction)}</span>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          maxWidth: '400px'
                        }}>
                          {conv.lastMessage.content || `${conv.lastMessage.type} ${conv.lastMessage.direction}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {formatTime(conv.last_message_at)}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!conv.assigned_to && (
                        <button
                          onClick={(e) => handleAssign(conv.id, e)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Claim
                        </button>
                      )}
                      {conv.status === 'open' && (
                        <button
                          onClick={(e) => handleStatusChange(conv.id, 'closed', e)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                      )}
                      {conv.status === 'closed' && (
                        <button
                          onClick={(e) => handleStatusChange(conv.id, 'open', e)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
