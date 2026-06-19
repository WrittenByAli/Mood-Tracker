import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { to: '/log', label: 'Log', icon: '✚' },
  { to: '/history', label: 'History', icon: '☰' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
  { to: '/achievements', label: 'Achievements', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

function NavItem({ to, label, icon, end }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '0.6rem 0.75rem',
            borderRadius: 10,
            color: isActive ? '#00f5ff' : 'var(--text-muted)',
            background: isActive ? 'rgba(0,245,255,0.12)' : 'transparent',
            border: isActive ? '1px solid rgba(0,245,255,0.35)' : '1px solid transparent',
            boxShadow: isActive ? '0 0 16px rgba(0,245,255,0.2)' : 'none',
            transition: 'all 0.2s',
            minWidth: 64,
          }}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{icon}</span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.5rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
}

export default function NavShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="nav-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          background: 'rgba(3,5,8,0.92)',
          borderRight: '1px solid rgba(0,245,255,0.15)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          padding: '1.25rem 0.75rem',
        }}
      >
        <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              background: 'linear-gradient(90deg, #00f5ff, #ff00aa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.12em',
            }}
          >
            MOODTRACK
          </h2>
          {user && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {user.username || user.email}
            </p>
          )}
        </div>

        <nav
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: '1rem',
            overflowY: 'auto',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <motion.button
          type="button"
          className="btn btn-secondary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          style={{ margin: '0.5rem', fontSize: '0.65rem', padding: '0.6rem' }}
        >
          Logout
        </motion.button>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="nav-bottom"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--nav-height)',
          background: 'rgba(3,5,8,0.95)',
          borderTop: '1px solid rgba(0,245,255,0.15)',
          backdropFilter: 'blur(20px)',
          display: 'none',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 100,
          padding: '0 0.5rem',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <style>{`
        @media (max-width: 900px) {
          .nav-sidebar { display: none !important; }
          .nav-bottom { display: flex !important; }
        }
        @media (min-width: 901px) {
          .nav-sidebar { display: flex !important; }
          .nav-bottom { display: none !important; }
        }
      `}</style>

      <main className="with-nav">{children}</main>
    </>
  );
}
