import React, { useState } from 'react';
import {
  Bot, Plus, XCircle, Play, Pause, Globe, CheckCircle,
  AlertCircle, Activity, Trash2, Eye, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_SOURCES = [
  { id: 1, name: 'TVET Authority Kenya', type: 'website', url: 'https://tveta.go.ke', sector: 'TVET', status: 'active', last_run: '2025-01-18', records_found: 145, records_valid: 128 },
  { id: 2, name: 'Kenya Medical Directory', type: 'directory', url: 'https://kmdc.go.ke', sector: 'Hospital', status: 'active', last_run: '2025-01-17', records_found: 89, records_valid: 76 },
  { id: 3, name: 'NGO Board Kenya', type: 'website', url: 'https://ngobureau.go.ke', sector: 'NGO', status: 'paused', last_run: '2025-01-15', records_found: 204, records_valid: 178 },
];

const MOCK_EXTRACTED = [
  { id: 1, name: 'Jane Muthoni', email: 'j.muthoni@coasttvet.ac.ke', organization: 'Coast TVET College', phone: '+254 722 100 100', sector: 'TVET', confidence: 92, status: 'pending' },
  { id: 2, name: 'Dr. Kamau Njoroge', email: 'drknjoroge@mater.or.ke', organization: 'Mater Hospital', phone: '+254 733 200 200', sector: 'Hospital', confidence: 87, status: 'pending' },
  { id: 3, name: 'Mary Auma', email: 'mauma@redcross.or.ke', organization: 'Kenya Red Cross', phone: '+254 700 300 300', sector: 'NGO', confidence: 95, status: 'approved' },
  { id: 4, name: 'John Kariuki', email: 'jkariuki@gmail.com', organization: 'Unknown', phone: '', sector: 'TVET', confidence: 31, status: 'rejected' },
  { id: 5, name: 'Prof. Wanjiku Odhiambo', email: 'wanjiku@maseno.ac.ke', organization: 'Maseno University', phone: '+254 711 400 400', sector: 'Education', confidence: 89, status: 'pending' },
];

function SourceModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', url: '', type: 'website', sector: 'TVET', crawl_depth: 2 });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    toast.success('Source added — AI extraction will run daily');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Extraction Source</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Source Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. TVET Authority Kenya" required />
            </div>
            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input type="url" className="form-input" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.go.ke" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Source Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="website">Website</option>
                  <option value="directory">Directory</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select className="form-select" value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}>
                  {['TVET', 'Hospital', 'NGO', 'Education', 'Corporate'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Crawl Depth</label>
              <input type="number" min={1} max={5} className="form-input" value={form.crawl_depth} onChange={e => setForm(p => ({ ...p, crawl_depth: +e.target.value }))} />
              <span className="form-hint">How many link levels deep to crawl (1–5)</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Bot size={14} /> Add Source</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfidenceBadge({ score }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 48, height: 5, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color }}>{score}%</span>
    </div>
  );
}

export default function ExtractorPage() {
  const [sources, setSources] = useState(MOCK_SOURCES);
  const [extracted, setExtracted] = useState(MOCK_EXTRACTED);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sources');
  const [running, setRunning] = useState(false);

  const approveContact = (id) => {
    setExtracted(p => p.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    toast.success('Contact approved and added to database');
  };

  const rejectContact = (id) => {
    setExtracted(p => p.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
    toast('Contact rejected');
  };

  const runExtraction = () => {
    setRunning(true);
    toast.loading('Running AI extraction...', { id: 'extract' });
    setTimeout(() => {
      setRunning(false);
      toast.success('Extraction complete — 47 new contacts found', { id: 'extract' });
      setSources(p => p.map(s => ({ ...s, last_run: new Date().toISOString().split('T')[0], records_found: s.records_found + Math.floor(Math.random() * 20) })));
    }, 3000);
  };

  const pending = extracted.filter(c => c.status === 'pending');
  const statusMap = {
    approved: <span className="badge badge-green"><CheckCircle size={9} />Approved</span>,
    rejected: <span className="badge badge-red"><XCircle size={9} />Rejected</span>,
    pending: <span className="badge badge-yellow">Pending</span>,
  };

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
          <button className="btn btn-primary" onClick={runExtraction} disabled={running}>
            {running ? <><span className="spinner" /> Extracting...</> : <><Bot size={14} /> Run Extraction</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Sources', value: sources.filter(s => s.status === 'active').length, color: 'cyan' },
          { label: 'Total Extracted', value: extracted.length, color: 'orange' },
          { label: 'Pending Review', value: pending.length, color: 'yellow' },
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
        <div className={`tab ${activeTab === 'sources' ? 'active' : ''}`} onClick={() => setActiveTab('sources')}>
          Extraction Sources <span style={{ marginLeft: 6, fontSize: 11, background: activeTab === 'sources' ? 'var(--accent-dim)' : 'var(--bg-hover)', color: activeTab === 'sources' ? 'var(--accent)' : 'var(--text-muted)', padding: '1px 7px', borderRadius: 99 }}>{sources.length}</span>
        </div>
        <div className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
          Review Queue
          {pending.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--warning-dim)', color: 'var(--warning)', padding: '1px 7px', borderRadius: 99 }}>{pending.length}</span>}
        </div>
      </div>

      {activeTab === 'sources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sources.map((s) => (
            <div key={s.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: s.status === 'active' ? 'var(--accent-dim)' : 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Globe size={18} color={s.status === 'active' ? 'var(--accent)' : 'var(--text-muted)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-blue">{s.sector}</span>
                  <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {s.status === 'active' ? <><Activity size={9} />Active</> : <><Pause size={9} />Paused</>}
                  </span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSources(p => p.map(x => x.id === s.id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x))}>
                    {s.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setSources(p => p.filter(x => x.id !== s.id))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Last Run', value: s.last_run },
                  { label: 'Found', value: s.records_found },
                  { label: 'Valid', value: s.records_valid },
                  { label: 'Success Rate', value: `${Math.round((s.records_valid / s.records_found) * 100)}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Organization</th><th>Sector</th><th>Confidence</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {extracted.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{c.email}</td>
                  <td>{c.organization}</td>
                  <td><span className="badge badge-blue">{c.sector}</span></td>
                  <td><ConfidenceBadge score={c.confidence} /></td>
                  <td>{statusMap[c.status]}</td>
                  <td>
                    {c.status === 'pending' && (
                      <div className="flex gap-1">
                        <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(0,214,143,0.2)' }} onClick={() => approveContact(c.id)}>
                          <CheckCircle size={12} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => rejectContact(c.id)}>
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

      {showModal && <SourceModal onClose={() => setShowModal(false)} onSave={(s) => setSources(p => [...p, { ...s, id: Date.now(), status: 'active', last_run: 'Never', records_found: 0, records_valid: 0 }])} />}
    </div>
  );
}
