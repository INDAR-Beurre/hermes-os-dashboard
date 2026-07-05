import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGetList, dashboardGet } from '../api/hermes';
import { Icon } from '../components/Icons';

export default function Memory() {
  const { connection } = useStore();
  const [entries, setEntries] = useState<{ target: string; content: string; source?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');

  const loadMemory = async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const data = await dashboardGetList<any>(connection, 'memory');
      setEntries((data || []).map((e: any) => ({
        target: e.target || e.key || '',
        content: e.content || e.value || JSON.stringify(e),
        source: 'api',
      })));
      setSource('api');
    } catch {
      try {
        const config = await dashboardGet<any>(connection, 'config');
        const memory = config.memory || {};
        const entries: { target: string; content: string; source?: string }[] = [];
        for (const [target, content] of Object.entries(memory)) {
          entries.push({ target, content: String(content), source: 'config' });
        }
        setEntries(entries);
        setSource('config');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memory');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMemory(); }, [connection]);

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Memory</h2>
          <p style={styles.pageSubtitle}>
            {entries.length} entries · source: {source || 'unknown'}
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={loadMemory}>
          <Icon.Refresh size={18} />
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <Icon.AlertCircle size={16} />
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={loadMemory}>Retry</button>
        </div>
      )}

      <div style={styles.memoryList}>
        {loading ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : entries.length === 0 ? (
          <div style={styles.empty}>
            <Icon.Memory size={40} />
            <p style={styles.emptyText}>No memory entries</p>
            <p style={styles.emptyHint}>Facts Hermes remembers across sessions</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} style={{ ...styles.entryCard, animationDelay: `${idx * 20}ms` }}>
              <div style={styles.entryTarget}>
                <span style={styles.targetLabel}>{entry.target}</span>
              </div>
              <div style={styles.entryContent}>{entry.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--background)',
    animation: 'fadeIn 300ms ease',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 16px',
    borderBottom: '1px solid var(--outline)',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: 'var(--textPrimary)',
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'var(--textSecondary)',
    margin: 0,
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--textSecondary)',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryList: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  entryCard: {
    background: 'var(--surface)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    marginBottom: 10,
    animation: 'fadeIn 300ms ease both',
  },
  entryTarget: {
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--gold)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: 'rgba(212,175,55,0.1)',
    padding: '2px 8px',
    borderRadius: 4,
  },
  entryContent: {
    fontSize: 14,
    color: 'var(--textSecondary)',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 0',
    color: 'var(--textTertiary)',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--textSecondary)',
    margin: 0,
  },
  emptyHint: {
    fontSize: 13,
    color: 'var(--textTertiary)',
    margin: 0,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'rgba(239,68,68,0.08)',
    borderBottom: '1px solid rgba(239,68,68,0.2)',
    fontSize: 13,
    color: 'var(--error)',
  },
  retryBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: '1px solid rgba(239,68,68,0.3)',
    color: 'var(--error)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2px solid var(--outline)',
    borderTopColor: 'var(--gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
