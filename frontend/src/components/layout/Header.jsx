import React, { useState, useRef, useEffect } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCampaigns } from '../../hooks/useApi';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your campaign engine' },
  '/contacts': { title: 'Contacts', sub: 'Manage your contact database' },
  '/templates': { title: 'Templates', sub: 'Design reusable email templates' },
  '/campaigns': { title: 'Campaigns', sub: 'Build and send targeted campaigns' },
  '/sectors': { title: 'Sectors', sub: 'Organise contacts by sector' },
  '/extractor': { title: 'AI Extractor', sub: 'Auto-discover contacts from web sources' },
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const { data: campaigns = [] } = useCampaigns();
  const sending = campaigns.filter(c => c.status === 'sending');
  const current = Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k));
  const info = current?.[1] || { title: 'MailEngine', sub: '' };

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header style={{ position:'fixed', top:0, left:'var(--sidebar-w)', right:0, height:'var(--header-h)', background:'rgba(8,12,16,0.88)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', zIndex:40 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', fontWeight:800, lineHeight:1.2 }}>{info.title}</h1>
        <p style={{ fontSize:'11.5px', color:'var(--text-muted)', marginTop:2 }}>{info.sub}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/campaigns')}><Plus size={14} /> New Campaign</button>
        <div ref={notifRef} style={{ position:'relative' }}>
          <button className="btn btn-icon btn-secondary" onClick={() => setShowNotifs(p => !p)} style={{ position:'relative' }}>
            <Bell size={16} />
            {sending.length > 0 && <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'var(--accent)' }} />}
          </button>
          {showNotifs && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'0.5rem', width:300, boxShadow:'var(--shadow)', zIndex:200, animation:'fadeIn 0.15s ease' }}>
              <div style={{ padding:'0.5rem 0.75rem', fontSize:11.5, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Notifications</div>
              {sending.length > 0 ? sending.map(c => (
                <div key={c.id} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', padding:'0.6rem 0.75rem', borderRadius:'var(--radius)', cursor:'pointer' }}
                  onClick={() => { navigate('/campaigns'); setShowNotifs(false); }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span className="notif-dot" style={{ marginTop:4 }} />
                  <div>
                    <div style={{ fontSize:13, color:'var(--text-primary)' }}>"{c.name}" is sending</div>
                    <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:2 }}>{c.sent_count} / {c.recipients_count} sent</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding:'1.5rem 0.75rem', textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>No active notifications</div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
