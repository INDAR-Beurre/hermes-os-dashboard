import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGetList } from '../api/hermes';
import { Icon } from '../components/Icons';

interface Skill {
  name: string;
  description: string;
  enabled: boolean;
}

export default function Skills() {
  const { connection } = useStore();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadSkills = async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const data = await dashboardGetList<any>(connection, 'skills');
      const parsed: Skill[] = (data || []).map((s: any) => ({
        name: s.name || s.id || '',
        description: s.description || '',
        enabled: s.enabled !== false,
      }));
      setSkills(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSkills(); }, [connection]);

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Skills</h2>
          <p style={styles.pageSubtitle}>{skills.length} installed</p>
        </div>
        <button style={styles.refreshBtn} onClick={loadSkills}>
          <Icon.Refresh size={18} />
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <Icon.AlertCircle size={16} />
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={loadSkills}>Retry</button>
        </div>
      )}

      <div style={styles.searchBar}>
        <Icon.Search size={16} />
        <input
          style={styles.searchInput}
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.skillList}>
        {loading ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <Icon.Puzzle size={40} />
            <p style={styles.emptyText}>No skills found</p>
          </div>
        ) : (
          filtered.map((skill, idx) => (
            <div key={skill.name} style={{ ...styles.skillCard, animationDelay: `${idx * 20}ms` }}>
              <div style={styles.skillHeader}>
                <span style={styles.skillName}>{skill.name}</span>
                <span style={{
                  ...styles.statusBadge,
                  background: skill.enabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: skill.enabled ? 'var(--success)' : 'var(--error)',
                }}>
                  {skill.enabled ? 'enabled' : 'disabled'}
                </span>
              </div>
              {skill.description && (
                <p style={styles.skillDesc}>{skill.description}</p>
              )}
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
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '16px 16px 0',
    padding: '10px 14px',
    background: 'var(--surfaceVariant)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--textTertiary)',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--textPrimary)',
    fontSize: 14,
    outline: 'none',
  },
  skillList: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  skillCard: {
    background: 'var(--surface)',
    border: '1px solid var(--outline)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    marginBottom: 10,
    animation: 'fadeIn 300ms ease both',
  },
  skillHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  skillName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--textPrimary)',
    fontFamily: 'monospace',
  },
  statusBadge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 500,
    textTransform: 'lowercase',
  },
  skillDesc: {
    fontSize: 13,
    color: 'var(--textSecondary)',
    margin: 0,
    lineHeight: 1.5,
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
