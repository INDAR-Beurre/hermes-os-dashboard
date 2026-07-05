import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGet } from '../api/hermes';
import { Icon } from '../components/Icons';

const LOG_DIR = '/home/alex/.hermes/logs';

export default function Logs() {
  const { connection } = useStore();
  const [files, setFiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [tail, setTail] = useState(300);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    if (!connection) return;
    setLoading(true);
    try {
      const data = await dashboardGet<any>(connection, `fs/list?path=${encodeURIComponent(LOG_DIR)}`);
      const entries = (data.entries || []).filter((e: any) => e.name.endsWith('.log'));
      setFiles(entries);
    } catch { /* silent */ }
    setLoading(false);
  }, [connection]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const open = async (name: string) => {
    if (!connection) return;
    setSelected(name);
    const text = await dashboardGet<string>(connection, `fs/read-text?path=${encodeURIComponent(`${LOG_DIR}/${name}`)}`);
    const lines = text.split('\n');
    setContent(lines.slice(-tail).join('\n'));
  };

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Logs</h2>
          <p style={styles.pageSubtitle}>{files.length} log files</p>
        </div>
      </div>

      {!selected ? (
        <div style={styles.table}>
          <div style={styles.tableHead}>
            <span style={{ ...styles.th, flex: 3 }}>Name</span>
            <span style={{ ...styles.th, textAlign: 'right' }}>Size</span>
          </div>
          {files.map((f, i) => (
            <button key={f.name} onClick={() => open(f.name)} style={{ ...styles.tr, animationDelay: `${i * 20}ms`, cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'inherit' }}>
              <span style={{ ...styles.td, flex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon.FileText size={14} />
                <span className="mono" style={{ fontSize: 12 }}>{f.name}</span>
              </span>
              <span style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{(f.size / 1024).toFixed(1)}KB</span>
            </button>
          ))}
          {files.length === 0 && (
            <div style={styles.empty}>No log files</div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{selected}</span>
              <button onClick={() => { setSelected(null); setContent(''); }} style={{ ...styles.smallBtn, color: 'var(--textTertiary)' }}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[100, 300, 1000].map(n => (
                <button key={n} onClick={() => { setTail(n); const lines = content.split('\n'); setContent(lines.slice(-n).join('\n')); }}
                  style={{ ...styles.smallBtn, background: tail === n ? 'var(--surfaceVariant)' : 'transparent', color: tail === n ? 'var(--textPrimary)' : 'var(--textTertiary)' }}>
                  {n >= 1000 ? `${n/1000}K` : n}
                </button>
              ))}
            </div>
          </div>
          <pre style={styles.pre}>{content || 'No content'}</pre>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 16px', borderBottom: '1px solid var(--outline)' },
  pageTitle: { fontSize: 26, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--textPrimary)' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)', margin: 0 },
  table: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', margin: '16px 24px' },
  tableHead: { display: 'flex', padding: '10px 16px', background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--outline)' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tr: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid var(--outline)', animation: 'fadeIn 300ms ease both', transition: 'all 150ms ease' },
  td: { fontSize: 13, color: 'var(--textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--textTertiary)' },
  smallBtn: { background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--textSecondary)' },
  pre: { flex: 1, overflow: 'auto', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: 16, fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--textSecondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 },
};
