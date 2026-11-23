
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid username or password.');
        return;
      }

      router.push('/verify-otp');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">MP</div>

        <h1>Welcome back</h1>

        <p className="auth-subtitle">
          Sign in to your Minty Publishers workspace
          and continue extracting publications.
        </p>

        <form onSubmit={handleLogin}>

          <div className="auth-field">
            <label>Email address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="Enter your email address"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>

            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: 14,
                  border: 0,
                  background: 'transparent',
                  color: '#5269c5',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <div className="auth-footer">
          Secure access · OTP verification enabled
        </div>

      </div>
    </div>
  );
}
