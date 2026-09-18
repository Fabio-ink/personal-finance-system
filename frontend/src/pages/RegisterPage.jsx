import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { PageTitle, Input, Button } from '../components/ui';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center relative overflow-hidden bg-brand-dark">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-info/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-brand-card/70 backdrop-blur-xl border border-brand-border/40 rounded-3xl shadow-2xl animate-scale-in">
        <PageTitle className="text-center text-4xl text-white font-bold tracking-tight">Register</PageTitle>
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
          <Button variant="primary" type="submit" loading={loading} className="w-full py-3!">
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
        </form>
        <p className="text-center text-gray-300 text-sm">
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
