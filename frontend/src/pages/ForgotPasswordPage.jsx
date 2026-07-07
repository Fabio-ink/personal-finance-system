import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, PageTitle } from '../components/ui';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('If the email is registered, you will receive a recovery code.');
      setTimeout(() => navigate('/reset-password'), 3000);
    } catch (err) {
      setError('Error processing request. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 bg-brand-dark opacity-80"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <PageTitle className="text-center text-3xl text-white">Recover Password</PageTitle>
        
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

        <p className="text-gray-300 text-center text-sm">
          Enter your email to receive a recovery code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            placeholder="Email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Button variant="primary" type="submit" className="w-full py-3!" disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm text-brand-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
