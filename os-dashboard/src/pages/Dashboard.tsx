import { useState, useEffect } from 'react';
import { dashboardGet } from '../api/hermes';
import { useStore } from '../store/useStore';
import { Icon } from '../components/Icons';

export default function Dashboard() {
  const { connection } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connection) return;
    Promise.all([
      dashboardGet(connection, 'system/stats'),
      dashboardGet<any[]>(connection, 'sessions'),
    ]).then(([s, sess]) => {
      setStats(s);
      setSessions(Array.isArray(sess) ? sess.slice(0, 6) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [connection]);

  if (!connection) return null;
  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  const memUsed = stats?.memory_used_mb || 0;
  const memTotal = stats?.memory_total_mb || 1;
  const memPct = Math.round((memUsed / memTotal) * 100);
  const cpuPct = Math.round(stats?.cpu_percent || 0);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Dashboard</h2>
          <p style={styles.pageSubtitle}>System overview · {stats?.platform || 'unknown'}</p>
        </div>
      </div>

      {/* System stats */}
      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>CPU</div>
          <div style={styles.statValue}>{cpuPct}%</div>
          <div style={styles.statBar}><div style={{ ...styles.statFill, width: `${cpuPct}%`, background: cpuPct > 80 ? 'var(--error)' : 'var(--gold)' }} /></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Memory</div>
          <div style={styles.statValue}>{memUsed}MB</div>
          <div style={styles.statBar}><div style={{ ...styles.statFill, width: `${memPct}%`, background: memPct > 90 ? 'var(--error)' : 'var(--gold)' }} /></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Disk</div>
          <div style={styles.statValue}>{(stats?.disk_used_gb || 0).toFixed(1)}GB</div>
          <div style={styles.statBar}><div style={{ ...styles.statFill, width: '45%', background: 'var(--gold)' }} /></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Uptime</div>
          <div style={styles.statValue}>{Math.floor((stats?.uptime_seconds || 0) / 3600)}h</div>
          <div style={styles.statSub}>PID {stats?.pid || '—'}</div>
        </div>
      </div>

      {/* Sessions */}
      <div style={{ marginTop: 24 }}>
        <div style={styles.sectionHeader}>
          <Icon.Activity size={16} />
          <span style={styles.sectionTitle}>Recent Sessions</span>
        </div>
        <div style={styles.table}>
          <div style={styles.tableHead}>
            <span style={styles.th}>Name</span>
            <span style={styles.th}>Platform</span>
            <span style={{ ...styles.th, textAlign: 'right' }}>Tokens</span>
            <span style={{ ...styles.th, textAlign: 'right' }}>Cost</span>
          </div>
          {sessions.map((s, i) => (
            <div key={s.id} style={{ ...styles.tr, animationDelay: `${i * 20}ms` }}>
              <span style={styles.td}>{s.display_name || s.title || 'Untitled'}</span>
              <span style={{ ...styles.td, color: 'var(--textSecondary)', textTransform: 'capitalize' }}>{s.platform}</span>
              <span style={{ ...styles.td, textAlign: 'right' }}>{(s.total_tokens || 0).toLocaleString()}</span>
              <span style={{ ...styles.td, textAlign: 'right' }}>${(s.estimated_cost_usd || 0).toFixed(4)}</span>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={styles.empty}>No sessions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease', padding: '24px 28px', overflow: 'auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 0 16px', borderBottom: '1px solid var(--outline)', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: 700, color: 'var(--textPrimary)', letterSpacing: '-0.01em' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', transition: 'all 200ms ease' },
  statLabel: { fontSize: 11, fontWeight: 600, color: 'var(--textTertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: 700, color: 'var(--textPrimary)', fontFamily: 'ui-monospace, monospace' },
  statBar: { height: 3, background: 'var(--surfaceVariant)', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 2, transition: 'width 500ms ease' },
  statSub: { fontSize: 11, color: 'var(--textTertiary)', marginTop: 4 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--textSecondary)' },
  sectionTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  table: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  tableHead: { display: 'flex', padding: '10px 16px', background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--outline)' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 },
  tr: { display: 'flex', padding: '10px 16px', borderBottom: '1px solid var(--outline)', animation: 'fadeIn 300ms ease both' },
  td: { fontSize: 13, color: 'var(--textPrimary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--textTertiary)' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
