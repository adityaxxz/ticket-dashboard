import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { requestOTP, verifyOTP, isLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await requestOTP({ email });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await verifyOTP({ email, code: otp });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a one-time password
          </p>
        </div>

        <div className="card">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter your email"
                />
              </div>

      {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <p className="mt-1 text-sm text-gray-500">
                  We sent a code to {email}
                </p>
              </div>

      {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="btn-secondary flex-1"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
