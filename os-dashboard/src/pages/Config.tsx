import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGet, dashboardPost } from '../api/hermes';
import { Icon } from '../components/Icons';
import { toast } from 'sonner';

export default function Config() {
  const { connection } = useStore();
  const [config, setConfig] = useState<any>(null);
  const [rawText, setRawText] = useState('');
  const [view, setView] = useState<'ui' | 'raw'>('ui');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connection) return;
    Promise.all([
      dashboardGet<any>(connection, 'config'),
      dashboardGet<string>(connection, 'config/raw'),
    ]).then(([cfg, raw]) => {
      setConfig(cfg.config || cfg);
      setRawText(raw);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [connection]);

  const saveConfig = async () => {
    if (!connection) return;
    try {
      await dashboardPost(connection, 'config', { config });
      toast.success('Config saved');
    } catch { toast.error('Save failed'); }
  };

  const saveRaw = async () => {
    if (!connection) return;
    try {
      await dashboardPost(connection, 'config/raw', { raw: rawText });
      toast.success('Config saved');
      setView('ui');
    } catch { toast.error('Save failed'); }
  };

  if (!connection) return null;
  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Config</h2>
          <p style={styles.pageSubtitle}>Hermes configuration</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView(view === 'raw' ? 'ui' : 'raw')} style={styles.secondaryBtn}>
            {view === 'raw' ? 'UI View' : 'Edit Raw'}
          </button>
          {view === 'ui' && (
            <button onClick={saveConfig} style={styles.primaryBtn}>Save</button>
          )}
          {view === 'raw' && (
            <button onClick={saveRaw} style={styles.primaryBtn}>Save Raw</button>
          )}
        </div>
      </div>

      {view === 'raw' ? (
        <div style={{ flex: 1, padding: '0 24px 24px' }}>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            style={styles.rawEditor}
          />
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHead}>
            <span style={{ ...styles.th, width: 280 }}>Key</span>
            <span style={styles.th}>Value</span>
          </div>
          {Object.entries(config || {}).slice(0, 80).map(([key, value]) => (
            <div key={key} style={styles.tr}>
              <span style={{ ...styles.td, width: 280, color: 'var(--gold)', fontFamily: 'monospace', fontSize: 12 }}>{key}</span>
              <span style={{ ...styles.td, color: 'var(--textSecondary)', fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {typeof value === 'object' ? JSON.stringify(value).slice(0, 100) : String(value)}
              </span>
            </div>
          ))}
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
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  primaryBtn: { background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { background: 'transparent', color: 'var(--textPrimary)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: 13, cursor: 'pointer' },
  table: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', margin: '16px 24px' },
  tableHead: { display: 'flex', padding: '10px 16px', background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--outline)' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tr: { display: 'flex', padding: '10px 16px', borderBottom: '1px solid var(--outline)', animation: 'fadeIn 300ms ease both' },
  td: { fontSize: 13, color: 'var(--textPrimary)' },
  rawEditor: { width: '100%', height: 'calc(100vh - 120px)', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: 16, color: 'var(--textPrimary)', fontSize: 12, fontFamily: 'ui-monospace, monospace', resize: 'none', outline: 'none' },
};
