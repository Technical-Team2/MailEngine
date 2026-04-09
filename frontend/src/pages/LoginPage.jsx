import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Background radials */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', borderRight: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={26} color="#080c10" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>MailEngine</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Campaign System</div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign in</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 14 }}>Enter your credentials to access the dashboard</p>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-dim)', border: '1px solid rgba(255,69,96,0.25)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: 38 }} value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@mailengine.com" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={show ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 38, paddingRight: 42 }}
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.875rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>Default credentials (change after first login):</p>
            <p style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>admin@mailengine.com / admin123</p>
          </div>
        </div>
      </div>

      {/* Right panel — features */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', background: 'var(--bg-surface)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Your complete <span style={{ color: 'var(--accent)' }}>outreach engine</span>
        </h3>
        {[
          { n: '01', title: 'Contact Management', desc: 'Import CSV/XLSX, CRUD, search and filter by sector.' },
          { n: '02', title: 'Campaign Builder', desc: '4-step wizard. Select recipients, pick template, send.' },
          { n: '03', title: 'Async Email Engine', desc: 'Celery batches. 50 per batch. Never blocks the server.' },
          { n: '04', title: 'AI Contact Extractor', desc: 'Crawl websites, score leads, approve or reject.' },
        ].map(({ n, title, desc }) => (
          <div key={n} style={{ display: 'flex', gap: '0.875rem', padding: '0.875rem', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: '0.625rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>{n}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
