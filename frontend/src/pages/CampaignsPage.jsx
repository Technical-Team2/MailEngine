import React, { useState } from 'react';
import {
  Plus, XCircle, Send, Clock, CheckCircle, Activity,
  Users, FileText, Calendar, ChevronRight, MoreHorizontal,
  Eye, Trash2, Play, Pause, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Q1 TVET Outreach', template: 'TVET Partnership Proposal', type: 'promotional', status: 'completed', recipients: 420, sent: 420, opened: 218, failed: 2, scheduled_at: '2025-01-15', created_at: '2025-01-13' },
  { id: 2, name: 'Hospital Newsletter Jan', template: 'Hospital Services Update', type: 'seasonal', status: 'sending', recipients: 280, sent: 140, opened: 67, failed: 0, scheduled_at: '2025-01-17', created_at: '2025-01-16' },
  { id: 3, name: 'NGO Partnership Drive', template: 'TVET Partnership Proposal', type: 'promotional', status: 'draft', recipients: 190, sent: 0, opened: 0, failed: 0, scheduled_at: null, created_at: '2025-01-18' },
  { id: 4, name: 'Seasonal Greetings 2025', template: 'Seasonal Greeting', type: 'seasonal', status: 'scheduled', recipients: 1200, sent: 0, opened: 0, failed: 0, scheduled_at: '2025-01-25', created_at: '2025-01-18' },
];

const STATUS_MAP = {
  completed: { cls: 'badge-green', icon: <CheckCircle size={10} />, label: 'Completed' },
  sending: { cls: 'badge-blue', icon: <Activity size={10} />, label: 'Sending' },
  draft: { cls: 'badge-gray', icon: <FileText size={10} />, label: 'Draft' },
  scheduled: { cls: 'badge-yellow', icon: <Clock size={10} />, label: 'Scheduled' },
  failed: { cls: 'badge-red', icon: <XCircle size={10} />, label: 'Failed' },
};

function CampaignWizard({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', template_id: '', type: 'promotional', recipient_filter: 'all',
    scheduled_at: '', cc_emails: '',
  });
  const [recipientMode, setRecipientMode] = useState('all_customers');

  const STEPS = ['Details', 'Template', 'Recipients', 'Review'];
  const TEMPLATES = ['TVET Partnership Proposal', 'Hospital Services Update', 'Seasonal Greeting'];
  const RECIPIENT_MODES = [
    { id: 'all_customers', label: 'All Customers', count: 850, icon: Users },
    { id: 'all_prospects', label: 'All Prospects', count: 600, icon: Users },
    { id: 'tvet', label: 'TVET Sector Only', count: 420, icon: Users },
    { id: 'hospitals', label: 'Hospitals Only', count: 280, icon: Users },
    { id: 'ngos', label: 'NGOs Only', count: 190, icon: Users },
    { id: 'all', label: 'All Contacts', count: 1450, icon: Users },
  ];

  const selectedRecipients = RECIPIENT_MODES.find(m => m.id === recipientMode);

  const handleSend = () => {
    onSave({ ...form, recipient_mode: recipientMode, recipients: selectedRecipients?.count, status: 'scheduled' });
    toast.success('Campaign created and queued!');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">Create Campaign</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--accent)' : 'var(--bg-hover)',
                  color: step >= i + 1 ? '#080c10' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s',
                }}>{step > i + 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="modal-body">
          {/* Step 1 - Details */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Campaign Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Q1 TVET Outreach" />
              </div>
              <div className="form-group">
                <label className="form-label">Campaign Type</label>
                <div className="form-row" style={{ gap: '0.75rem' }}>
                  {[
                    { id: 'promotional', label: 'Promotional', desc: 'Sales, offers, partnerships' },
                    { id: 'seasonal', label: 'Seasonal', desc: 'Holidays, events, milestones' },
                  ].map((t) => (
                    <div key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))} style={{
                      padding: '1rem', borderRadius: 'var(--radius)',
                      border: `1px solid ${form.type === t.id ? 'var(--border-active)' : 'var(--border)'}`,
                      background: form.type === t.id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule Date (Optional)</label>
                <input type="datetime-local" className="form-input" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                <span className="form-hint">Leave empty to send immediately after review</span>
              </div>
            </>
          )}

          {/* Step 2 - Template */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="form-label">Select Template</label>
              {TEMPLATES.map((t) => (
                <div key={t} onClick={() => setForm(p => ({ ...p, template_id: t }))} style={{
                  padding: '1rem',
                  border: `1px solid ${form.template_id === t ? 'var(--border-active)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  background: form.template_id === t ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: form.template_id === t ? 'var(--accent)' : 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={16} color={form.template_id === t ? '#080c10' : 'var(--text-muted)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Variables: name, organization</div>
                  </div>
                  {form.template_id === t && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                </div>
              ))}
            </div>
          )}

          {/* Step 3 - Recipients */}
          {step === 3 && (
            <div>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Select Recipients</label>
              <div className="grid grid-2" style={{ gap: '0.75rem' }}>
                {RECIPIENT_MODES.map(({ id, label, count }) => (
                  <div key={id} onClick={() => setRecipientMode(id)} style={{
                    padding: '1rem',
                    border: `1px solid ${recipientMode === id ? 'var(--border-active)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    background: recipientMode === id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{count.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>contacts</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 - Review */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Summary</div>
                {[
                  ['Name', form.name || '—'],
                  ['Type', form.type],
                  ['Template', form.template_id || '—'],
                  ['Recipients', `${selectedRecipients?.label} (${selectedRecipients?.count?.toLocaleString()})`],
                  ['Schedule', form.scheduled_at || 'Send immediately'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <CheckCircle size={15} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Emails will be sent in batches of 50 with a 5-second delay between batches. All sending is handled asynchronously.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.name}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSend}>
              <Send size={14} /> Launch Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);

  const filtered = campaigns.filter(c => filter === 'all' || c.status === filter);

  const deleteCampaign = (id) => {
    setCampaigns(p => p.filter(c => c.id !== id));
    toast.success('Campaign deleted');
    setOpenMenu(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Campaigns</h2>
          <p className="page-subtitle">{campaigns.length} campaigns · {campaigns.filter(c => c.status === 'sending').length} active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Sent', value: campaigns.reduce((a, c) => a + c.sent, 0).toLocaleString(), color: 'cyan' },
          { label: 'Total Opened', value: campaigns.reduce((a, c) => a + c.opened, 0).toLocaleString(), color: 'green' },
          { label: 'Total Recipients', value: campaigns.reduce((a, c) => a + c.recipients, 0).toLocaleString(), color: 'orange' },
          { label: 'Avg Open Rate', value: '54.2%', color: 'yellow' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="tabs">
        {['all', 'draft', 'scheduled', 'sending', 'completed'].map(s => (
          <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span style={{
              marginLeft: 6, fontSize: 11,
              background: filter === s ? 'var(--accent-dim)' : 'var(--bg-hover)',
              color: filter === s ? 'var(--accent)' : 'var(--text-muted)',
              padding: '1px 7px', borderRadius: 99,
            }}>
              {s === 'all' ? campaigns.length : campaigns.filter(c => c.status === s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Send size={40} className="empty-icon" />
            <span className="empty-title">No campaigns yet</span>
            <span className="empty-desc">Create your first campaign to start sending targeted emails.</span>
          </div>
        ) : filtered.map((c) => {
          const st = STATUS_MAP[c.status];
          const openRate = c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0;
          const progress = c.recipients > 0 ? Math.round((c.sent / c.recipients) * 100) : 0;

          return (
            <div key={c.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                <div className="flex items-center gap-2">
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: c.status === 'completed' ? 'var(--success-dim)' : c.status === 'sending' ? 'var(--accent-dim)' : 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {c.status === 'sending' ? <Activity size={16} color="var(--accent)" /> : <Send size={16} color="var(--text-muted)" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.template}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${st.cls}`}>{st.icon}{st.label}</span>
                  <span className={`badge ${c.type === 'promotional' ? 'badge-orange' : 'badge-blue'}`}>{c.type}</span>
                  <div className="dropdown">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}>
                      <MoreHorizontal size={15} />
                    </button>
                    {openMenu === c.id && (
                      <div className="dropdown-menu">
                        <div className="dropdown-item"><Eye size={13} />View Details</div>
                        {c.status === 'draft' && <div className="dropdown-item"><Play size={13} />Send Now</div>}
                        {c.status === 'scheduled' && <div className="dropdown-item"><Pause size={13} />Pause</div>}
                        <div className="dropdown-divider" />
                        <div className="dropdown-item danger" onClick={() => deleteCampaign(c.id)}><Trash2 size={13} />Delete</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-2" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Recipients', value: c.recipients.toLocaleString() },
                  { label: 'Sent', value: c.sent.toLocaleString() },
                  { label: 'Opened', value: c.opened.toLocaleString() },
                  { label: 'Open Rate', value: `${openRate}%`, color: openRate > 40 ? 'var(--success)' : 'var(--text-primary)' },
                  { label: 'Failed', value: c.failed, color: c.failed > 0 ? 'var(--danger)' : null },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '0.5rem 0.875rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
                {c.scheduled_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    <Calendar size={12} />
                    {c.scheduled_at}
                  </div>
                )}
              </div>

              {/* Progress bar (for sending) */}
              {c.status === 'sending' && (
                <div>
                  <div className="flex justify-between" style={{ marginBottom: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Sending progress</span>
                    <span>{progress}% — {c.sent.toLocaleString()} of {c.recipients.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showWizard && (
        <CampaignWizard
          onClose={() => setShowWizard(false)}
          onSave={(c) => setCampaigns(p => [...p, { ...c, id: Date.now(), created_at: new Date().toISOString().split('T')[0], sent: 0, opened: 0, failed: 0 }])}
        />
      )}
    </div>
  );
}
