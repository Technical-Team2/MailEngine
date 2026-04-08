import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Mail, FileText, Tag,
  Settings, ChevronRight, Zap, LogOut, Bot
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Contacts', path: '/contacts', icon: Users },
  { label: 'Templates', path: '/templates', icon: FileText },
  { label: 'Campaigns', path: '/campaigns', icon: Mail },
  { label: 'Sectors', path: '/sectors', icon: Tag },
  { label: 'AI Extractor', path: '/extractor', icon: Bot },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="sidebar" style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-w)',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: '10px',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={20} color="#080c10" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>
            MailEngine
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Campaign System</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.75rem', marginBottom: 4 }}>
          Main Navigation
        </div>
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(0,229,255,0.15)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13.5px',
                transition: 'all 0.15s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              <Icon size={16} />
              {label}
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-elevated)',
          marginBottom: '0.5rem',
        }}>
          <div className="avatar">{user?.name?.[0] || 'A'}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Admin User'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role || 'admin'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', fontSize: 13 }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
