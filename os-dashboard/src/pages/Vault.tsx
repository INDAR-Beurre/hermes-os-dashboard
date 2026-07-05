import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGet } from '../api/hermes';
import { Icon } from '../components/Icons';

const VAULT_ROOTS = [
  '/home/alex/.obsidian/vaults',
  '/home/alex/Documents',
  '/home/alex/notes',
];

export default function Vault() {
  const { connection } = useStore();
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [customPath, setCustomPath] = useState('');

  useEffect(() => {
    if (!currentPath) return;
    if (!connection) return;
    dashboardGet<any>(connection, `fs/list?path=${encodeURIComponent(currentPath)}`).then(d => {
      setEntries(d.entries || []);
    }).catch(() => setEntries([]));
  }, [currentPath, connection]);

  const open = async (path: string, isDir: boolean) => {
    if (isDir) { setCurrentPath(path); setSelectedFile(null); return; }
    if (!connection) return;
    const text = await dashboardGet<string>(connection, `fs/read-text?path=${encodeURIComponent(path)}`);
    setSelectedFile({ name: path.split('/').pop() || path, content: text });
  };

  if (!connection) return null;

  const dirs = entries.filter((e: any) => e.type === 'directory' || e.isdir);
  const files = entries.filter((e: any) => !(e.type === 'directory' || e.isdir));

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Vault</h2>
          <p style={styles.pageSubtitle}>Obsidian & file vault</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={customPath}
            onChange={e => setCustomPath(e.target.value)}
            placeholder="/path/to/vault"
            style={styles.pathInput}
          />
          <button onClick={() => { setCurrentPath(customPath); setSelectedFile(null); }} style={styles.smallPrimaryBtn}>Go</button>
        </div>
      </div>

      {!currentPath ? (
        <div style={{ padding: '16px 24px' }}>
          <div style={styles.sectionLabel}>Quick Access</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {VAULT_ROOTS.map(p => (
              <button key={p} onClick={() => { setCurrentPath(p); setSelectedFile(null); }} style={styles.rootBtn}>
                <Icon.Folder size={16} />
                <span className="mono" style={{ fontSize: 13, color: 'var(--textSecondary)' }}>{p}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '0 24px 24px', gap: 12 }}>
          {/* File tree */}
          <div style={styles.tree}>
            <button onClick={() => { setCurrentPath(''); setSelectedFile(null); }} style={styles.backBtn}>
              <Icon.ArrowLeft size={14} />
              Back
            </button>
            <div style={{ borderTop: '1px solid var(--outline)', marginTop: 8, paddingTop: 8 }}>
              {dirs.map(d => (
                <button key={d.path || d.name} onClick={() => open(d.path || `${currentPath}/${d.name}`, true)} style={styles.treeItem}>
                  <Icon.Folder size={14} />
                  <span className="truncate" style={{ fontSize: 13, color: 'var(--textSecondary)' }}>{d.name}</span>
                </button>
              ))}
              {files.slice(0, 80).map(f => (
                <button key={f.path || f.name} onClick={() => open(f.path || `${currentPath}/${f.name}`, false)} style={styles.treeItem}>
                  <Icon.FileText size={14} />
                  <span className="mono truncate" style={{ fontSize: 12, color: 'var(--textSecondary)' }}>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {selectedFile ? (
              <pre style={styles.pre}>{selectedFile.content}</pre>
            ) : (
              <div style={styles.empty}>Select a file to view</div>
            )}
          </div>
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
  sectionLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--textSecondary)', marginBottom: 8 },
  rootBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', width: '100%', cursor: 'pointer', transition: 'all 200ms ease' },
  pathInput: { background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--textPrimary)', fontSize: 13, outline: 'none', width: 200, fontFamily: 'monospace' },
  smallPrimaryBtn: { background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  tree: { width: 260, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: 12, overflow: 'auto' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--textSecondary)', fontSize: 13, cursor: 'pointer', padding: 0 },
  treeItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'inherit', width: '100%', textAlign: 'left' },
  content: { flex: 1, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'auto', padding: 16 },
  pre: { margin: 0, fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--textSecondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--textTertiary)', fontSize: 13 },
};
