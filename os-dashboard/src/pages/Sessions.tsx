import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGetList } from '../api/hermes';
import type { Session } from '../store/useStore';
import { Icon } from '../components/Icons';

export default function Sessions({ onSelectSession }: { onSelectSession: (s: Session) => void }) {
  const { connection } = useStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const data = await dashboardGetList<any>(connection, 'sessions');
      const parsed: Session[] = (data || []).map((s: any) => ({
        id: s.id || '',
        title: s.model || 'Hermes',
        model: s.model || 'Default',
        source: s.source || '',
        messageCount: s.message_count || 0,
        isActive: s.ended_at == null,
        preview: '',
        startedAt: s.started_at || 0,
        endedAt: s.ended_at,
      }));
      setSessions(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const createNewChat = () => {
    const newSession: Session = {
      id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: 'New Chat',
      model: 'hermes-agent',
      source: 'mobile',
      messageCount: 0,
      isActive: true,
      preview: '',
      startedAt: Date.now() / 1000,
    };
    onSelectSession(newSession);
  };

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Sessions</h2>
          <p style={styles.pageSubtitle}>{connection.label}</p>
        </div>
        <button style={styles.newChatBtn} onClick={createNewChat}>
          <Icon.Plus size={18} />
          New Chat
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <Icon.AlertCircle size={16} />
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={loadSessions}>Retry</button>
        </div>
      )}

      <div style={styles.sessionList}>
        {loading ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : sessions.length === 0 ? (
          <div style={styles.empty}>
            <Icon.Chat size={48} />
            <p style={styles.emptyText}>No sessions yet</p>
            <p style={styles.emptyHint}>Start a new chat to begin</p>
          </div>
        ) : (
          sessions.map((session, idx) => (
            <button
              key={session.id}
              style={{ ...styles.sessionCard, animationDelay: `${idx * 30}ms` }}
              onClick={() => onSelectSession(session)}
            >
              <div style={styles.sessionIcon}>
                {session.isActive ? <div style={styles.activeDot} /> : <Icon.Chat size={18} />}
              </div>
              <div style={styles.sessionInfo}>
                <div style={styles.sessionTitle}>{session.title}</div>
                <div style={styles.sessionMeta}>{session.model} · {session.messageCount} messages</div>
              </div>
              <div style={styles.sessionRight}>
                <span style={styles.sessionTime}>{formatTime(session.startedAt)}</span>
                {!session.isActive && <span style={styles.endedTag}>ended</span>}
              </div>
              <Icon.ChevronRight size={16} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function formatTime(unix: number): string {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 16px', borderBottom: '1px solid var(--outline)' },
  pageTitle: { fontSize: 26, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--textPrimary)', letterSpacing: '-0.01em' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)', margin: 0 },
  newChatBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  sessionList: { flex: 1, overflow: 'auto', padding: '8px 16px 16px' },
  sessionCard: {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 16px',
    background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)',
    cursor: 'pointer', transition: 'all 200ms ease', textAlign: 'left', color: 'var(--textPrimary)',
    marginBottom: 8, animation: 'fadeIn 300ms ease both',
  },
  sessionIcon: {
    width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surfaceVariant)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--textSecondary)', flexShrink: 0,
  },
  activeDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.4)',
  },
  sessionInfo: { flex: 1, minWidth: 0 },
  sessionTitle: { fontSize: 14, fontWeight: 500, color: 'var(--textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sessionMeta: { fontSize: 12, color: 'var(--textSecondary)', marginTop: 2 },
  sessionRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  sessionTime: { fontSize: 12, color: 'var(--textTertiary)' },
  endedTag: { fontSize: 10, color: 'var(--textTertiary)', background: 'var(--surfaceVariant)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', color: 'var(--textTertiary)', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: 500, color: 'var(--textSecondary)', margin: 0 },
  emptyHint: { fontSize: 13, color: 'var(--textTertiary)', margin: 0 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' },
  retryBtn: { marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
