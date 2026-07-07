import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, PageTitle } from '../components/ui';
import api from '../services/api';

const ResetPasswordPage = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setMessage('Password changed successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Invalid or expired code.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 bg-brand-dark opacity-80"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <PageTitle className="text-center text-3xl text-white">Reset Password</PageTitle>

        {message && (
          <div className="bg-brand-success/10 border border-brand-success/50 text-brand-success p-3 rounded-md text-sm text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Recovery Code"
            label="Code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="New Password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Confirm New Password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button variant="primary" type="submit" className="w-full py-3!" disabled={loading}>
            {loading ? 'Changing Password...' : 'Confirm'}
          </Button>
        </form>

        <div className="text-center flex flex-col space-y-2">
          <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
            Didn't receive the code? <span className="text-brand-primary hover:underline font-medium">Resend</span>
          </Link>
          <Link to="/login" className="text-sm text-brand-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
