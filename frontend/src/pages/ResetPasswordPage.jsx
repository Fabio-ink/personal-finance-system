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
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setMessage('Senha alterada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Código inválido ou expirado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 bg-brand-dark opacity-80"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <PageTitle className="text-center text-3xl text-white">Redefinir Senha</PageTitle>

        {message && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-md text-sm text-center">
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
            placeholder="Código de Recuperação"
            label="Código"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Nova Senha"
            label="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Confirmar Nova Senha"
            label="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button variant="primary" type="submit" className="w-full py-3!" disabled={loading}>
            {loading ? 'Alterar Senha' : 'Confirmar'}
          </Button>
        </form>

        <div className="text-center flex flex-col space-y-2">
          <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
            Não recebeu o código? <span className="text-brand-primary hover:underline font-medium">Reenviar</span>
          </Link>
          <Link to="/login" className="text-sm text-brand-primary hover:underline">
            Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
