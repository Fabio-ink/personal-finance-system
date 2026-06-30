import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input, Button, PageTitle } from '../components/ui';
import Modal from '../components/ui/Modal';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showLocalWarning, setShowLocalWarning] = useState(false);
  const { login, enterLocalMode } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      if (!email.trim()) {
        setError('Please enter a valid email.');
        return;
      }
      setStep(2);
    } else {
      try {
        await login(email, password);
        navigate('/');
      } catch (error) {
        console.error('Failed to login', error);
        setError('Incorrect email or password. Try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="absolute inset-0 bg-brand-dark opacity-80"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <PageTitle className="text-center text-4xl text-white">Login</PageTitle>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className={step === 1 ? "space-y-6" : "hidden"}>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus={step === 1}
            />

            <Button variant="primary" type="submit" className="w-full py-3!">
              Next
            </Button>
          </div>

          <div className={step === 2 ? "space-y-6" : "hidden"}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setPassword(''); }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-gray-300 text-sm truncate flex-1 font-medium">
                {email}
              </div>
            </div>

            <Input
              type="password"
              name="password"
              placeholder="Password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus={step === 2}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-primary hover:underline">
                Forgot my password
              </Link>
            </div>

            <Button variant="primary" type="submit" className="w-full py-3!">
              Login
            </Button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowLocalWarning(true)}
            className="text-sm font-semibold text-text-secondary hover:text-white transition-colors hover:underline cursor-pointer"
          >
            Acessar Modo Local (Sem Cadastro)
          </button>
        </div>

        <p className="text-center text-gray-300">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:underline">
            Register
          </Link>
        </p>
      </div>

      <Modal isOpen={showLocalWarning} onCancel={() => setShowLocalWarning(false)} maxWidth="max-w-xl">
        <div className="space-y-6 p-2">
          <PageTitle level={2} className="text-2xl font-bold text-red-500">
            Atenção: Modo Local (Offline)
          </PageTitle>
          <p className="text-gray-300 text-base leading-relaxed">
            Ao utilizar o Modo Local, seus dados financeiros serão armazenados <strong>exclusivamente no cache do seu navegador (IndexedDB)</strong>.
          </p>
          <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-sm text-red-400 leading-relaxed">
            <strong>⚠️ Risco de perda de dados:</strong> Se você limpar o histórico do navegador, apagar os cookies/dados de sites, ou se utilizar uma janela de navegação anônima, todos os seus dados serão apagados permanentemente sem possibilidade de recuperação.
          </div>
          <p className="text-gray-300 text-base leading-relaxed">
            Recomendamos fortemente criar uma conta gratuita para salvar suas informações com segurança na nuvem.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => {
                setShowLocalWarning(false);
                enterLocalMode();
                navigate('/');
              }}
              className="flex-1 py-3!"
            >
              Entrar em Modo Local
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowLocalWarning(false)}
              className="flex-1 py-3! border-brand-border/50 text-gray-300"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;