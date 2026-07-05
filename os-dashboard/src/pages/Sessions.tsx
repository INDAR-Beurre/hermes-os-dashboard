import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { dashboardGetList } from '../api/hermes';
import type { Session } from '../store/useStore';

export default function Sessions({ onSelectSession }: { onSelectSession: (s: Session) => void }) {
  const { connection } = useStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadSessions = useCallback(async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const data = await dashboardGetList<any>(connection, 'sessions');
      const parsed: Session[] = (data || []).map((s: any) => ({
        id: s.id || '',
        title: s.model || 'Hermes',
        model: s.model || 'default',
        source: s.source || '',
        messageCount: s.message_count || 0,
        isActive: s.ended_at == null,
        preview: '',
        startedAt: s.started_at || 0,
        endedAt: s.ended_at,
      }));
      setSessions(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const filtered = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.id.toLowerCase().includes(q) || s.model.toLowerCase().includes(q) || s.source.toLowerCase().includes(q);
  });

  if (!connection) return null;

  const startNewChat = () => {
    const newSession: Session = {
      id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: 'New Chat',
      model: 'default',
      source: 'mobile',
      messageCount: 0,
      isActive: true,
      preview: '',
      startedAt: Date.now(),
    };
    onSelectSession(newSession);
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>Sessions</h2>
          <p style={styles.subtitle}>{sessions.length} total</p>
        </div>
        <button style={styles.newBtn} onClick={startNewChat}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      <div style={styles.searchBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          style={styles.searchInput}
          placeholder="Search sessions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.list}>
        {loading ? (
          <div style={styles.center}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.center}>No sessions found</div>
        ) : (
          filtered.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s)}
              style={{ ...styles.sessionCard, animationDelay: `${i * 20}ms` }}
            >
              <div style={styles.sessionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              </div>
              <div style={styles.sessionInfo}>
                <div style={styles.sessionTitle}>{s.title || `Session ${s.id.slice(-8)}`}</div>
                <div style={styles.sessionMeta}>
                  <span style={styles.modelTag}>{s.model}</span>
                  <span style={styles.sourceText}>{s.source}</span>
                  <span style={styles.msgCount}>{s.messageCount} msgs</span>
                </div>
              </div>
              <div style={{
                ...styles.statusDot,
                background: s.isActive ? 'var(--success)' : 'var(--text-tertiary)',
              }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', height: '100dvh',
    background: 'var(--background)', animation: 'fadeIn 300ms ease',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 16px 12px', borderBottom: '1px solid var(--outline)',
  },
  title: { fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--textPrimary)' },
  subtitle: { fontSize: 12, color: 'var(--textSecondary)', margin: '2px 0 0' },
  newBtn: {
    width: 40, height: 40, borderRadius: 'var(--radius-full)',
    background: 'var(--gold)', color: '#000', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    margin: '12px 16px', padding: '10px 14px',
    background: 'var(--surfaceVariant)', border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-full)',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', color: 'var(--textPrimary)',
    fontSize: 14, outline: 'none',
  },
  error: {
    margin: '0 16px 12px', padding: '10px 14px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: 13,
  },
  list: { flex: 1, overflow: 'auto', padding: '8px 16px' },
  center: {
    textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)', fontSize: 14,
  },
  sessionCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '14px 16px', marginBottom: 8,
    background: 'var(--surface)', border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)', cursor: 'pointer',
    animation: 'fadeIn 300ms ease both', transition: 'all 150ms ease',
    textAlign: 'left',
  },
  sessionIcon: {
    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
    background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sessionInfo: { flex: 1, minWidth: 0 },
  sessionTitle: {
    fontSize: 14, fontWeight: 600, color: 'var(--textPrimary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  sessionMeta: { display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' },
  modelTag: {
    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
    background: 'rgba(212,175,55,0.1)', color: 'var(--gold)',
    fontFamily: 'monospace',
  },
  sourceText: { fontSize: 11, color: 'var(--text-tertiary)' },
  msgCount: { fontSize: 11, color: 'var(--text-tertiary)' },
  statusDot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  },
};
