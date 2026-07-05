import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Connect from './pages/Connect';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Kanban from './pages/Kanban';
import Agents from './pages/Agents';
import Logs from './pages/Logs';
import Config from './pages/Config';
import Vault from './pages/Vault';
import Cron from './pages/Cron';
import Memory from './pages/Memory';
import Skills from './pages/Skills';
import Settings from './pages/Settings';
import { useStore } from './store/useStore';
import type { Session } from './store/useStore';

const TAB_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/sessions', label: 'Chat', icon: 'chat' },
  { path: '/kanban', label: 'Tasks', icon: 'kanban' },
  { path: '/agents', label: 'Agents', icon: 'agents' },
  { path: '/settings', label: 'More', icon: 'settings' },
];

const HIDDEN_TABS = ['/chat', '/logs', '/config', '/vault', '/cron', '/memory', '/skills'];

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--gold)' : 'var(--text-tertiary)';
  switch (name) {
    case 'home':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'chat':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case 'kanban':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" />
        </svg>
      );
    case 'agents':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 00-16 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const connection = useStore((s) => s.connection);
  const setConnection = useStore((s) => s.setConnection);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  if (!connection) {
    return <Connect onConnect={setConnection} />;
  }

  const handleSelectSession = (session: Session) => {
    setCurrentSession(session);
    navigate('/chat');
  };

  const handleBackToSessions = () => {
    setCurrentSession(null);
    navigate('/sessions');
  };

  const showTabBar = !HIDDEN_TABS.includes(location.pathname) && !currentSession;

  const currentTab = TAB_ITEMS.find(t => t.path === location.pathname) || TAB_ITEMS[0];

  return (
    <div style={styles.root}>
      <main style={styles.main}>
        {currentSession && location.pathname === '/chat' ? (
          <Chat session={currentSession} onBack={handleBackToSessions} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions onSelectSession={handleSelectSession} />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/config" element={<Config />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/cron" element={<Cron />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/settings" element={<Settings onDisconnect={() => { setConnection(null); navigate('/'); }} />} />
          </Routes>
        )}
      </main>

      {showTabBar && (
        <nav style={styles.tabBar}>
          {TAB_ITEMS.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={styles.tabItem}
              >
                <TabIcon name={tab.icon} active={active} />
                <span style={{
                  ...styles.tabLabel,
                  color: active ? 'var(--gold)' : 'var(--text-tertiary)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      <Toaster richColors position="top-center" />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--background)',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tabBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 72,
    paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    background: 'rgba(14, 14, 14, 0.92)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTop: '1px solid var(--outline)',
    flexShrink: 0,
  },
  tabItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: '0.02em',
    transition: 'all 150ms ease',
  },
};
