import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGetList, dashboardPost, dashboardPut, dashboardDelete } from '../api/hermes';
import { Icon } from '../components/Icons';

export default function Cron() {
  const { connection } = useStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState<any>(null);
  const [form, setForm] = useState({ name: '', cron: '', prompt: '', deliver: 'channel' });

  const loadJobs = async () => {
    if (!connection) return;
    setLoading(true);
    setError('');
    try {
      const data = await dashboardGetList<any>(connection, 'cron-jobs');
      setJobs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, [connection]);

  const openCreate = () => {
    setEditJob(null);
    setForm({ name: '', cron: '', prompt: '', deliver: 'channel' });
    setShowModal(true);
  };

  const openEdit = (job: any) => {
    setEditJob(job);
    setForm({ name: job.name || '', cron: job.cron || '', prompt: job.prompt || '', deliver: job.deliver || 'channel' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!connection || !form.name || !form.cron) return;
    try {
      if (editJob) {
        await dashboardPut(connection, `cron-jobs/${editJob.id}`, form);
      } else {
        await dashboardPost(connection, 'cron-jobs', form);
      }
      setShowModal(false);
      loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleToggle = async (job: any) => {
    if (!connection) return;
    try {
      await dashboardPut(connection, `cron-jobs/${job.id}`, { ...job, status: job.status === 'active' ? 'paused' : 'active' });
      loadJobs();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!connection) return;
    try {
      await dashboardDelete(connection, `cron-jobs/${id}`);
      setJobs((j) => j.filter((x) => x.id !== id));
    } catch { /* ignore */ }
  };

  const handleTrigger = async (id: string) => {
    if (!connection) return;
    try {
      await dashboardPost(connection, `cron-jobs/${id}/trigger`);
    } catch { /* ignore */ }
  };

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Cron Jobs</h2>
          <p style={styles.pageSubtitle}>{jobs.length} scheduled</p>
        </div>
        <button style={styles.addBtn} onClick={openCreate}>
          <Icon.Plus size={18} />
          New Job
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <Icon.AlertCircle size={16} />
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={loadJobs}>Retry</button>
        </div>
      )}

      <div style={styles.jobList}>
        {loading ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : jobs.length === 0 ? (
          <div style={styles.empty}>
            <Icon.Clock size={40} />
            <p style={styles.emptyText}>No cron jobs</p>
            <p style={styles.emptyHint}>Schedule recurring prompts for Hermes</p>
          </div>
        ) : (
          jobs.map((job, idx) => (
            <div key={job.id} style={{ ...styles.jobCard, animationDelay: `${idx * 30}ms` }}>
              <div style={styles.jobHeader}>
                <div style={styles.jobName}>{job.name}</div>
                <span style={{
                  ...styles.statusBadge,
                  background: job.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                  color: job.status === 'active' ? 'var(--success)' : 'var(--warning)',
                }}>
                  {job.status || 'active'}
                </span>
              </div>
              <div style={styles.jobMeta}>
                <code style={styles.cronCode}>{job.cron}</code>
                <span style={styles.jobDeliver}>→ {job.deliver || 'channel'}</span>
              </div>
              {job.prompt && <div style={styles.jobPrompt}>{job.prompt}</div>}
              <div style={styles.jobActions}>
                <button style={styles.iconBtn} onClick={() => handleToggle(job)} title={job.status === 'active' ? 'Pause' : 'Resume'}>
                  {job.status === 'active' ? <Icon.Pause size={14} /> : <Icon.Play size={14} />}
                </button>
                <button style={styles.iconBtn} onClick={() => handleTrigger(job.id)} title="Run now">
                  <Icon.Zap size={14} />
                </button>
                <button style={styles.iconBtn} onClick={() => openEdit(job)} title="Edit">
                  <Icon.Edit size={14} />
                </button>
                <button style={{ ...styles.iconBtn, color: 'var(--error)' }} onClick={() => handleDelete(job.id)} title="Delete">
                  <Icon.Trash size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editJob ? 'Edit Job' : 'New Cron Job'}</h3>
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My scheduled task" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Schedule (cron)</label>
              <input style={styles.input} value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })} placeholder="0 9 * * *" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Prompt</label>
              <textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="What should Hermes do?" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Deliver to</label>
              <input style={styles.input} value={form.deliver} onChange={(e) => setForm({ ...form, deliver: e.target.value })} placeholder="channel" />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave} disabled={!form.name || !form.cron}>
                {editJob ? 'Save' : 'Create'}
              </button>
            </div>
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
  addBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  jobList: { flex: 1, overflow: 'auto', padding: '16px' },
  jobCard: {
    background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)',
    padding: 16, marginBottom: 10, animation: 'fadeIn 300ms ease both',
  },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobName: { fontSize: 15, fontWeight: 600, color: 'var(--textPrimary)' },
  statusBadge: { fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500, textTransform: 'lowercase' },
  jobMeta: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 },
  cronCode: { fontSize: 12, fontFamily: 'monospace', color: 'var(--gold)', background: 'rgba(212,175,55,0.08)', padding: '2px 6px', borderRadius: 4 },
  jobDeliver: { fontSize: 12, color: 'var(--textTertiary)' },
  jobPrompt: { fontSize: 13, color: 'var(--textSecondary)', lineHeight: 1.5, marginBottom: 10 },
  jobActions: { display: 'flex', gap: 8, borderTop: '1px solid var(--outline)', paddingTop: 10 },
  iconBtn: {
    background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)',
    padding: '6px 10px', color: 'var(--textSecondary)', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', color: 'var(--textTertiary)', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: 500, color: 'var(--textSecondary)', margin: 0 },
  emptyHint: { fontSize: 13, color: 'var(--textTertiary)', margin: 0 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' },
  retryBtn: { marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-xl)',
    padding: 24, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 600, color: 'var(--textPrimary)', margin: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)',
    padding: '10px 12px', color: 'var(--textPrimary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)',
    padding: '10px 16px', color: 'var(--textSecondary)', fontSize: 14, cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)',
    padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};
