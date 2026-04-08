import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Mail, FileText, TrendingUp, Send, Clock,
  CheckCircle, XCircle, ArrowRight, BarChart2, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const areaData = [
  { day: 'Mon', sent: 320, opened: 180 },
  { day: 'Tue', sent: 480, opened: 260 },
  { day: 'Wed', sent: 280, opened: 140 },
  { day: 'Thu', sent: 590, opened: 310 },
  { day: 'Fri', sent: 720, opened: 420 },
  { day: 'Sat', sent: 180, opened: 90 },
  { day: 'Sun', sent: 240, opened: 130 },
];

const barData = [
  { sector: 'TVET', contacts: 420 },
  { sector: 'Hospitals', contacts: 280 },
  { sector: 'NGOs', contacts: 190 },
  { sector: 'Schools', contacts: 350 },
  { sector: 'Corporates', contacts: 210 },
];

const COLORS = ['#00e5ff', '#ff6b35', '#00d68f', '#ffb020', '#7c3aed'];

const recentCampaigns = [
  { name: 'Q1 TVET Outreach', status: 'completed', sent: 420, opened: 218, date: 'Jan 15, 2025' },
  { name: 'Hospital Newsletter', status: 'sending', sent: 140, opened: 67, date: 'Jan 17, 2025' },
  { name: 'NGO Partnership Drive', status: 'draft', sent: 0, opened: 0, date: 'Jan 18, 2025' },
  { name: 'Seasonal Greetings', status: 'scheduled', sent: 0, opened: 0, date: 'Jan 20, 2025' },
];

const statusBadge = (s) => {
  const map = {
    completed: ['badge-green', <CheckCircle size={10} key="i" />, 'Completed'],
    sending: ['badge-blue', <Activity size={10} key="i" />, 'Sending'],
    draft: ['badge-gray', <Clock size={10} key="i" />, 'Draft'],
    scheduled: ['badge-yellow', <Clock size={10} key="i" />, 'Scheduled'],
    failed: ['badge-red', <XCircle size={10} key="i" />, 'Failed'],
  };
  const [cls, icon, label] = map[s] || map.draft;
  return <span className={`badge ${cls}`}>{icon}{label}</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', gap: 8, fontSize: 13, color: p.color }}>
          <span style={{ textTransform: 'capitalize' }}>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Contacts', value: '1,450', trend: '+12%', icon: Users, color: 'cyan' },
          { label: 'Campaigns Sent', value: '38', trend: '+5', icon: Send, color: 'orange' },
          { label: 'Templates', value: '12', trend: '+3', icon: FileText, color: 'green' },
          { label: 'Open Rate', value: '54.2%', trend: '+2.1%', icon: TrendingUp, color: 'yellow' },
        ].map(({ label, value, trend, icon: Icon, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="flex items-center justify-between">
              <div className={`stat-icon ${color}`}><Icon size={18} /></div>
              <span className="stat-trend">{trend}</span>
            </div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 380px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Area chart */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem' }}>Email Activity</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>Sent vs opened — last 7 days</p>
            </div>
            <div className="flex gap-1">
              <span className="badge badge-blue">Sent</span>
              <span className="badge badge-green">Opened</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d68f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sent" stroke="#00e5ff" strokeWidth={2} fill="url(#sent)" />
              <Area type="monotone" dataKey="opened" stroke="#00d68f" strokeWidth={2} fill="url(#opened)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>Contacts by Sector</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>Distribution overview</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="sector" type="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="contacts" radius={[0, 4, 4, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Campaigns + Quick Actions */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* Recent campaigns */}
        <div className="card" style={{ padding: 0 }}>
          <div className="flex items-center justify-between" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.95rem' }}>Recent Campaigns</h3>
            <Link to="/campaigns" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Opened</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map((c) => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.sent.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {c.opened > 0 ? (
                      <span style={{ color: 'var(--success)' }}>{c.opened}</span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'New Campaign', path: '/campaigns/new', icon: Mail, color: 'var(--accent)' },
                { label: 'Import Contacts', path: '/contacts?action=import', icon: Users, color: 'var(--accent-2)' },
                { label: 'Create Template', path: '/templates/new', icon: FileText, color: 'var(--success)' },
                { label: 'Run AI Extractor', path: '/extractor', icon: BarChart2, color: 'var(--warning)' },
              ].map(({ label, path, icon: Icon, color }) => (
                <Link key={label} to={path} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.7rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                >
                  <Icon size={15} style={{ color }} />
                  {label}
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Campaign health */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Delivery Health</h3>
            {[
              { label: 'Delivered', val: 94.2, color: 'var(--success)' },
              { label: 'Bounced', val: 3.8, color: 'var(--danger)' },
              { label: 'Unsubscribed', val: 2.0, color: 'var(--warning)' },
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
