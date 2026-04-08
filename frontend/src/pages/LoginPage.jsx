import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@mailengine.com', password: 'admin123' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      // error handled in api interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* BG decoration */}
      <div style={{
        position: 'absolute',
        top: '-20%', left: '-10%',
        width: '60vw', height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%', right: '-10%',
        width: '50vw', height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        borderRight: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 480 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={26} color="#080c10" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>MailEngine</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Campaign System</div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: 14 }}>
            Sign in to manage your campaigns and contacts
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={show ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShow(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Demo credentials:</p>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              admin@mailengine.com / admin123
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: '45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            Your complete<br />
            <span style={{ color: 'var(--accent)' }}>outreach engine</span>
          </h3>
          {[
            { title: 'Smart Contact Management', desc: 'Import, segment, and organize thousands of contacts with ease.' },
            { title: 'Campaign Builder', desc: 'Create targeted campaigns with powerful template customization.' },
            { title: 'AI Contact Extraction', desc: 'Automatically discover and enrich contacts from web sources.' },
            { title: 'Real-time Analytics', desc: 'Track delivery, opens, and campaign performance live.' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 14, fontWeight: 800,
                color: 'var(--accent)',
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
