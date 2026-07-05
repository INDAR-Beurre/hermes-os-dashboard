import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGet, dashboardPost } from '../api/hermes';
import { Icon } from '../components/Icons';

export default function Settings({ onDisconnect }: { onDisconnect: () => void }) {
  const { connection } = useStore();
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [modelOptions, setModelOptions] = useState<any>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadModelInfo = async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const info = await dashboardGet<any>(connection, 'model/info');
      setModelInfo(info);
      if (info?.provider) setSelectedProvider(info.provider);
      if (info?.model) setSelectedModel(info.model);

      try {
        const options = await dashboardGet<any>(connection, 'model/options');
        setModelOptions(options);
        const provs = Object.keys(options?.providers || options || {});
        setProviders(provs);
        if (provs.length > 0 && !selectedProvider) {
          setSelectedProvider(provs[0]);
          const firstModels = options?.providers?.[provs[0]] || options?.[provs[0]] || [];
          setModels(Array.isArray(firstModels) ? firstModels : []);
        }
      } catch { /* options optional */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadModelInfo(); }, [connection]);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    if (modelOptions?.providers?.[provider]) {
      setModels(modelOptions.providers[provider]);
    } else if (modelOptions?.[provider]) {
      setModels(modelOptions[provider]);
    }
    if (models.length > 0) setSelectedModel(models[0]);
  };

  const applyModel = async () => {
    if (!connection || !selectedProvider || !selectedModel) return;
    try {
      await dashboardPost(connection, 'model/set', {
        scope: 'session',
        provider: selectedProvider,
        model: selectedModel,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set model');
    }
  };

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Settings</h2>
          <p style={styles.pageSubtitle}>Model &amp; connection config</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <Icon.AlertCircle size={16} />
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={loadModelInfo}>Retry</button>
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Model</h3>
          {saved && (
            <div style={styles.successMsg}>
              <Icon.Check size={14} />
              <span>Model applied</span>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Current Model</label>
            {modelInfo && (
              <div style={styles.currentModel}>
                <Icon.Cpu size={16} />
                <span>{modelInfo.provider}/{modelInfo.model}</span>
              </div>
            )}
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Provider</label>
              <select
                style={styles.select}
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Model</label>
              <select
                style={styles.select}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <button style={styles.applyBtn} onClick={applyModel} disabled={!selectedProvider || !selectedModel}>
            Apply Model
          </button>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Connection</h3>
          <div style={styles.field}>
            <label style={styles.label}>Label</label>
            <div style={styles.value}>{connection.label}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Host</label>
            <div style={styles.value}>{connection.useHttps ? 'https' : 'http'}://{connection.host}:{connection.port}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>API Key</label>
            <code style={styles.apiKey}>{connection.apiKey.slice(0, 8)}...{connection.apiKey.slice(-4)}</code>
          </div>
          <button
            style={{ ...styles.disconnectBtn, marginTop: 12 }}
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </div>
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
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--textSecondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 16px 0',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--textTertiary)',
    marginBottom: 6,
    display: 'block',
  },
  value: {
    fontSize: 14,
    color: 'var(--textPrimary)',
    fontFamily: 'monospace',
  },
  currentModel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: 'var(--gold)',
    fontWeight: 500,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  select: {
    flex: 1,
    background: 'var(--surfaceVariant)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
    color: 'var(--textPrimary)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  },
  applyBtn: {
    background: 'var(--gold)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  apiKey: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: 'var(--textSecondary)',
    background: 'var(--surfaceVariant)',
    padding: '4px 8px',
    borderRadius: 4,
  },
  disconnectBtn: {
    background: 'transparent',
    border: '1px solid rgba(239,68,68,0.3)',
    color: 'var(--error)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
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
  successMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    background: 'rgba(34,197,94,0.08)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--success)',
    fontSize: 13,
    marginBottom: 12,
  },
};
