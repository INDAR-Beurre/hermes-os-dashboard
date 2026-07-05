import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icons';

interface CCSession {
  id: string;
  project: string;
  startTime: number;
  messages: { role: string; content: string; timestamp: number }[];
  lastActivity: number;
}

export default function ClaudeCode() {
  const [sessions, setSessions] = useState<CCSession[]>([]);
  const [selected, setSelected] = useState<CCSession | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/cc/sessions');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSessions(data.sessions || []);
      setLoading(false);
    } catch {
      // CC bridge not available — show empty state
      setSessions([]);
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await fetch('/api/cc/sessions/' + selected.id + '/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      setReply('');
    } catch { /* silent */ }
    setSending(false);
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Claude Code</h2>
          <p style={styles.pageSubtitle}>{sessions.length} sessions synced</p>
        </div>
        <button style={styles.refreshBtn} onClick={loadSessions}><Icon.Refresh size={14} /></button>
      </div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>
          <Icon.Cpu size={40} />
          <p>No Claude Code sessions detected</p>
          <p style={styles.emptyHint}>Make sure Claude Code is running and the CC bridge is enabled</p>
        </div>
      ) : (
        <div style={styles.layout}>
          {/* Session list */}
          <div style={styles.sessionList}>
            {sessions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  ...styles.sessionCard,
                  borderColor: selected?.id === s.id ? 'var(--gold)' : 'var(--outline)',
                  background: selected?.id === s.id ? 'rgba(212,175,55,0.06)' : 'var(--surface)',
                  animationDelay: `${i * 20}ms`,
                }}
              >
                <div style={styles.sessionHeader}>
                  <span style={styles.sessionId}>#{s.id.slice(0, 8)}</span>
                  <span style={styles.sessionProject}>{s.project}</span>
                </div>
                <div style={styles.sessionMeta}>
                  {new Date(s.startTime).toLocaleDateString()} · {s.messages.length} messages
                </div>
                {s.messages.length > 0 && (
                  <div style={styles.lastMessage}>
                    {s.messages[s.messages.length - 1].content.slice(0, 60)}...
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Chat view */}
          <div style={styles.chatArea}>
            {selected ? (
              <>
                <div style={styles.chatHeader}>
                  <span style={styles.chatTitle}>Session #{selected.id.slice(0, 8)}</span>
                  <span style={styles.chatProject}>{selected.project}</span>
                </div>
                <div style={styles.messages}>
                  {selected.messages.map((m, i) => (
                    <div key={i} style={{ ...styles.msg, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        ...styles.msgBubble,
                        background: m.role === 'user' ? 'var(--gold)' : 'var(--surfaceVariant)',
                        color: m.role === 'user' ? '#000' : 'var(--textPrimary)',
                      }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={styles.replyArea}>
                  <input
                    style={styles.replyInput}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                    placeholder="Reply as Hermes..."
                  />
                  <button onClick={sendReply} disabled={sending} style={styles.replyBtn}>
                    <Icon.Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.empty}>Select a session to view</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px', borderBottom: '1px solid var(--outline)' },
  pageTitle: { fontSize: 26, fontWeight: 700, color: 'var(--textPrimary)' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)' },
  refreshBtn: { background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '8px 10px', color: 'var(--textSecondary)', cursor: 'pointer', display: 'flex' },
  layout: { display: 'flex', flex: 1, minHeight: 0, padding: '16px 24px 24px', gap: 16 },
  sessionList: { width: 320, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' },
  sessionCard: { border: '1px solid', borderRadius: 'var(--radius-lg)', padding: 14, cursor: 'pointer', transition: 'all 200ms ease', animation: 'fadeIn 300ms ease both' },
  sessionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sessionId: { fontFamily: 'monospace', fontSize: 11, color: 'var(--textTertiary)' },
  sessionProject: { fontSize: 11, color: 'var(--textTertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 },
  sessionMeta: { fontSize: 11, color: 'var(--textTertiary)', marginBottom: 6 },
  lastMessage: { fontSize: 12, color: 'var(--textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--outline)' },
  chatTitle: { fontSize: 14, fontWeight: 600, color: 'var(--textPrimary)' },
  chatProject: { fontSize: 12, color: 'var(--textTertiary)', fontFamily: 'monospace' },
  messages: { flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  msg: { display: 'flex' },
  msgBubble: { maxWidth: '80%', padding: '10px 14px', borderRadius: 'var(--radius-lg)', fontSize: 13, lineHeight: 1.5 },
  replyArea: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--outline)' },
  replyInput: { flex: 1, background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--textPrimary)', fontSize: 14, outline: 'none' },
  replyBtn: { background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 14px', cursor: 'pointer', display: 'flex' },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--textTertiary)', fontSize: 13, gap: 8 },
  emptyHint: { fontSize: 11, color: 'var(--textTertiary)', marginTop: 4 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
