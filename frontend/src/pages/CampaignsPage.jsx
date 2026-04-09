import React, { useState } from 'react';
import { Plus, XCircle, Send, Clock, CheckCircle, Activity, FileText, Calendar, ChevronRight, MoreHorizontal, Trash2, Users } from 'lucide-react';
import { useCampaigns, useCreateCampaign, useSetRecipients, useSendCampaign, useDeleteCampaign, useTemplates, useSectors, useContacts } from '../hooks/useApi';

const STATUS_MAP = {
  completed: { cls: 'badge-green', icon: <CheckCircle size={10} />, label: 'Completed' },
  sending: { cls: 'badge-blue', icon: <Activity size={10} />, label: 'Sending' },
  draft: { cls: 'badge-gray', icon: <FileText size={10} />, label: 'Draft' },
  scheduled: { cls: 'badge-yellow', icon: <Clock size={10} />, label: 'Scheduled' },
  failed: { cls: 'badge-red', icon: <XCircle size={10} />, label: 'Failed' },
};

function CampaignWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [campaignId, setCampaignId] = useState(null);
  const [form, setForm] = useState({ name: '', template_id: '', type: 'promotional', scheduled_at: '' });
  const [recipientMode, setRecipientMode] = useState('all');
  const [sectorId, setSectorId] = useState('');

  const { data: templates = [] } = useTemplates();
  const { data: sectors = [] } = useSectors({ status: 'approved' });
  const { data: contactsData } = useContacts({ per_page: 1 });

  const createCampaign = useCreateCampaign();
  const setRecipients = useSetRecipients();
  const sendCampaign = useSendCampaign();

  const STEPS = ['Details', 'Template', 'Recipients', 'Review & Send'];

  const totalContacts = contactsData?.total || 0;
  const RECIPIENT_MODES = [
    { id: 'all', label: 'All Active Contacts', filter: {} },
    { id: 'customers', label: 'Customers Only', filter: { type: 'customer' } },
    { id: 'prospects', label: 'Prospects Only', filter: { type: 'prospect' } },
    { id: 'sector', label: 'By Sector', filter: { sector_id: sectorId } },
  ];

  const getFilter = () => {
    const mode = RECIPIENT_MODES.find(m => m.id === recipientMode);
    return mode?.filter || {};
  };

  const selectedTemplate = templates.find(t => t.id === form.template_id);

  const handleNext = async () => {
    if (step === 1) {
      // Step 1 → 2: just validate name
      if (!form.name.trim()) return;
      setStep(2);
    } else if (step === 2) {
      if (!form.template_id) return;
      setStep(3);
    } else if (step === 3) {
      // Step 3 → 4: create campaign + set recipients
      try {
        const payload = { name: form.name, template_id: form.template_id, type: form.type };
        if (form.scheduled_at) payload.scheduled_at = form.scheduled_at;
        const camp = await createCampaign.mutateAsync(payload);
        setCampaignId(camp.id);
        const filter = getFilter();
        if (recipientMode === 'sector' && !sectorId) {
          alert('Please select a sector');
          return;
        }
        await setRecipients.mutateAsync({ id: camp.id, filter });
        setStep(4);
      } catch (_) {}
    } else if (step === 4) {
      // Send
      try {
        await sendCampaign.mutateAsync(campaignId);
        onClose();
      } catch (_) {}
    }
  };

  const loading = createCampaign.isPending || setRecipients.isPending || sendCampaign.isPending;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">New Campaign</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>

        {/* Steps */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--accent)' : 'var(--bg-hover)', color: step >= i + 1 ? '#080c10' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="modal-body">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Q1 TVET Outreach" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="form-row">
                  {[{ id: 'promotional', label: 'Promotional', desc: 'Sales, offers, partnerships' }, { id: 'seasonal', label: 'Seasonal', desc: 'Holidays, events' }].map(t => (
                    <div key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))} style={{ padding: '0.875rem', borderRadius: 'var(--radius)', border: `1px solid ${form.type === t.id ? 'var(--border-active)' : 'var(--border)'}`, background: form.type === t.id ? 'var(--accent-dim)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule (optional)</label>
                <input type="datetime-local" className="form-input" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                <span className="form-hint">Leave empty to send immediately after review</span>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <label className="form-label">Select a Template *</label>
              {templates.length === 0 ? (
                <div className="empty-state"><span className="empty-title">No templates yet.</span><span className="empty-desc">Create a template first.</span></div>
              ) : templates.map(t => (
                <div key={t.id} onClick={() => setForm(p => ({ ...p, template_id: t.id }))} style={{ padding: '1rem', border: `1px solid ${form.template_id === t.id ? 'var(--border-active)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: form.template_id === t.id ? 'var(--accent-dim)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={16} style={{ color: form.template_id === t.id ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.subject}</div>
                  </div>
                  {form.template_id === t.id && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                </div>
              ))}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>Select Recipients ({totalContacts} total contacts)</label>
              <div className="grid grid-2" style={{ gap: '0.625rem' }}>
                {RECIPIENT_MODES.map(({ id, label }) => (
                  <div key={id} onClick={() => setRecipientMode(id)} style={{ padding: '0.875rem', border: `1px solid ${recipientMode === id ? 'var(--border-active)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: recipientMode === id ? 'var(--accent-dim)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={14} style={{ color: recipientMode === id ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: recipientMode === id ? 600 : 400 }}>{label}</span>
                    {recipientMode === id && <CheckCircle size={13} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                  </div>
                ))}
              </div>
              {recipientMode === 'sector' && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Choose Sector</label>
                  <select className="form-select" value={sectorId} onChange={e => setSectorId(e.target.value)}>
                    <option value="">— Select sector —</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Summary</div>
                {[
                  ['Name', form.name],
                  ['Type', form.type],
                  ['Template', selectedTemplate?.name || '—'],
                  ['Recipients', RECIPIENT_MODES.find(m => m.id === recipientMode)?.label || '—'],
                  ['Schedule', form.scheduled_at ? new Date(form.scheduled_at).toLocaleString() : 'Send immediately'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <CheckCircle size={14} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Emails will be sent asynchronously in batches of 50 with a 5-second delay between batches.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button className="btn btn-primary" onClick={handleNext} disabled={loading || (step === 1 && !form.name.trim()) || (step === 2 && !form.template_id)}>
            {loading ? <span className="spinner" /> : step < 4 ? <>Next <ChevronRight size={14} /></> : <><Send size={14} /> Launch Campaign</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState('all');
  const [showWizard, setShowWizard] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const { data: campaigns = [], isLoading } = useCampaigns(filter !== 'all' ? { status: filter } : {});
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try { await deleteCampaign.mutateAsync(id); } catch (_) {}
    setOpenMenu(null);
  };

  const handleSend = async (id) => {
    try { await sendCampaign.mutateAsync(id); } catch (_) {}
    setOpenMenu(null);
  };

  const allCampaigns = campaigns;
  const filtered = filter === 'all' ? allCampaigns : allCampaigns.filter(c => c.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Campaigns</h2>
          <p className="page-subtitle">{allCampaigns.length} total · {allCampaigns.filter(c => c.status === 'sending').length} sending now</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowWizard(true)}><Plus size={14} /> New Campaign</button>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['all', 'draft', 'scheduled', 'sending', 'completed', 'failed'].map(s => {
          const count = s === 'all' ? allCampaigns.length : allCampaigns.filter(c => c.status === s).length;
          return (
            <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 11, background: filter === s ? 'var(--accent-dim)' : 'var(--bg-hover)', color: filter === s ? 'var(--accent)' : 'var(--text-muted)', padding: '1px 7px', borderRadius: 99 }}>{count}</span>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 100 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Send size={40} className="empty-icon" />
          <span className="empty-title">No {filter !== 'all' ? filter : ''} campaigns</span>
          <span className="empty-desc">Click "New Campaign" to create one.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(c => {
            const st = STATUS_MAP[c.status] || STATUS_MAP.draft;
            const progress = c.recipients_count > 0 ? Math.round((c.sent_count / c.recipients_count) * 100) : 0;
            return (
              <div key={c.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: c.status === 'sending' ? 'var(--accent-dim)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.status === 'sending' ? <Activity size={16} color="var(--accent)" /> : <Send size={16} color="var(--text-muted)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${st.cls}`}>{st.icon}{st.label}</span>
                    {c.scheduled_at && <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{new Date(c.scheduled_at).toLocaleDateString()}</span>}
                    <div className="dropdown">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}><MoreHorizontal size={15} /></button>
                      {openMenu === c.id && (
                        <div className="dropdown-menu">
                          {c.status === 'draft' && <div className="dropdown-item" onClick={() => handleSend(c.id)}><Send size={13} /> Send Now</div>}
                          <div className="dropdown-divider" />
                          <div className="dropdown-item danger" onClick={() => handleDelete(c.id)}><Trash2 size={13} /> Delete</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {[{ label: 'Recipients', value: c.recipients_count }, { label: 'Sent', value: c.sent_count, color: 'var(--success)' }, { label: 'Failed', value: c.failed_count, color: c.failed_count > 0 ? 'var(--danger)' : undefined }].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {c.status === 'sending' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="flex justify-between" style={{ marginBottom: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>Sending progress</span><span>{progress}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showWizard && <CampaignWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
