import React, { useState } from 'react';
import { Bell, Search, Moon, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your campaign engine' },
  '/contacts': { title: 'Contacts', sub: 'Manage your contact database' },
  '/templates': { title: 'Templates', sub: 'Design reusable email templates' },
  '/campaigns': { title: 'Campaigns', sub: 'Build and send targeted campaigns' },
  '/sectors': { title: 'Sectors', sub: 'Organize contacts by sector' },
  '/extractor': { title: 'AI Extractor', sub: 'Auto-discover contacts from web sources' },
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const current = Object.entries(PAGE_TITLES).find(([key]) => location.pathname.startsWith(key));
  const info = current?.[1] || { title: 'MailEngine', sub: '' };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-w)',
      right: 0,
      height: 'var(--header-h)',
      background: 'rgba(8, 12, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 40,
    }}>
      {/* Left - page info */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>
          {info.title}
        </h1>
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>{info.sub}</p>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Quick Create */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/campaigns/new')}
          >
            <Plus size={14} />
            New Campaign
          </button>
        </div>

        {/* Notifications */}
        <button
          className="btn btn-icon btn-secondary"
          style={{ position: 'relative' }}
          onClick={() => setShowNotifs(p => !p)}
        >
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
          }} />
        </button>

        {showNotifs && (
          <div style={{
            position: 'absolute',
            top: '56px',
            right: '2rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.5rem',
            width: 300,
            boxShadow: 'var(--shadow)',
            zIndex: 200,
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{ padding: '0.6rem 0.75rem', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Notifications
            </div>
            {[
              { msg: 'Campaign "Q1 Outreach" completed', time: '2 min ago', color: 'var(--success)' },
              { msg: '145 contacts imported successfully', time: '1 hr ago', color: 'var(--accent)' },
              { msg: 'New sector approval pending', time: '3 hrs ago', color: 'var(--warning)' },
            ].map((n, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{n.msg}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
