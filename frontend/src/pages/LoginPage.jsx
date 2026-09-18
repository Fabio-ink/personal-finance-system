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
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      try {
        await login(email, password);
        navigate('/');
      } catch (err) {
        console.error('Failed to login', err);
        setError('Incorrect email or password. Try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center relative overflow-hidden bg-brand-dark">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-info/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-brand-card/70 backdrop-blur-xl border border-brand-border/40 rounded-3xl shadow-2xl animate-scale-in">
        <PageTitle className="text-center text-4xl text-white font-bold tracking-tight">Login</PageTitle>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm text-center animate-fade-in font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <Input
                type="email"
                name="email"
                placeholder="Email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
              />

              <Button variant="primary" type="submit" className="w-full py-3!">
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setPassword(''); }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-brand-border/30 rounded-lg transition-colors cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="text-gray-300 text-sm truncate flex-1 font-medium bg-brand-dark/40 px-3 py-1.5 rounded-lg border border-brand-border/20">
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
                autoFocus
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-brand-primary hover:underline font-medium">
                  Forgot my password
                </Link>
              </div>

              <Button variant="primary" type="submit" loading={loading} className="w-full py-3!">
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          )}
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

        <p className="text-center text-gray-300 text-sm">
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
          <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-sm text-red-400 leading-relaxed space-y-2">
            <div>
              <strong>⚠️ Risco de perda de dados:</strong> Se você limpar o histórico do navegador, apagar os cookies/dados de sites, ou utilizar uma janela de navegação anônima, todos os seus dados serão apagados permanentemente.
            </div>
            <div>
              <strong>ℹ️ Nota sobre login/cadastro:</strong> Se você realizar o cadastro de uma nova conta ou fizer login em uma conta na nuvem futuramente, os dados do Modo Local serão apagados deste navegador para garantir a segurança e o isolamento dos dados da sua conta.
            </div>
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