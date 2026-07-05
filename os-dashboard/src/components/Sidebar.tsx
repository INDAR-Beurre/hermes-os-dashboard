import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, Database, Puzzle, Settings, Power } from 'lucide-react';

const navItems = [
  { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/cron', label: 'Cron Jobs', icon: Clock },
  { path: '/memory', label: 'Memory', icon: Database },
  { path: '/skills', label: 'Skills', icon: Puzzle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  connectionLabel: string;
  onDisconnect: () => void;
}

export default function Sidebar({ connectionLabel, onDisconnect }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/sessions') return location.pathname === '/sessions' || location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.logoMark}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <div>
          <div style={styles.brandName}>Hermes</div>
          <div style={styles.brandSub}>{connectionLabel}</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              <span style={styles.navLabel}>{item.label}</span>
              {active && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button style={styles.disconnectBtn} onClick={onDisconnect}>
          <Power size={16} />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220, height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--outline)',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 16px',
    borderBottom: '1px solid var(--outline)',
  },
  logoMark: {
    width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(212,175,55,0.08)',
    border: '1px solid rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  brandName: {
    fontSize: 15, fontWeight: 700, color: 'var(--textPrimary)', letterSpacing: '0.02em',
    background: 'linear-gradient(135deg, var(--gold), var(--goldBright))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  brandSub: {
    fontSize: 11, color: 'var(--textTertiary)', marginTop: 2, overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
  },
  nav: {
    flex: 1, overflow: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'none',
    border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--textSecondary)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms ease',
    position: 'relative', width: '100%', textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(212,175,55,0.08)', color: 'var(--gold)',
  },
  navLabel: { flex: 1 },
  activeIndicator: {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    width: 3, height: 16, borderRadius: 2, background: 'var(--gold)',
  },
  footer: {
    padding: '12px 8px', borderTop: '1px solid var(--outline)',
  },
  disconnectBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px',
    background: 'none', border: '1px solid var(--outline)', borderRadius: 'var(--radius-md)',
    color: 'var(--textSecondary)', fontSize: 13, cursor: 'pointer', transition: 'all 150ms ease',
  },
};
