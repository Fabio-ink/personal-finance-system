import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input, Button, PageTitle } from '../components/ui';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe um email válido.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Failed to login', error);
      setError('Email ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 bg-brand-dark opacity-80"></div> {/* Overlay escuro */}

      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <PageTitle className="text-center text-4xl text-white">Login</PageTitle>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-6">
            <Input
              type="email"
              placeholder="Email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <Button variant="primary" type="submit" className="w-full py-3!">
              Avançar
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setPassword(''); }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Voltar"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-gray-300 text-sm truncate flex-1 font-medium">
                {email}
              </div>
            </div>

            <Input
              type="password"
              placeholder="Senha"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-primary hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            <Button variant="primary" type="submit" className="w-full py-3!">
              Entrar
            </Button>
          </form>
        )}

        <p className="text-center text-gray-300">
          Não tem uma conta?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;