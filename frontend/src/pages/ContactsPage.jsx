import React, { useState, useCallback } from 'react';
import { Users, Search, Upload, Plus, MoreHorizontal, CheckCircle, XCircle, Trash2, Edit2, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useUploadContacts, useImportContacts, useSectors } from '../hooks/useApi';
import toast from 'react-hot-toast';

function ImportModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const upload = useUploadContacts();
  const importMut = useImportContacts();

  const onDrop = useCallback(async (accepted) => {
    if (!accepted[0]) return;
    setFile(accepted[0]);
    try {
      const data = await upload.mutateAsync(accepted[0]);
      setPreview(data);
      setStep(2);
    } catch (_) {}
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }, maxFiles: 1 });

  const handleImport = async () => {
    if (!file) return;
    try {
      await importMut.mutateAsync(file);
      onClose();
    } catch (_) {}
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">Import Contacts</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <div className="modal-body">
          {/* Step indicator */}
          <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
            {['Upload File', 'Preview', 'Import'].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--accent)' : 'var(--bg-hover)', color: step >= i + 1 ? '#080c10' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
                {i < 2 && <span style={{ color: 'var(--border)', margin: '0 4px' }}>›</span>}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'dragging' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={36} className="upload-icon" />
              <p><strong>Drop CSV or XLSX here</strong></p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Required column: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>email</code> — optional: name, phone, organization, type, sector</p>
              {upload.isPending && <span className="spinner" />}
            </div>
          )}

          {step === 2 && preview && (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600 }}>{file?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {preview.valid} valid · {preview.duplicates} duplicates skipped · {preview.total} total rows
                  </p>
                </div>
                <span className="badge badge-green"><CheckCircle size={10} />{preview.valid} ready</span>
              </div>
              {preview.preview.length > 0 ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Organization</th><th>Type</th></tr></thead>
                    <tbody>
                      {preview.preview.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.email}</td>
                          <td>{r.organization || '—'}</td>
                          <td><span className={`badge ${r.type === 'customer' ? 'badge-green' : 'badge-orange'}`}>{r.type}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><span className="empty-title">No valid rows found</span></div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step === 2 && preview?.valid > 0 && (
            <button className="btn btn-primary" onClick={handleImport} disabled={importMut.isPending}>
              {importMut.isPending ? <span className="spinner" /> : <><CheckCircle size={14} /> Import {preview.valid} contacts</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactModal({ contact, onClose }) {
  const { data: sectorsData } = useSectors({ status: 'approved' });
  const sectors = sectorsData || [];
  const [form, setForm] = useState(contact || { name: '', email: '', phone: '', organization: '', sector_id: '', type: 'prospect' });
  const create = useCreateContact();
  const update = useUpdateContact();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, sector_id: form.sector_id || null };
    try {
      if (contact) { await update.mutateAsync({ id: contact.id, data: payload }); }
      else { await create.mutateAsync(payload); }
      onClose();
    } catch (_) {}
  };

  const loading = create.isPending || update.isPending;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{contact ? 'Edit Contact' : 'Add Contact'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Organization</label>
                <input className="form-input" value={form.organization || ''} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select className="form-select" value={form.sector_id || ''} onChange={e => setForm(p => ({ ...p, sector_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const { data, isLoading } = useContacts({ search: search || undefined, type: typeFilter || undefined, page, per_page: 25 });
  const deleteContact = useDeleteContact();

  const contacts = data?.items || [];
  const totalPages = data?.pages || 1;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try { await deleteContact.mutateAsync(id); } catch (_) {}
    setOpenMenu(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Contacts</h2>
          <p className="page-subtitle">{data?.total ?? '—'} contacts total</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}><Upload size={14} /> Import CSV/XLSX</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Contact</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input className="form-input search-input" placeholder="Search name, email, org..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="customer">Customer</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Organization</th><th>Type</th><th>Status</th><th style={{ width: 50 }}></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7}><div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><span className="spinner spinner-lg" /></div></td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <Users size={40} className="empty-icon" />
                  <span className="empty-title">{search ? 'No contacts match your search' : 'No contacts yet'}</span>
                  <span className="empty-desc">Import a CSV or add contacts manually.</span>
                </div>
              </td></tr>
            ) : contacts.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-1">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{c.name?.[0] || '?'}</div>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{c.email}</td>
                <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                <td style={{ fontSize: 13 }}>{c.organization || '—'}</td>
                <td><span className={`badge ${c.type === 'customer' ? 'badge-green' : 'badge-orange'}`}>{c.type}</span></td>
                <td><span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{c.status}</span></td>
                <td>
                  <div className="dropdown">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}><MoreHorizontal size={15} /></button>
                    {openMenu === c.id && (
                      <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => { setEditContact(c); setOpenMenu(null); }}><Edit2 size={13} /> Edit</div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-item danger" onClick={() => handleDelete(c.id)}><Trash2 size={13} /> Delete</div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showAdd && <ContactModal onClose={() => setShowAdd(false)} />}
      {editContact && <ContactModal contact={editContact} onClose={() => setEditContact(null)} />}
    </div>
  );
}
