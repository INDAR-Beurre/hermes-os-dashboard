import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { apiGet } from '../api/hermes';

interface SystemStatus {
  gateway_online?: boolean;
  sessions_active?: number;
  cron_jobs?: number;
  memory_entries?: number;
  skills_installed?: number;
  mcp_servers?: number;
  uptime?: number;
  model?: string;
  personality?: string;
  platform?: string;
}

export default function Dashboard() {
  const { connection } = useStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connection) return;
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [connection]);

  const loadStatus = async () => {
    if (!connection) return;
    try {
      const data = await apiGet<SystemStatus>(connection, 'api/status');
      setStatus(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Hermes</h1>
          <p style={styles.subtitle}>
            {status?.model || 'Loading...'} · {status?.personality || '—'}
          </p>
        </div>
        <div style={styles.statusDot}>
          <div style={{
            ...styles.dotInner,
            background: status?.gateway_online ? 'var(--success)' : 'var(--error)',
          }} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Sessions" value={status?.sessions_active ?? 0} icon="chat" />
        <StatCard label="Cron" value={status?.cron_jobs ?? 0} icon="clock" />
        <StatCard label="Skills" value={status?.skills_installed ?? 0} icon="zap" />
        <StatCard label="MCP" value={status?.mcp_servers ?? 0} icon="cpu" />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System</h2>
        <div style={styles.card}>
          <InfoRow label="Platform" value={status?.platform || '—'} />
          <InfoRow label="Model" value={status?.model || '—'} />
          <InfoRow label="Personality" value={status?.personality || '—'} />
          <InfoRow label="Uptime" value={status?.uptime ? `${Math.floor(status.uptime / 3600)}h` : '—'} />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <ActionBtn label="New Chat" icon="plus" to="/sessions" navigate={navigate} />
          <ActionBtn label="Cron Jobs" icon="clock" to="/cron" navigate={navigate} />
          <ActionBtn label="Kanban" icon="kanban" to="/kanban" navigate={navigate} />
          <ActionBtn label="Memory" icon="book" to="/memory" navigate={navigate} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

function ActionBtn({ label, icon, to, navigate }: { label: string; icon: string; to: string; navigate: (path: string) => void }) {
  return (
    <button onClick={() => navigate(to)} style={styles.actionBtn}>
      <ActionIcon name={icon} />
      <span style={styles.actionLabel}>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        <StatIcon name={icon} />
      </div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function StatIcon({ name }: { name: string }) {
  const c = 'var(--gold)';
  const s = 20;
  switch (name) {
    case 'chat':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
    case 'clock':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case 'zap':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'cpu':
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></svg>;
    default:
      return null;
  }
}

function ActionIcon({ name }: { name: string }) {
  const c = 'var(--gold)';
  switch (name) {
    case 'plus':
      return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'clock':
      return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case 'kanban':
      return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" /></svg>;
    case 'book':
      return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M20 7H6.5A2.5 2.5 0 004 9.5v0" /><rect x="4" y="7" width="16" height="13" rx="2" /></svg>;
    default:
      return null;
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '20px 16px 100px',
    animation: 'fadeIn 300ms ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, var(--gold), var(--goldBright))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--textSecondary)',
    margin: 0,
  },
  statusDot: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(212,175,55,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(212,175,55,0.15)',
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    boxShadow: '0 0 12px currentColor',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--surface)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surfaceVariant)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--textPrimary)',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--textSecondary)',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--textSecondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 12,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid var(--outline)',
  },
  infoLabel: {
    fontSize: 14,
    color: 'var(--textSecondary)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--textPrimary)',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  actionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '18px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--textSecondary)',
  },
};
