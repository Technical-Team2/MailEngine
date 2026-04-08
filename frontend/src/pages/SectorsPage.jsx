import React, { useState } from 'react';
import { Plus, XCircle, CheckCircle, Tag, Trash2, Edit2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_SECTORS = [
  { id: 1, name: 'TVET', status: 'approved', contacts: 420, created_at: '2024-12-01' },
  { id: 2, name: 'Hospitals', status: 'approved', contacts: 280, created_at: '2024-12-02' },
  { id: 3, name: 'NGOs', status: 'approved', contacts: 190, created_at: '2024-12-03' },
  { id: 4, name: 'Education', status: 'approved', contacts: 350, created_at: '2024-12-04' },
  { id: 5, name: 'Corporate', status: 'approved', contacts: 210, created_at: '2024-12-05' },
  { id: 6, name: 'Government', status: 'pending', contacts: 0, created_at: '2025-01-18' },
  { id: 7, name: 'Polytechnics', status: 'pending', contacts: 0, created_at: '2025-01-19' },
];

const COLORS_BY_INDEX = ['var(--accent)', 'var(--accent-2)', 'var(--success)', 'var(--warning)', '#7c3aed', '#ec4899', '#14b8a6'];

export default function SectorsPage() {
  const [sectors, setSectors] = useState(MOCK_SECTORS);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  const approve = (id) => {
    setSectors(p => p.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    toast.success('Sector approved');
  };

  const reject = (id) => {
    setSectors(p => p.filter(s => s.id !== id));
    toast.success('Sector rejected and removed');
  };

  const addSector = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSectors(p => [...p, { id: Date.now(), name: newName.trim(), status: 'pending', contacts: 0, created_at: new Date().toISOString().split('T')[0] }]);
    setNewName('');
    setShowModal(false);
    toast.success('Sector submitted for approval');
  };

  const pending = sectors.filter(s => s.status === 'pending');
  const approved = sectors.filter(s => s.status === 'approved');

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sectors</h2>
          <p className="page-subtitle">Organize and approve contact sectors</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Sector
        </button>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="flex items-center gap-1" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={15} color="var(--warning)" />
            <h3 style={{ fontSize: '0.95rem', color: 'var(--warning)' }}>Pending Approval ({pending.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pending.map((s) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1.25rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--warning-dim)',
                borderRadius: 'var(--radius)',
              }}>
                <div className="flex items-center gap-2">
                  <Tag size={15} color="var(--warning)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                  <span className="badge badge-yellow"><Clock size={9} />Pending</span>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(0,214,143,0.2)' }} onClick={() => approve(s.id)}>
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => reject(s.id)}>
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved sectors grid */}
      <div>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Approved Sectors ({approved.length})</h3>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          {approved.map((s, i) => (
            <div key={s.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Decorative accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: COLORS_BY_INDEX[i % COLORS_BY_INDEX.length],
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              }} />

              <div className="flex items-center justify-between" style={{ marginBottom: '1rem', paddingTop: '0.25rem' }}>
                <div style={{
                  width: 42, height: 42,
                  borderRadius: 10,
                  background: `${COLORS_BY_INDEX[i % COLORS_BY_INDEX.length]}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Tag size={18} style={{ color: COLORS_BY_INDEX[i % COLORS_BY_INDEX.length] }} />
                </div>
                <span className="badge badge-green"><CheckCircle size={9} />Approved</span>
              </div>

              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{s.name}</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: COLORS_BY_INDEX[i % COLORS_BY_INDEX.length], fontWeight: 600 }}>
                  {s.contacts.toLocaleString()}
                </span> contacts
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Since {s.created_at}</span>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => reject(s.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}

          {/* Add card */}
          <div className="card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', border: '2px dashed var(--border)', cursor: 'pointer', minHeight: 180,
            transition: 'all 0.2s',
          }}
            onClick={() => setShowModal(true)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Add New Sector</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Sector</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><XCircle size={16} /></button>
            </div>
            <form onSubmit={addSector}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Sector Name</label>
                  <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Government, Polytechnics..." autoFocus required />
                  <span className="form-hint">New sectors require admin approval before they can be used.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// needed for pending
function Clock(props) { return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||16} height={props.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
