'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Lock, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If session already exists, redirect immediately to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/admin/dashboard');
      }
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <div className="logo-icon">
              <Layers size={20} />
            </div>
            COVERS<span className="zone">ZONE</span>
          </div>
          <p className="admin-login-subtitle">Sign in to manage your accessories catalog</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="badge danger" style={{ width: '100%', padding: '10px', textAlign: 'center', marginBottom: '16px', borderRadius: 'var(--radius-md)' }}>
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px' }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="admin@coverszone.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-primary-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 'var(--radius-md)', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                Signing In...
              </>
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
