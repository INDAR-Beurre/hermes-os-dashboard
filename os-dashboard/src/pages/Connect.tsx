import { useState } from 'react';
import type { ConnectionConfig } from '../api/hermes';

interface ConnectProps {
  onConnect: (cfg: ConnectionConfig) => void;
}

export default function Connect({ onConnect }: ConnectProps) {
  const [username, setUsername] = useState('alex');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'basic',
          username,
          password,
        }),
        credentials: 'include',
      });

      if (res.status === 401) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(`Login failed: HTTP ${res.status}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const landing = data.next || '/';

      onConnect({
        id: crypto.randomUUID(),
        label: 'Hermes',
        host: '127.0.0.1',
        port: 9119,
        apiKey: '',
        useHttps: false,
        dashboardProxied: true,
        dashboardUsername: username,
        dashboardPassword: password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
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
        <p style={styles.subtitle}>Sign in to your dashboard</p>
      </div>

      <form onSubmit={handleConnect} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
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
};
