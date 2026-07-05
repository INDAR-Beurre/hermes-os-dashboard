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
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

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
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const sources = [...new Set(sessions.map(s => s.source))];
  const filtered = sessions.filter(s => {
    if (sourceFilter && s.source !== sourceFilter) return false;
    if (search && !s.id.toLowerCase().includes(search.toLowerCase()) && !s.model.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Sessions</h2>
          <p style={styles.pageSubtitle}>{sessions.length} total</p>
        </div>
        <div style={styles.actions}>
          <div style={styles.searchBox}>
            <Icon.Search size={14} />
            <input
              style={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select style={styles.select} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="">All sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button style={styles.refreshBtn} onClick={loadSessions}><Icon.Refresh size={14} /></button>
        </div>
      </div>

      {error && <div style={styles.errorBanner}><Icon.AlertCircle size={14} /><span>{error}</span></div>}

      <div style={styles.table}>
        <div style={styles.tableHead}>
          <span style={{ ...styles.th, flex: 2 }}>Session</span>
          <span style={styles.th}>Source</span>
          <span style={styles.th}>Model</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Messages</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Tokens</span>
          <span style={styles.th}>Status</span>
        </div>
        {filtered.map((s, i) => {
          const totalT = (s as any).input_tokens + (s as any).output_tokens || 0;
          return (
            <div key={s.id} style={{ ...styles.tr, animationDelay: `${i * 15}ms` }}>
              <span style={{ ...styles.td, flex: 2 }}><span style={styles.sessionId}>#{s.id.slice(-8)}</span></span>
              <span style={{ ...styles.td, textTransform: 'capitalize' }}>{s.source}</span>
              <span style={{ ...styles.td, color: 'var(--gold)', fontFamily: 'monospace', fontSize: 12 }}>{s.model}</span>
              <span style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{s.messageCount}</span>
              <span style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{totalT.toLocaleString()}</span>
              <span style={styles.td}>
                {s.isActive
                  ? <span style={styles.activeBadge}>active</span>
                  : <span style={styles.endedBadge}>ended</span>
                }
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={styles.empty}>No sessions found</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px', borderBottom: '1px solid var(--outline)', gap: 16 },
  pageTitle: { fontSize: 26, fontWeight: 700, color: 'var(--textPrimary)' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)' },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '6px 12px' },
  searchInput: { background: 'none', border: 'none', color: 'var(--textPrimary)', fontSize: 13, outline: 'none', width: 120 },
  select: { background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '6px 10px', color: 'var(--textPrimary)', fontSize: 13, outline: 'none' },
  refreshBtn: { background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '6px 10px', color: 'var(--textSecondary)', cursor: 'pointer', display: 'flex' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)', margin: '0 24px' },
  table: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', margin: '16px 24px' },
  tableHead: { display: 'flex', padding: '10px 16px', background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--outline)' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tr: { display: 'flex', padding: '10px 16px', borderBottom: '1px solid var(--outline)', animation: 'fadeIn 300ms ease both', cursor: 'pointer', transition: 'background 150ms ease' },
  td: { fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sessionId: { fontFamily: 'monospace', color: 'var(--textTertiary)', marginRight: 8, fontSize: 12 },
  activeBadge: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: 'var(--success)' },
  endedBadge: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--surfaceVariant)', color: 'var(--textTertiary)' },
  empty: { padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--textTertiary)' },
};
