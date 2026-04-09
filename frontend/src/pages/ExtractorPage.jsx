import React, { useState } from 'react';
import { Bot, Plus, XCircle, Play, Pause, Globe, CheckCircle, Activity, Trash2 } from 'lucide-react';
import {
  useExtractionSources, useAddSource, useToggleSource, useDeleteSource, useRunSource,
  useExtractedContacts, useApproveExtracted, useRejectExtracted,
} from '../hooks/useApi';
import { useSectors } from '../hooks/useApi';

function AddSourceModal({ onClose }) {
  const { data: sectors = [] } = useSectors({ status: 'approved' });
  const [form, setForm] = useState({ name: '', url: '', type: 'website', sector: '', crawl_depth: 2 });
  const addSource = useAddSource();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addSource.mutateAsync(form);
      onClose();
    } catch (_) {}
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Extraction Source</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Source Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. TVET Authority Kenya" required />
            </div>
            <div className="form-group">
              <label className="form-label">Website URL *</label>
              <input type="url" className="form-input" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.go.ke" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="website">Website</option>
                  <option value="directory">Directory</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select className="form-select" value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} required>
                  <option value="">— Select sector —</option>
                  {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Crawl Depth (1–5)</label>
              <input type="number" min={1} max={5} className="form-input" value={form.crawl_depth} onChange={e => setForm(p => ({ ...p, crawl_depth: Number(e.target.value) }))} />
              <span className="form-hint">How many link levels deep to crawl</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={addSource.isPending}>
              {addSource.isPending ? <span className="spinner" /> : <><Bot size={14} /> Add Source</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfidenceBar({ score }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 52, height: 5, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color }}>{score}%</span>
    </div>
  );
}

export default function ExtractorPage() {
  const [tab, setTab] = useState('sources');
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data: sources = [], isLoading: sourcesLoading } = useExtractionSources();
  const { data: extracted = [], isLoading: extractedLoading } = useExtractedContacts(
    statusFilter ? { status: statusFilter } : {}
  );

  const toggleSource = useToggleSource();
  const deleteSource = useDeleteSource();
  const runSource = useRunSource();
  const approveContact = useApproveExtracted();
  const rejectContact = useRejectExtracted();

  const handleToggle = async (id) => {
    try { await toggleSource.mutateAsync(id); } catch (_) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this source?')) return;
    try { await deleteSource.mutateAsync(id); } catch (_) {}
  };

  const handleRun = async (id) => {
    try { await runSource.mutateAsync(id); } catch (_) {}
  };

  const handleApprove = async (id) => {
    try { await approveContact.mutateAsync(id); } catch (_) {}
  };

  const handleReject = async (id) => {
    try { await rejectContact.mutateAsync(id); } catch (_) {}
  };

  const pendingCount = extracted.filter(c => c.status === 'pending').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">AI Contact Extractor</h2>
          <p className="page-subtitle">Auto-discover contacts from websites and directories</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Source
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Sources', value: sources.filter(s => s.status === 'active').length, color: 'cyan' },
          { label: 'Total Extracted', value: extracted.length, color: 'orange' },
          { label: 'Pending Review', value: pendingCount, color: 'yellow' },
          { label: 'Approved', value: extracted.filter(c => c.status === 'approved').length, color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${tab === 'sources' ? 'active' : ''}`} onClick={() => setTab('sources')}>
          Sources
          <span style={{ marginLeft: 6, fontSize: 11, background: tab === 'sources' ? 'var(--accent-dim)' : 'var(--bg-hover)', color: tab === 'sources' ? 'var(--accent)' : 'var(--text-muted)', padding: '1px 7px', borderRadius: 99 }}>
            {sources.length}
          </span>
        </div>
        <div className={`tab ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}>
          Review Queue
          {pendingCount > 0 && (
            <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--warning-dim)', color: 'var(--warning)', padding: '1px 7px', borderRadius: 99 }}>
              {pendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Sources tab */}
      {tab === 'sources' && (
        sourcesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2].map(i => <div key={i} className="card skeleton" style={{ height: 100 }} />)}
          </div>
        ) : sources.length === 0 ? (
          <div className="empty-state">
            <Globe size={40} className="empty-icon" />
            <span className="empty-title">No extraction sources yet</span>
            <span className="empty-desc">Add a website URL to start finding contacts automatically.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sources.map(s => (
              <div key={s.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.status === 'active' ? 'var(--accent-dim)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} color={s.status === 'active' ? 'var(--accent)' : 'var(--text-muted)'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-blue">{s.sector || 'No sector'}</span>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {s.status === 'active' ? <><Activity size={9} />Active</> : <><Pause size={9} />Paused</>}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRun(s.id)}
                      disabled={runSource.isPending}
                      title="Run extraction now"
                    >
                      <Play size={13} /> Run
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleToggle(s.id)}
                      title={s.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {s.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2" style={{ marginTop: '0.875rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Type', value: s.type },
                    { label: 'Depth', value: s.crawl_depth },
                    { label: 'Last Run', value: s.last_run ? new Date(s.last_run).toLocaleDateString() : 'Never' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Review Queue tab */}
      {tab === 'review' && (
        <div>
          {/* Status filter */}
          <div className="flex gap-1" style={{ marginBottom: '1rem' }}>
            {['pending', 'approved', 'rejected', ''].map(s => (
              <button
                key={s || 'all'}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {extractedLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <span className="spinner spinner-lg" />
            </div>
          ) : extracted.length === 0 ? (
            <div className="empty-state">
              <Bot size={40} className="empty-icon" />
              <span className="empty-title">No extracted contacts</span>
              <span className="empty-desc">Run an extraction source to populate this queue.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Organization</th>
                    <th>Sector</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {extracted.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{c.email}</td>
                      <td>{c.name || '—'}</td>
                      <td>{c.organization || '—'}</td>
                      <td>{c.sector ? <span className="badge badge-blue">{c.sector}</span> : '—'}</td>
                      <td><ConfidenceBar score={c.confidence_score} /></td>
                      <td>
                        {c.status === 'pending' && <span className="badge badge-yellow">Pending</span>}
                        {c.status === 'approved' && <span className="badge badge-green"><CheckCircle size={9} />Approved</span>}
                        {c.status === 'rejected' && <span className="badge badge-red"><XCircle size={9} />Rejected</span>}
                      </td>
                      <td>
                        {c.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(0,214,143,0.2)' }}
                              onClick={() => handleApprove(c.id)}
                              disabled={approveContact.isPending}
                            >
                              <CheckCircle size={12} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(c.id)}
                              disabled={rejectContact.isPending}
                            >
                              <XCircle size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && <AddSourceModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
