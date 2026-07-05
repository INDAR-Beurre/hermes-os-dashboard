import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGetList } from '../api/hermes';
import { Icon } from '../components/Icons';

const columns = [
  { key: 'triage', label: 'Triage' },
  { key: 'todo', label: 'To Do' },
  { key: 'ready', label: 'Ready' },
  { key: 'running', label: 'Running' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export default function Kanban() {
  const { connection } = useStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const data = await dashboardGetList(connection, 'kanban');
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kanban');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Kanban</h2>
          <p style={styles.pageSubtitle}>{tasks.length} tasks</p>
        </div>
        <button style={styles.iconBtn} onClick={loadTasks} title="Refresh">
          <Icon.Refresh size={16} />
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <Icon.AlertCircle size={16} />
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={loadTasks}>Retry</button>
        </div>
      )}

      <div style={styles.board}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} style={styles.column}>
              <div style={styles.columnHeader}>
                <span style={styles.columnLabel}>{col.label}</span>
                <span style={styles.countBadge}>{colTasks.length}</span>
              </div>
              <div style={styles.taskList}>
                {colTasks.map((task, idx) => (
                  <div key={task.id} style={{ ...styles.taskCard, animationDelay: `${idx * 30}ms` }}>
                    <div style={styles.taskTitle}>{task.title || 'Untitled'}</div>
                    {task.body && <div style={styles.taskBody}>{task.body}</div>}
                    <div style={styles.taskFooter}>
                      <span style={styles.taskId}>#{task.id}</span>
                      {task.priority && (
                        <span style={{
                          ...styles.priorityBadge,
                          background: task.priority >= 8 ? 'rgba(239,68,68,0.1)' : task.priority >= 5 ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                          color: task.priority >= 8 ? 'var(--error)' : task.priority >= 5 ? 'var(--warning)' : 'var(--info)',
                        }}>
                          P{task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 16px', borderBottom: '1px solid var(--outline)' },
  pageTitle: { fontSize: 26, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--textPrimary)' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)', margin: 0 },
  iconBtn: { background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)', padding: '8px', color: 'var(--textSecondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' },
  retryBtn: { marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  board: { display: 'flex', gap: 10, padding: '16px', overflowX: 'auto', flex: 1 },
  column: { minWidth: 180, maxWidth: 220, flex: '1 1 180px' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' },
  columnLabel: { fontSize: 11, fontWeight: 600, color: 'var(--textTertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  countBadge: { fontSize: 11, background: 'var(--surfaceVariant)', color: 'var(--textSecondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' },
  taskList: { display: 'flex', flexDirection: 'column', gap: 8 },
  taskCard: {
    background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)',
    padding: 14, animation: 'fadeIn 300ms ease both', transition: 'all 200ms ease',
  },
  taskTitle: { fontSize: 14, fontWeight: 600, color: 'var(--textPrimary)', marginBottom: 4 },
  taskBody: { fontSize: 12, color: 'var(--textSecondary)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  taskId: { fontSize: 11, color: 'var(--textTertiary)', fontFamily: 'monospace' },
  priorityBadge: { fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 },
};
