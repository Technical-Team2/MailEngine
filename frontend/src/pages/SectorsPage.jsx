import React, { useState } from 'react';
import { Plus, XCircle, CheckCircle, Tag, Trash2, AlertCircle } from 'lucide-react';
import { useSectors, useCreateSector, useApproveSector, useDeleteSector } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';

const COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--success)', 'var(--warning)', '#7c3aed', '#ec4899', '#14b8a6'];

export default function SectorsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const { data: sectors = [], isLoading } = useSectors();
  const createSector = useCreateSector();
  const approveSector = useApproveSector();
  const deleteSector = useDeleteSector();

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  const pending = sectors.filter(s => s.status === 'pending');
  const approved = sectors.filter(s => s.status === 'approved');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createSector.mutateAsync({ name: newName.trim() });
      setNewName('');
      setShowModal(false);
    } catch (_) {}
  };

  const handleApprove = async (id) => {
    try { await approveSector.mutateAsync(id); } catch (_) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sector?')) return;
    try { await deleteSector.mutateAsync(id); } catch (_) {}
  };

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div><h2 className="page-title">Sectors</h2></div>
        </div>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sectors</h2>
          <p className="page-subtitle">{approved.length} approved · {pending.length} pending</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Sector
        </button>
      </div>

      {/* Pending approvals — admin only */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="flex items-center gap-1" style={{ marginBottom: '0.875rem' }}>
            <AlertCircle size={15} color="var(--warning)" />
            <h3 style={{ fontSize: '0.95rem', color: 'var(--warning)' }}>
              Pending Approval ({pending.length})
            </h3>
            {!isAdmin && <span className="badge badge-yellow" style={{ marginLeft: 8 }}>Admin action required</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pending.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--warning-dim)', borderRadius: 'var(--radius)' }}>
                <div className="flex items-center gap-2">
                  <Tag size={15} color="var(--warning)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                  <span className="badge badge-yellow">Pending</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(0,214,143,0.2)' }}
                      onClick={() => handleApprove(s.id)}
                      disabled={approveSector.isPending}
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved sectors */}
      <div>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Approved Sectors ({approved.length})
        </h3>
        {approved.length === 0 ? (
          <div className="empty-state">
            <Tag size={40} className="empty-icon" />
            <span className="empty-title">No approved sectors yet</span>
            <span className="empty-desc">Add a sector and approve it to start assigning contacts.</span>
          </div>
        ) : (
          <div className="grid grid-3" style={{ gap: '1rem' }}>
            {approved.map((s, i) => (
              <div key={s.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Color accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: COLORS[i % COLORS.length], borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
                <div className="flex items-center justify-between" style={{ marginBottom: '1rem', paddingTop: '0.25rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${COLORS[i % COLORS.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={18} style={{ color: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="badge badge-green"><CheckCircle size={9} />Approved</span>
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{s.name}</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Added {new Date(s.created_at).toLocaleDateString()}
                </p>
                {isAdmin && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add card */}
            <div
              className="card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', border: '2px dashed var(--border)', cursor: 'pointer', minHeight: 160, transition: 'all 0.2s' }}
              onClick={() => setShowModal(true)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="var(--accent)" />
              </div>
              <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Add Sector</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Sector Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Sector</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><XCircle size={16} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Sector Name *</label>
                  <input
                    className="form-input"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. TVET, Hospital, NGO..."
                    autoFocus
                    required
                  />
                  <span className="form-hint">
                    {isAdmin ? 'As admin, new sectors are auto-approved.' : 'Submitted sectors require admin approval before use.'}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createSector.isPending}>
                  {createSector.isPending ? <span className="spinner" /> : 'Submit Sector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
