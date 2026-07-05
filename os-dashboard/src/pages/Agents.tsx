import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { dashboardGet, dashboardPost, dashboardPut } from '../api/hermes';
import { Icon } from '../components/Icons';

export default function Agents() {
  const { connection } = useStore();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connection) return;
    Promise.all([
      dashboardGet<any[]>(connection, 'profiles'),
      dashboardGet<any>(connection, 'profiles/active'),
    ]).then(([profilesData, activeData]) => {
      setProfiles(profilesData || []);
      const activeName = typeof activeData === 'string' ? activeData : activeData?.profile || '';
      setActive(activeName);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [connection]);

  const switchProfile = async (name: string) => {
    if (name === active) return;
    const conn = connection;
    if (!conn) return;
    await dashboardPost(conn, 'profiles/active', { profile: name });
    setActive(name);
  };

  if (!connection) return null;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Agents</h2>
          <p style={styles.pageSubtitle}>Personas & agent bridge</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.center}><div style={styles.spinner} /></div>
      ) : (
        <div style={{ padding: '16px 24px', overflow: 'auto', flex: 1 }}>
          {/* Active persona */}
          <div style={styles.activeCard}>
            <div style={{ ...styles.avatar, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>
                {(profiles.find(p => p.name === active)?.name || active || '?')[0].toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.activeName}>{active || 'None active'}</div>
              <div style={styles.activeDesc}>
                {profiles.find(p => p.name === active)?.description || 'No description'}
              </div>
            </div>
            <div style={{ ...styles.statusDot, background: active ? 'var(--success)' : 'var(--textTertiary)' }} />
          </div>

          {/* Persona list */}
          <div style={{ marginTop: 24 }}>
            <div style={styles.sectionLabel}>Switch Persona</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {profiles.map((p, idx) => {
                const isActive = p.name === active;
                return (
                  <button
                    key={p.name}
                    onClick={() => switchProfile(p.name)}
                    style={{
                      ...styles.profileCard,
                      animationDelay: `${idx * 30}ms`,
                      borderColor: isActive ? 'rgba(212,175,55,0.3)' : 'var(--outline)',
                      background: isActive ? 'rgba(212,175,55,0.06)' : 'var(--surface)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: isActive ? 'var(--gold)' : 'var(--textPrimary)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--textTertiary)', marginTop: 2 }}>
                        {p.description}
                      </div>
                    </div>
                    {isActive && (
                      <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat bridge */}
          <div style={{ marginTop: 32 }}>
            <div style={styles.sectionLabel}>Chat With Hermes</div>
            <div style={{ ...styles.chatBox, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <ChatBridge />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatBridge() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const { connection } = useStore();
  const wsRef = useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (!connected || !connection) return;
    const protocol = connection.useHttps ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${connection.host}:${connection.port}/api/ws`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages(m => [...m, { role: 'assistant', content: data.content || data.message || JSON.stringify(data), timestamp: Date.now() }]);
      } catch {
        setMessages(m => [...m, { role: 'assistant', content: e.data, timestamp: Date.now() }]);
      }
    };
    ws.onopen = () => setMessages(m => [...m, { role: 'system', content: 'Connected to Hermes', timestamp: Date.now() }]);
    ws.onclose = () => setMessages(m => [...m, { role: 'system', content: 'Disconnected', timestamp: Date.now() }]);
    wsRef.current = ws;
    return () => ws.close();
  }, [connected, connection]);

  const send = () => {
    if (!input.trim() || !wsRef.current) return;
    const text = input.trim();
    setMessages(m => [...m, { role: 'user', content: text, timestamp: Date.now() }]);
    wsRef.current.send(JSON.stringify({ type: 'message', content: text }));
    setInput('');
  };

  if (!connected) {
    return (
      <button onClick={() => setConnected(true)} style={styles.connectBtn}>
        Connect to Hermes
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 300, gap: 10 }}>
      <div style={styles.messages}>
        {messages.map((m, i) => (
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
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--textTertiary)', padding: '40px 0', fontSize: 13 }}>
            Start a conversation with Hermes
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message Hermes..."
          style={styles.chatInput}
        />
        <button onClick={send} style={styles.sendBtn}>Send</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', animation: 'fadeIn 300ms ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 16px', borderBottom: '1px solid var(--outline)' },
  pageTitle: { fontSize: 26, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--textPrimary)' },
  pageSubtitle: { fontSize: 13, color: 'var(--textSecondary)', margin: 0 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  spinner: { width: 24, height: 24, border: '2px solid var(--outline)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  activeCard: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-xl)', padding: '18px 22px', transition: 'all 200ms ease' },
  avatar: { width: 42, height: 42, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activeName: { fontSize: 16, fontWeight: 600, color: 'var(--textPrimary)' },
  activeDesc: { fontSize: 13, color: 'var(--textSecondary)', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: '50%', boxShadow: '0 0 10px currentColor' },
  sectionLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--textSecondary)', marginBottom: 8 },
  profileCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid', animation: 'fadeIn 300ms ease both', transition: 'all 200ms ease' },
  connectBtn: { width: '100%', padding: '14px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms ease' },
  chatBox: { transition: 'all 200ms ease' },
  messages: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' },
  msg: { display: 'flex' },
  msgBubble: { maxWidth: '80%', padding: '10px 14px', borderRadius: 'var(--radius-lg)', fontSize: 13, lineHeight: 1.5 },
  chatInput: { flex: 1, background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--textPrimary)', fontSize: 14, outline: 'none' },
  sendBtn: { background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
