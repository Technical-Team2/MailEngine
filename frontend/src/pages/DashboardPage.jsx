import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, FileText, Send, ArrowRight, Activity, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats, useCampaigns } from '../hooks/useApi';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 8, fontSize: 13, color: p.color }}>
          <span style={{ textTransform: 'capitalize' }}>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const statusBadge = (s) => {
  const map = {
    completed: ['badge-green', <CheckCircle size={10} key="i" />, 'Completed'],
    sending: ['badge-blue', <Activity size={10} key="i" />, 'Sending'],
    draft: ['badge-gray', <Clock size={10} key="i" />, 'Draft'],
    scheduled: ['badge-yellow', <Clock size={10} key="i" />, 'Scheduled'],
    failed: ['badge-red', null, 'Failed'],
  };
  const [cls, icon, label] = map[s] || map.draft;
  return <span className={`badge ${cls}`}>{icon}{label}</span>;
};

function Skeleton({ w = '100%', h = 20 }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 6 }} />;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();

  const recentCampaigns = (campaigns || []).slice(0, 5);

  // Build a simple chart from campaign stats (sent per campaign)
  const chartData = (campaigns || [])
    .filter(c => c.sent_count > 0)
    .slice(0, 7)
    .map(c => ({ name: c.name.slice(0, 12), sent: c.sent_count, failed: c.failed_count }))
    .reverse();

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Contacts', value: stats?.contacts?.total ?? '—', sub: `${stats?.contacts?.active ?? 0} active`, icon: Users, color: 'cyan' },
          { label: 'Campaigns', value: stats?.campaigns?.total ?? '—', sub: `${stats?.campaigns?.sending ?? 0} sending`, icon: Mail, color: 'orange' },
          { label: 'Templates', value: stats?.templates?.total ?? '—', sub: 'ready to use', icon: FileText, color: 'green' },
          { label: 'Emails Sent', value: stats?.emails?.sent ?? '—', sub: `${stats?.emails?.failed ?? 0} failed`, icon: Send, color: 'yellow' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}><Icon size={18} /></div>
            <div>
              {statsLoading ? <Skeleton h={32} w={80} /> : <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>}
              <div className="stat-label">{label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Activity chart */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem' }}>Campaign Performance</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>Sent vs failed emails by campaign</p>
            </div>
            <div className="flex gap-1">
              <span className="badge badge-blue">Sent</span>
              <span className="badge badge-red">Failed</span>
            </div>
          </div>
          {campaignsLoading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="spinner spinner-lg" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <Activity size={32} className="empty-icon" />
              <span className="empty-title">No sent campaigns yet</span>
              <span className="empty-desc">Create and send a campaign to see data here.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-sent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-failed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4560" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ff4560" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sent" stroke="#00e5ff" strokeWidth={2} fill="url(#g-sent)" />
                <Area type="monotone" dataKey="failed" stroke="#ff4560" strokeWidth={2} fill="url(#g-failed)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'New Campaign', path: '/campaigns', icon: Mail, color: 'var(--accent)' },
                { label: 'Import Contacts', path: '/contacts', icon: Users, color: 'var(--accent-2)' },
                { label: 'Create Template', path: '/templates', icon: FileText, color: 'var(--success)' },
                { label: 'AI Extractor', path: '/extractor', icon: Activity, color: 'var(--warning)' },
              ].map(({ label, path, icon: Icon, color }) => (
                <Link key={label} to={path} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <Icon size={15} style={{ color }} />
                  {label}
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Delivery health */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Delivery Health</h3>
            {statsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={16} /><Skeleton h={16} /><Skeleton h={16} />
              </div>
            ) : (() => {
              const sent = stats?.emails?.sent || 0;
              const failed = stats?.emails?.failed || 0;
              const total = sent + failed;
              const delivRate = total > 0 ? Math.round((sent / total) * 100) : 0;
              const failRate = total > 0 ? Math.round((failed / total) * 100) : 0;
              return [
                { label: 'Delivered', val: delivRate, color: 'var(--success)' },
                { label: 'Failed', val: failRate, color: 'var(--danger)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ marginBottom: '0.75rem' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color }}>{val}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${val}%`, background: color }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Recent campaigns table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.95rem' }}>Recent Campaigns</h3>
          <Link to="/campaigns" className="btn btn-ghost btn-sm">View all <ArrowRight size={13} /></Link>
        </div>
        {campaignsLoading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} h={20} />)}
          </div>
        ) : recentCampaigns.length === 0 ? (
          <div className="empty-state">
            <Mail size={36} className="empty-icon" />
            <span className="empty-title">No campaigns yet</span>
            <span className="empty-desc">
              <Link to="/campaigns" style={{ color: 'var(--accent)' }}>Create your first campaign</Link>
            </span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Campaign</th><th>Status</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Created</th></tr>
            </thead>
            <tbody>
              {recentCampaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.recipients_count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)' }}>{c.sent_count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: c.failed_count > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{c.failed_count}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
