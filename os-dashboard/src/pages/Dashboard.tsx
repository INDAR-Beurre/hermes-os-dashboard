import { useState, useEffect } from 'react';
import { dashboardGet, dashboardGetList } from '../api/hermes';
import { useStore } from '../store/useStore';
import { Icon } from '../components/Icons';

export default function Dashboard() {
  const { connection } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connection) return;
    Promise.all([
      dashboardGet(connection, 'system/stats'),
      dashboardGetList<any>(connection, 'sessions'),
      dashboardGet<any>(connection, 'profiles'),
    ]).then(([s, sess, prof]) => {
      setStats(s);
      setSessions((sess || []).slice(0, 8));
      setProfiles(prof?.profiles || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [connection]);

  if (!connection) return null;
  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  const memTotal = stats?.memory?.total || 1;
  const memUsed = stats?.memory?.used || 0;
  const memAvail = stats?.memory?.available || 0;
  const memPct = Math.round((memUsed / memTotal) * 100);
  const diskUsed = stats?.disk?.used || 0;
  const diskTotal = stats?.disk?.total || 1;
  const diskPct = Math.round((diskUsed / diskTotal) * 100);
  const uptimeH = Math.round((stats?.uptime_seconds || 0) / 3600);

  const totalTokens = sessions.reduce((acc, s) => acc + (s.input_tokens || 0) + (s.output_tokens || 0), 0);
  const totalMessages = sessions.reduce((acc, s) => acc + (s.message_count || 0), 0);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Dashboard</h2>
          <p style={styles.pageSubtitle}>{stats?.hostname || 'Hermes'} · {stats?.os || 'Linux'}</p>
        </div>
        <div style={styles.versionBadge}>v{stats?.hermes_version || '0.18.0'}</div>
      </div>

      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>CPU</div>
          <div style={styles.statValue}>{stats?.cpu_count || '—'} cores</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Memory</div>
          <div style={styles.statValue}>{(memUsed / 1024 / 1024 / 1024).toFixed(1)}GB</div>
          <div style={styles.statBar}><div style={{ ...styles.statFill, width: `${memPct}%`, background: memPct > 90 ? 'var(--error)' : 'var(--gold)' }} /></div>
          <div style={styles.statSub}>{(memAvail / 1024 / 1024 / 1024).toFixed(1)}GB free</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Disk</div>
          <div style={styles.statValue}>{(diskUsed / 1024 / 1024 / 1024).toFixed(0)}GB</div>
          <div style={styles.statBar}><div style={{ ...styles.statFill, width: `${diskPct}%`, background: diskPct > 85 ? 'var(--error)' : 'var(--gold)' }} /></div>
          <div style={styles.statSub}>{(diskTotal / 1024 / 1024 / 1024).toFixed(0)}GB total</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Uptime</div>
          <div style={styles.statValue}>{uptimeH}h</div>
          <div style={styles.statSub}>Python {stats?.python_version || '—'}</div>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.activityCard}>
          <div style={styles.activityHeader}><Icon.Activity size={16} /><span style={styles.activityLabel}>Activity</span></div>
          <div style={styles.activityGrid}>
            <div style={styles.activityItem}><div style={styles.activityValue}>{sessions.length}</div><div style={styles.activityLabelSmall}>Sessions</div></div>
            <div style={styles.activityItem}><div style={styles.activityValue}>{totalMessages.toLocaleString()}</div><div style={styles.activityLabelSmall}>Messages</div></div>
            <div style={styles.activityItem}><div style={styles.activityValue}>{(totalTokens / 1000).toFixed(1)}K</div><div style={styles.activityLabelSmall}>Tokens</div></div>
          </div>
        </div>

        <div style={styles.profilesCard}>
          <div style={styles.activityHeader}><Icon.Cpu size={16} /><span style={styles.activityLabel}>Profiles · {profiles.filter((p: any) => p.gateway_running).length} active</span></div>
          <div style={styles.profileList}>
            {profiles.slice(0, 5).map((p: any) => (
              <div key={p.name} style={styles.profileRow}>
                <span style={styles.profileName}>{p.name}</span>
                <span style={styles.profileModel}>{p.model || 'default'}</span>
                <span style={styles.profileSkills}>{p.skill_count} skills</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={styles.sectionHeader}><Icon.MessageSquare size={16} /><span style={styles.sectionTitle}>Recent Sessions</span></div>
        <div style={styles.table}>
          <div style={styles.tableHead}>
            <span style={{ ...styles.th, flex: 2 }}>Session</span>
            <span style={styles.th}>Model</span>
            <span style={{ ...styles.th, textAlign: 'right' }}>Messages</span>
            <span style={{ ...styles.th, textAlign: 'right' }}>Tokens</span>
            <span style={styles.th}>Ended</span>
          </div>
          {sessions.map((s, i) => {
            const totalT = (s.input_tokens || 0) + (s.output_tokens || 0);
            const date = s.ended_at ? new Date(s.ended_at * 1000).toLocaleDateString() : 'active';
            return (
              <div key={s.id} style={{ ...styles.tr, animationDelay: `${i * 20}ms` }}>
                <span style={{ ...styles.td, flex: 2 }}><span style={styles.sessionId}>#{s.id.slice(-6)}</span><span style={styles.sessionSource}>{s.source}</span></span>
                <span style={{ ...styles.td, color: 'var(--gold)', fontFamily: 'monospace', fontSize: 12 }}>{s.model || 'default'}</span>
                <span style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{s.message_count || 0}</span>
                <span style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{totalT.toLocaleString()}</span>
                <span style={{ ...styles.td, color: 'var(--textTertiary)', fontSize: 12 }}>{date}</span>
              </div>
            );
          })}
          {sessions.length === 0 && <div style={styles.empty}>No sessions yet</div>}
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
  versionBadge: { fontSize: 11, color: 'var(--gold)', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontFamily: 'monospace' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' },
  statLabel: { fontSize: 11, fontWeight: 600, color: 'var(--textTertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: 700, color: 'var(--textPrimary)', fontFamily: 'ui-monospace, monospace' },
  statBar: { height: 3, background: 'var(--surfaceVariant)', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 2, transition: 'width 500ms ease' },
  statSub: { fontSize: 11, color: 'var(--textTertiary)', marginTop: 4 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 },
  activityCard: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' },
  activityHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  activityLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--textSecondary)' },
  activityLabelSmall: { fontSize: 10, color: 'var(--textTertiary)', marginTop: 2 },
  activityGrid: { display: 'flex', gap: 24 },
  activityItem: { textAlign: 'center' },
  activityValue: { fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'ui-monospace, monospace' },
  profilesCard: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' },
  profileList: { display: 'flex', flexDirection: 'column', gap: 6 },
  profileRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' },
  profileName: { fontSize: 13, fontWeight: 500, color: 'var(--textPrimary)', minWidth: 100 },
  profileModel: { fontSize: 12, color: 'var(--gold)', fontFamily: 'monospace', flex: 1 },
  profileSkills: { fontSize: 11, color: 'var(--textTertiary)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--textSecondary)' },
  table: { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  tableHead: { display: 'flex', padding: '10px 16px', background: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--outline)' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tr: { display: 'flex', padding: '10px 16px', borderBottom: '1px solid var(--outline)', animation: 'fadeIn 300ms ease both' },
  td: { fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sessionId: { fontFamily: 'monospace', color: 'var(--textTertiary)', marginRight: 8, fontSize: 12 },
  sessionSource: { color: 'var(--textPrimary)' },
  empty: { padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--textTertiary)' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
