import { useState, useEffect } from 'react';
import type { ConnectionConfig } from '../api/hermes';
import { apiGet } from '../api/hermes';

interface ConnectProps {
  onConnect: (cfg: ConnectionConfig) => void;
  existingConnection?: ConnectionConfig | null;
}

export default function Connect({ onConnect, existingConnection }: ConnectProps) {
  const [label, setLabel] = useState(existingConnection?.label || '');
  const [host, setHost] = useState(existingConnection?.host || '127.0.0.1');
  const [port, setPort] = useState(existingConnection?.port?.toString() || '8642');
  const [apiKey, setApiKey] = useState(existingConnection?.apiKey || '');
  const [useHttps, setUseHttps] = useState(existingConnection?.useHttps || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cfg: ConnectionConfig = {
        id: existingConnection?.id || crypto.randomUUID(),
        label: label || `Hermes ${host}:${port}`,
        host,
        port: parseInt(port) || 8642,
        apiKey,
        useHttps,
        dashboardProxied: false,
      };

      // Verify connection
      await apiGet<{ status: string }>(cfg, 'health');

      onConnect(cfg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logoGlow} />
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h1 style={styles.title}>Hermes OS</h1>
        <p style={styles.subtitle}>Connect to your Hermes instance</p>
      </div>

      <form onSubmit={handleConnect} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Connection Label</label>
          <input
            style={styles.input}
            type="text"
            placeholder="My Hermes"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Host</label>
            <input
              style={styles.input}
              type="text"
              placeholder="127.0.0.1"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div style={{ ...styles.fieldGroup, width: 100 }}>
            <label style={styles.label}>Port</label>
            <input
              style={styles.input}
              type="text"
              placeholder="8642"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>API Key</label>
          <input
            style={styles.input}
            type="password"
            placeholder="hermes-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </div>

        <div style={styles.toggleRow}>
          <label style={styles.label}>Use HTTPS</label>
          <button
            type="button"
            style={{
              ...styles.toggle,
              background: useHttps ? 'var(--gold)' : 'transparent',
              borderColor: useHttps ? 'var(--gold)' : 'var(--outline)',
            }}
            onClick={() => setUseHttps(!useHttps)}
          >
            <div style={{
              ...styles.toggleDot,
              transform: useHttps ? 'translateX(16px)' : 'translateX(0)',
            }} />
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !apiKey.trim()}
          style={{
            ...styles.button,
            opacity: loading || !apiKey.trim() ? 0.5 : 1,
          }}
        >
          {loading ? (
            <span style={styles.spinner} />
          ) : (
            'Connect'
          )}
        </button>

        <p style={styles.hint}>
          Default: <code style={styles.code}>http://127.0.0.1:8642</code>
          {' · '}Dashboard on <code style={styles.code}>9119</code>
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px 24px',
    background: 'var(--background)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
    animation: 'pulse 3s ease-in-out infinite',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--textPrimary)',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, var(--gold), var(--goldBright))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--textSecondary)',
    margin: 0,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--textSecondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    background: 'var(--surfaceVariant)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    color: 'var(--textPrimary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 200ms ease',
    width: '100%',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    border: '2px solid var(--outline)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 200ms ease',
    padding: 0,
  },
  toggleDot: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'var(--gold)',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
  },
  errorText: {
    color: 'var(--error)',
    fontSize: 13,
  },
  button: {
    background: 'var(--gold)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '14px 24px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--textTertiary)',
    margin: 0,
  },
  code: {
    background: 'var(--surfaceVariant)',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// Inject spin animation
if (typeof document !== 'undefined' && !document.getElementById('hermes-animations')) {
  const style = document.createElement('style');
  style.id = 'hermes-animations';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-12px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}
