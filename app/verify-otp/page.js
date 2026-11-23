
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Invalid or expired OTP.');
        return;
      }

      router.replace('/extract');
      router.refresh();

    } catch (err) {
      console.error(err);
      setError('Unable to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">JE</div>

        <h1>Verify your identity</h1>

        <p className="auth-subtitle">
          We've sent a six-digit verification code to your registered email.
        </p>

        <div className="auth-email">
          XXXX Contact Your Admin XXXX
        </div>

        <form onSubmit={handleVerify}>

          <div className="auth-field">
            <label>Enter verification code</label>

            <input
              className="auth-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e =>
                setOtp(
                  e.target.value.replace(/\D/g, '').slice(0, 6)
                )
              }
              required
            />
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <button
            type="button"
            className="auth-back"
            onClick={() => router.replace('/login')}
          >
            ← Back to Login
          </button>

        </form>

        <div className="auth-footer">
          Secure OTP authentication · Journals Era Publications
        </div>

      </div>
    </div>
  );
}
