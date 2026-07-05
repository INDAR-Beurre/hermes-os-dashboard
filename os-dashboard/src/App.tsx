import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import ConnectPage from './pages/Connect';
import SessionsPage from './pages/Sessions';
import ChatPage from './pages/Chat';
import CronPage from './pages/Cron';
import MemoryPage from './pages/Memory';
import SkillsPage from './pages/Skills';
import SettingsPage from './pages/Settings';
import { useStore } from './store/useStore';
import type { Session } from './store/useStore';

const navItems = [
  { path: '/sessions', label: 'Sessions', icon: 'MessageSquare' },
  { path: '/cron', label: 'Cron Jobs', icon: 'Clock' },
  { path: '/memory', label: 'Memory', icon: 'Database' },
  { path: '/skills', label: 'Skills', icon: 'Puzzle' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const connection = useStore((s) => s.connection);
  const setConnection = useStore((s) => s.setConnection);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  if (!connection) {
    return <ConnectPage onConnect={setConnection} />;
  }

  const handleSelectSession = (session: Session) => {
    setCurrentSession(session);
    navigate('/chat');
  };

  const handleBackToSessions = () => {
    setCurrentSession(null);
    navigate('/sessions');
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        connectionLabel={connection.label}
        onDisconnect={() => {
          setConnection(null);
          setCurrentSession(null);
          navigate('/');
        }}
      />
      <main className="flex-1 overflow-auto bg-[var(--background)]">
        {currentSession && location.pathname === '/chat' ? (
          <ChatPage session={currentSession} onBack={handleBackToSessions} />
        ) : (
          <Routes>
            <Route path="/sessions" element={<SessionsPage onSelectSession={handleSelectSession} />} />
            <Route path="/cron" element={<CronPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/settings" element={<SettingsPage onDisconnect={() => { setConnection(null); navigate('/'); }} />} />
            <Route path="/" element={<SessionsPage onSelectSession={handleSelectSession} />} />
          </Routes>
        )}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
