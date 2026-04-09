import React, { useState } from 'react';
import { Plus, XCircle, Eye, Edit2, Trash2, Copy, FileText, Tag } from 'lucide-react';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '../hooks/useApi';

function TemplateModal({ template, onClose }) {
  const [form, setForm] = useState(template || { name: '', subject: '', body_html: '' });
  const [tab, setTab] = useState('editor');
  const create = useCreateTemplate();
  const update = useUpdateTemplate();

  const detectedVars = [...new Set([...(form.body_html.matchAll(/\{\{(\w+)\}\}/g) || []), ...(form.subject.matchAll(/\{\{(\w+)\}\}/g) || [])].map(m => m[1]))];

  const insertVar = (v) => setForm(p => ({ ...p, body_html: p.body_html + `{{${v}}}` }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (template) { await update.mutateAsync({ id: template.id, data: form }); }
      else { await create.mutateAsync(form); }
      onClose();
    } catch (_) {}
  };

  const loading = create.isPending || update.isPending;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">{template ? 'Edit Template' : 'New Template'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. TVET Partnership Proposal" required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Line *</label>
              <input className="form-input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Partnership Opportunity — {{organization}}" required />
              <span className="form-hint">Use <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 5px', borderRadius: 4 }}>{'{{variable}}'}</code> for personalization</span>
            </div>

            {detectedVars.length > 0 && (
              <div>
                <label className="form-label">Detected Variables</label>
                <div className="flex gap-1" style={{ flexWrap: 'wrap', marginTop: 6 }}>
                  {detectedVars.map(v => <span key={v} className="badge badge-blue" style={{ cursor: 'pointer' }} onClick={() => insertVar(v)}><Tag size={9} />{v}</span>)}
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Quick Insert Variable</label>
              <div className="flex gap-1" style={{ flexWrap: 'wrap', marginTop: 6 }}>
                {['name', 'organization', 'role', 'phone'].map(v => (
                  <button key={v} type="button" className="btn btn-secondary btn-sm" onClick={() => insertVar(v)}>+ {v}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="tabs" style={{ marginBottom: '0.75rem' }}>
                <div className={`tab ${tab === 'editor' ? 'active' : ''}`} onClick={() => setTab('editor')}>HTML Editor</div>
                <div className={`tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>Preview</div>
              </div>
              {tab === 'editor' ? (
                <textarea className="template-editor" style={{ minHeight: 220 }} value={form.body_html}
                  onChange={e => setForm(p => ({ ...p, body_html: e.target.value }))}
                  placeholder={`<p>Dear {{name}},</p>\n<p>We are reaching out to {{organization}}...</p>\n<p>Best regards,<br>Your Team</p>`}
                  required />
              ) : (
                <div style={{ minHeight: 220, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', fontSize: 14, lineHeight: 1.7, color: '#1a1a1a' }}
                  dangerouslySetInnerHTML={{ __html: form.body_html.replace(/\{\{(\w+)\}\}/g, '<strong style="color:#0077cc;background:#e8f3fc;padding:1px 5px;border-radius:3px">[$1]</strong>') }} />
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const createTemplate = useCreateTemplate();
  const [showModal, setShowModal] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [previewTpl, setPreviewTpl] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try { await deleteTemplate.mutateAsync(id); } catch (_) {}
  };

  const handleDuplicate = async (tpl) => {
    try {
      await createTemplate.mutateAsync({ name: `${tpl.name} (Copy)`, subject: tpl.subject, body_html: tpl.body_html });
    } catch (_) {}
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Email Templates</h2>
          <p className="page-subtitle">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> New Template</button>
      </div>

      {isLoading ? (
        <div className="grid grid-3" style={{ gap: '1.25rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 260 }} />)}
        </div>
      ) : (
        <div className="grid grid-3" style={{ gap: '1.25rem' }}>
          {templates.map((tpl) => (
            <div key={tpl.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="flex items-center justify-between">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--accent)" />
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(tpl.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{tpl.name}</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tpl.subject}</p>
              </div>
              {tpl.variables?.length > 0 && (
                <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                  {tpl.variables.map(v => <span key={v} className="badge badge-blue"><Tag size={9} />{v}</span>)}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', borderLeft: '2px solid var(--border)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {tpl.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
              </div>
              <div className="flex gap-1" style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewTpl(tpl)}><Eye size={13} /> Preview</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditTpl(tpl)}><Edit2 size={13} /> Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(tpl)}><Copy size={13} /></button>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--danger)' }} onClick={() => handleDelete(tpl.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}

          {/* Add card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', border: '2px dashed var(--border)', cursor: 'pointer', minHeight: 240, transition: 'all 0.2s' }}
            onClick={() => setShowModal(true)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Create New Template</span>
          </div>
        </div>
      )}

      {(showModal || editTpl) && <TemplateModal template={editTpl} onClose={() => { setShowModal(false); setEditTpl(null); }} />}

      {previewTpl && (
        <div className="modal-overlay" onClick={() => setPreviewTpl(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">Preview: {previewTpl.name}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPreviewTpl(null)}><XCircle size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Subject</label>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  {previewTpl.subject.replace(/\{\{(\w+)\}\}/g, '[$1]')}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Body</label>
                <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '1.5rem', fontSize: 14, lineHeight: 1.7, color: '#1a1a1a' }}
                  dangerouslySetInnerHTML={{ __html: previewTpl.body_html.replace(/\{\{(\w+)\}\}/g, '<strong style="color:#0077cc">[$1]</strong>') }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewTpl(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setEditTpl(previewTpl); setPreviewTpl(null); }}><Edit2 size={14} /> Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
