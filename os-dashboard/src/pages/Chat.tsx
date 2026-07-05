import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { apiGetList } from '../api/hermes';
import type { Message } from '../store/useStore';
import { Icon } from '../components/Icons';

export default function Chat({ session, onBack }: { session: any; onBack: () => void }) {
  const { connection, messages, setMessages, appendMessage, updateLastMessage, upsertToolProgress, isStreaming, setStreaming } = useStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async () => {
    if (!connection || !session) return;
    try {
      const data = await apiGetList(connection, `api/sessions/${session.id}/messages`);
      const parsed: Message[] = (data || []).map((m: any) => ({
        id: m.id || Math.random().toString(),
        role: m.role || 'assistant',
        content: m.content || '',
        timestamp: m.timestamp || Date.now() / 1000,
        toolCallId: m.tool_call_id,
        toolName: m.tool_name,
        status: m.status,
      }));
      setMessages(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [connection, session, setMessages]);

  useEffect(() => {
    if (session?.isNew) {
      setMessages([]);
      return;
    }
    loadMessages();
  }, [session?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !connection) return;
    const text = input.trim();
    setInput('');
    abortRef.current = new AbortController();

    appendMessage({ id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() / 1000 });
    appendMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: Date.now() / 1000 });
    setStreaming(true);
    setError('');

    try {
      const history = messages
        .filter(m => m.role !== 'tool_progress')
        .slice(-20)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const body = {
        model: session?.model || 'hermes-agent',
        messages: [...history, { role: 'user', content: text }],
        stream: true,
      };

      const baseUrl = `${connection.useHttps ? 'https' : 'http'}://${connection.host}:${connection.port}`;
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json',
          'X-Hermes-Session-Id': session.id,
        },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        while (buffer.includes('\n\n')) {
          const idx = buffer.indexOf('\n\n');
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          for (const line of frame.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.event === 'hermes.tool.progress' || parsed.tool) {
                upsertToolProgress({
                  id: parsed.toolCallId || Math.random().toString(),
                  role: 'tool_progress' as const,
                  content: parsed.content || '',
                  timestamp: Date.now() / 1000,
                  toolCallId: parsed.toolCallId,
                  toolName: parsed.tool,
                  status: parsed.status,
                });
                continue;
              }
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) updateLastMessage(delta);
            } catch { /* skip */ }
          }
        }
      }

      await loadMessages();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Send failed');
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <Icon.ArrowLeft size={20} />
        </button>
        <div style={styles.headerInfo}>
          <h2 style={styles.headerTitle}>{session?.title || 'Chat'}</h2>
          <div style={styles.headerMeta}>
            {session?.model || 'hermes-agent'}
            {isStreaming && <span style={styles.streamingBadge}>streaming</span>}
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={loadMessages} title="Refresh">
          <Icon.Refresh size={18} />
        </button>
      </div>

      {error && (
        <div style={styles.errorBar}>
          <Icon.AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <Icon.Chat size={40} />
            <p style={styles.emptyTitle}>Start a conversation</p>
            <p style={styles.emptyHint}>Send a message to begin chatting with Hermes</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: `fadeIn 200ms ease ${idx * 15}ms both`,
            }}
          >
            <div style={{
              ...styles.bubble,
              ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
              ...(msg.role === 'tool_progress' ? styles.toolBubble : {}),
            }}>
              {msg.role === 'tool_progress' && msg.toolName && (
                <div style={styles.toolLabel}>
                  <Icon.Zap size={12} />
                  <span>{msg.toolName}</span>
                  {msg.status && <span style={styles.toolStatus}>{msg.status}</span>}
                </div>
              )}
              <div style={styles.messageContent}>
                {msg.content ? renderMarkdown(msg.content) : (
                  msg.role === 'assistant' && idx === messages.length - 1 && isStreaming
                    ? <span style={styles.cursor}>▊</span>
                    : null
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputBar}>
        <div style={styles.inputWrapper}>
          <textarea
            style={styles.input}
            placeholder="Message Hermes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: (!input.trim() || isStreaming) ? 0.4 : 1,
            }}
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? (
              <div style={styles.miniSpinner} />
            ) : (
              <Icon.Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (!inCodeBlock) { inCodeBlock = true; codeLang = line.slice(3).trim(); codeContent = ''; continue; }
      else {
        inCodeBlock = false;
        elements.push(
          <div key={i} style={styles.codeBlock}>
            {codeLang && <div style={styles.codeLang}>{codeLang}</div>}
            <pre style={styles.codePre}>{escapeHtml(codeContent.trimEnd())}</pre>
          </div>
        );
        continue;
      }
    }
    if (inCodeBlock) { codeContent += line + '\n'; continue; }

    if (line.startsWith('# ')) elements.push(<div key={i} style={styles.h1}>{line.slice(2)}</div>);
    else if (line.startsWith('## ')) elements.push(<div key={i} style={styles.h2}>{line.slice(3)}</div>);
    else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<div key={i} style={styles.listItem}>• {line.slice(2)}</div>);
    else if (/^\d+\./.test(line)) elements.push(<div key={i} style={styles.listItem}>{line}</div>);
    else if (line.startsWith('> ')) elements.push(<div key={i} style={styles.quote}>{line.slice(2)}</div>);
    else if (line.trim() === '') elements.push(<div key={i} style={{ height: 8 }} />);
    else elements.push(<div key={i} style={styles.paragraph}>{renderInline(line)}</div>);
  }
  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const val = match[0];
    if (val.startsWith('**') && val.endsWith('**')) parts.push(<strong key={match.index} style={{ fontWeight: 600 }}>{val.slice(2, -2)}</strong>);
    else if (val.startsWith('*') && val.endsWith('*')) parts.push(<em key={match.index}>{val.slice(1, -1)}</em>);
    else if (val.startsWith('`')) parts.push(<code key={match.index} style={styles.inlineCode}>{val.slice(1, -1)}</code>);
    lastIdx = match.index + val.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length === 1 ? parts[0] : <span>{parts}</span>;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--outline)', background: 'var(--surface)', flexShrink: 0 },
  backBtn: { background: 'none', border: 'none', color: 'var(--textSecondary)', cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerMeta: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--textSecondary)', marginTop: 2 },
  streamingBadge: { fontSize: 10, color: 'var(--success)', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  refreshBtn: { background: 'none', border: 'none', color: 'var(--textSecondary)', cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' },
  errorBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' },
  messagesArea: { flex: 1, overflow: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--textTertiary)', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 15, fontWeight: 500, color: 'var(--textSecondary)', margin: 0 },
  emptyHint: { fontSize: 13, color: 'var(--textTertiary)', margin: 0 },
  messageRow: { display: 'flex', width: '100%' },
  bubble: { maxWidth: '82%', padding: '10px 14px', borderRadius: 'var(--radius-lg)', lineHeight: 1.55 },
  userBubble: { background: 'var(--gold)', color: '#000', borderBottomRightRadius: 'var(--radius-xs)' },
  assistantBubble: { background: 'var(--surfaceVariant)', color: 'var(--textPrimary)', borderBottomLeftRadius: 'var(--radius-xs)', border: '1px solid var(--outline)' },
  toolBubble: { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', maxWidth: '60%' },
  toolLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' },
  toolStatus: { color: 'var(--textTertiary)', textTransform: 'none', letterSpacing: 0, fontSize: 10 },
  messageContent: { fontSize: 14, wordBreak: 'break-word' },
  h1: { fontSize: 20, fontWeight: 700, margin: '12px 0 8px', color: 'var(--textPrimary)' },
  h2: { fontSize: 17, fontWeight: 600, margin: '10px 0 6px', color: 'var(--textPrimary)' },
  paragraph: { margin: '4px 0', fontSize: 14, lineHeight: 1.6 },
  listItem: { margin: '2px 0 2px 16px', fontSize: 14 },
  quote: { margin: '6px 0', padding: '6px 12px', borderLeft: '2px solid var(--gold)', color: 'var(--textSecondary)', fontStyle: 'italic', fontSize: 13 },
  inlineCode: { background: 'rgba(212,175,55,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', color: 'var(--goldBright)' },
  codeBlock: { background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', margin: '8px 0', overflow: 'hidden' },
  codeLang: { padding: '4px 10px', fontSize: 11, color: 'var(--textTertiary)', borderBottom: '1px solid var(--outline)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.04em' },
  codePre: { padding: 12, fontSize: 13, fontFamily: 'monospace', color: 'var(--textPrimary)', overflow: 'auto', margin: 0, lineHeight: 1.5 },
  cursor: { color: 'var(--gold)', animation: 'blink 1s step-end infinite', fontWeight: 400 },
  inputBar: { padding: '12px 16px', borderTop: '1px solid var(--outline)', background: 'var(--surface)', flexShrink: 0 },
  inputWrapper: { display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--surfaceVariant)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-lg)', padding: '4px 4px 4px 14px', transition: 'border-color 200ms ease' },
  input: { flex: 1, background: 'none', border: 'none', color: 'var(--textPrimary)', fontSize: 14, lineHeight: 1.5, resize: 'none', outline: 'none', maxHeight: 120, padding: '8px 0', fontFamily: 'inherit' },
  sendBtn: { width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--gold)', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 200ms ease' },
  miniSpinner: { width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
