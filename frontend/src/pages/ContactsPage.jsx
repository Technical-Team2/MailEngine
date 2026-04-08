import React, { useState } from 'react';
import {
  Users, Search, Upload, Plus, Filter, MoreHorizontal,
  CheckCircle, XCircle, Mail, Phone, Building, Trash2, Edit2, Download
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const MOCK_CONTACTS = [
  { id: 1, name: 'Dr. James Mwangi', email: 'j.mwangi@kenyatta.ac.ke', phone: '+254 722 001 001', organization: 'Kenyatta University', sector: 'Education', type: 'customer', status: 'active' },
  { id: 2, name: 'Sarah Achieng', email: 'sachieng@nairobi-hospital.org', phone: '+254 733 002 002', organization: 'Nairobi Hospital', sector: 'Hospital', type: 'prospect', status: 'active' },
  { id: 3, name: 'Peter Kamau', email: 'pkamau@techbridge.co.ke', phone: '+254 700 003 003', organization: 'TechBridge Kenya', sector: 'NGO', type: 'customer', status: 'active' },
  { id: 4, name: 'Grace Wanjiku', email: 'grace@eastafricatvet.ac.ke', phone: '+254 711 004 004', organization: 'East Africa TVET', sector: 'TVET', type: 'prospect', status: 'active' },
];

const SECTORS = ['All', 'TVET', 'Hospital', 'NGO', 'Corporate', 'Education'];
const TYPES = ['All', 'customer', 'prospect'];

function ImportModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    onDrop: (files) => {
      setFile(files[0]);
      setPreview([
        { name: 'John Doe', email: 'john@example.com', organization: 'Acme Corp', sector: 'Corporate', type: 'prospect' },
        { name: 'Jane Smith', email: 'jane@school.ac.ke', organization: 'ABC School', sector: 'Education', type: 'customer' },
        { name: 'Bob Johnson', email: 'bob@hospital.org', organization: 'City Hospital', sector: 'Hospital', type: 'prospect' },
      ]);
      setStep(2);
    },
  });

  const handleImport = () => {
    toast.success(`${preview.length} contacts imported successfully`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">Import Contacts</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <div className="modal-body">
          {/* Steps */}
          <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
            {['Upload File', 'Preview', 'Confirm'].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--accent)' : 'var(--bg-hover)',
                  color: step >= i + 1 ? '#080c10' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
                {i < 2 && <span style={{ color: 'var(--border)', margin: '0 4px' }}>›</span>}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'dragging' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={36} className="upload-icon" />
              <p><strong>Drop your CSV or XLSX file here</strong></p>
              <p>or click to browse files</p>
              <span className="badge badge-gray">Max 10MB</span>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600 }}>{file?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{preview.length} contacts detected</p>
                </div>
                <span className="badge badge-green"><CheckCircle size={10} />Valid</span>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Organization</th><th>Sector</th><th>Type</th></tr>
                  </thead>
                  <tbody>
                    {preview.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.email}</td>
                        <td>{c.organization}</td>
                        <td><span className="badge badge-blue">{c.sector}</span></td>
                        <td><span className={`badge ${c.type === 'customer' ? 'badge-green' : 'badge-orange'}`}>{c.type}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step === 2 && (
            <button className="btn btn-primary" onClick={handleImport}>
              <CheckCircle size={14} /> Import {preview.length} Contacts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact || { name: '', email: '', phone: '', organization: '', sector: 'TVET', type: 'prospect', status: 'active' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    toast.success(contact ? 'Contact updated' : 'Contact added');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{contact ? 'Edit Contact' : 'Add Contact'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Organization</label>
                <input className="form-input" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select className="form-select" value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}>
                  {SECTORS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="customer">Customer</option>
                  <option value="prospect">Prospect</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [type, setType] = useState('All');
  const [showImport, setShowImport] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  const filtered = contacts.filter(c =>
    (sector === 'All' || c.sector === sector) &&
    (type === 'All' || c.type === type) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const deleteContact = (id) => { setContacts(p => p.filter(c => c.id !== id)); toast.success('Contact deleted'); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Contacts</h2>
          <p className="page-subtitle">{contacts.length} contacts total · {contacts.filter(c => c.status === 'active').length} active</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Import CSV/XLSX
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              className="form-input search-input"
              placeholder="Search by name, email, org..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={sector} onChange={e => setSector(e.target.value)}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          {selected.length > 0 && (
            <button className="btn btn-danger btn-sm">
              <Trash2 size={13} /> Delete {selected.length}
            </button>
          )}
          <button className="btn btn-secondary btn-sm">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" className="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id))}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Organization</th>
              <th>Sector</th>
              <th>Type</th>
              <th>Status</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <Users size={40} className="empty-icon" />
                  <span className="empty-title">No contacts found</span>
                  <span className="empty-desc">Try adjusting your filters or import contacts.</span>
                </div>
              </td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id}>
                <td><input type="checkbox" className="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{c.name[0]}</div>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{c.email}</td>
                <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.phone}</td>
                <td style={{ fontSize: 13 }}>{c.organization}</td>
                <td><span className="badge badge-blue">{c.sector}</span></td>
                <td><span className={`badge ${c.type === 'customer' ? 'badge-green' : 'badge-orange'}`}>{c.type}</span></td>
                <td>
                  <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {c.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className="dropdown">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}>
                      <MoreHorizontal size={15} />
                    </button>
                    {openMenu === c.id && (
                      <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => { setEditContact(c); setOpenMenu(null); }}>
                          <Edit2 size={13} /> Edit
                        </div>
                        <div className="dropdown-item" onClick={() => { window.open(`mailto:${c.email}`); setOpenMenu(null); }}>
                          <Mail size={13} /> Email
                        </div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-item danger" onClick={() => { deleteContact(c.id); setOpenMenu(null); }}>
                          <Trash2 size={13} /> Delete
                        </div>
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
      <div className="pagination">
        <button className="pagination-btn" disabled>‹</button>
        {[1, 2, 3].map(p => (
          <button key={p} className={`pagination-btn ${p === 1 ? 'active' : ''}`}>{p}</button>
        ))}
        <button className="pagination-btn">›</button>
      </div>

      {/* Modals */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showAdd && <ContactModal onClose={() => setShowAdd(false)} onSave={(c) => setContacts(p => [...p, { ...c, id: Date.now() }])} />}
      {editContact && <ContactModal contact={editContact} onClose={() => setEditContact(null)} onSave={(c) => setContacts(p => p.map(x => x.id === c.id ? c : x))} />}
    </div>
  );
}
