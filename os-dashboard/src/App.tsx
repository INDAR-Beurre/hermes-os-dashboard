import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Connect from './pages/Connect';
import Sessions from './pages/Sessions';
import Chat from './pages/Chat';
import Cron from './pages/Cron';
import Memory from './pages/Memory';
import Skills from './pages/Skills';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Agents from './pages/Agents';
import Logs from './pages/Logs';
import Config from './pages/Config';
import Vault from './pages/Vault';
import { useStore } from './store/useStore';
import type { Session } from './store/useStore';

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
          <Chat session={currentSession} onBack={handleBackToSessions} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions onSelectSession={handleSelectSession} />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/cc" element={<ClaudeCode />} />
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
      <Toaster richColors position="top-right" />
    </div>
  );
}
