import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, PageTitle, Input, Button } from '../components/ui';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      addToast({
        type: 'success',
        title: t('common.success'),
        message: i18n.language.startsWith('pt') ? 'Cadastro realizado com sucesso! Faça o login.' : 'Registration successful! Please login.'
      });
      navigate('/login');
    } catch (error) {
      console.error('Failed to register', error);
      const data = error.response?.data;
      const isEmailInUse = 
        (typeof data === 'string' && data.includes('Email already in use')) ||
        (data && (data.message === 'Email already in use' || data.details === 'Email already in use')) ||
        (error.message && error.message.includes('Email already in use'));

      let messageToShow;
      if (isEmailInUse) {
        messageToShow = i18n.language.startsWith('pt') ? 'Este e-mail já está cadastrado.' : 'This email is already registered.';
      } else {
        messageToShow = i18n.language.startsWith('pt') ? 'Erro ao realizar o cadastro.' : 'Failed to register.';
      }
      addToast({
        type: 'error',
        title: t('common.error'),
        message: messageToShow
      });
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 bg-brand-dark opacity-80"></div> {/* Dark overlay */}
      
      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <PageTitle className="text-center text-4xl text-white">Register</PageTitle>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Full Name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button variant="primary" type="submit" className="w-full py-3!">
            Register
          </Button>
        </form>
        <p className="text-center text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
