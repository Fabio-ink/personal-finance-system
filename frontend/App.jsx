import React from 'react';
import { Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PieChart, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './src/contexts/AuthContext.jsx';

import DashboardPage from './src/pages/DashboardPage.jsx';
import AccountsPage from './src/pages/AccountsPage.jsx';
import CategoriesPage from './src/pages/CategoriesPage.jsx';
import TransactionsPage from './src/pages/TransactionsPage.jsx';
import LoginPage from './src/pages/LoginPage.jsx';
import RegisterPage from './src/pages/RegisterPage.jsx';
import ForgotPasswordPage from './src/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './src/pages/ResetPasswordPage.jsx';
import LogoutSuccessPage from './src/pages/LogoutSuccessPage.jsx';
import ProtectedRoute from './src/components/ProtectedRoute.jsx';
import UserMenu from './src/components/UserMenu.jsx';
import UserProfilePage from './src/pages/UserProfilePage.jsx';

const AppLayout = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const getDisplayName = (name) => {
    if (!name) return 'User';
    const parts = name.split(' ').filter(part => part.trim() !== '');
    if (parts.length > 1) {
        return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts[0];
  };

  const displayName = getDisplayName(user?.name);
  const initial = user?.name ? user.name[0].toUpperCase() : 'F';

  return (
  <div className="min-h-screen flex flex-col bg-linear-to-br from-brand-gradient-start to-brand-gradient-end text-text-primary font-sans">
    
    {/* Top Header - Dark, Non-Purple */}
    <header className="h-20 shrink-0 bg-brand-dark border-b border-brand-border/30 flex items-center justify-between px-8 z-50 relative shadow-md">
        {/* Placeholder for left balance if needed, or just standard flex */}
        <div className="w-10"></div> 

        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
             {/* Logo in Center */}
            <div className="flex flex-col items-center">
                 <div className="text-2xl font-bold tracking-widest text-white">SYNC</div>
                 <div className="text-xs tracking-[0.3em] text-text-secondary uppercase">wallet</div>
            </div>
        </div>

        <UserMenu />
    </header>

    {/* Main Body Area */}
    <div className="flex-1 flex overflow-hidden relative">
        <nav className="w-72 bg-linear-to-b from-brand-gradient-start to-brand-gradient-end border-r border-brand-border/30 p-6 flex flex-col backdrop-blur-xl shrink-0">
        <div className="mb-0">
            {/* Sidebar Logo removed as it is in header now */}
        </div>
        
        <div className="flex flex-col gap-2 pt-4">
            <NavLink to="/" className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-semibold' : 'text-text-secondary hover:bg-brand-card-hover hover:text-white'}`}>
            <LayoutDashboard size={22} /> {t('common.dashboard')}
            </NavLink>
            <NavLink to="/transactions" className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-semibold' : 'text-text-secondary hover:bg-brand-card-hover hover:text-white'}`}>
            <List size={22} /> {t('common.transactions')}
            </NavLink>
            <NavLink to="/categories" className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-semibold' : 'text-text-secondary hover:bg-brand-card-hover hover:text-white'}`}>
            <PieChart size={22} /> {t('common.categories')}
            </NavLink>
        </div>

        <div className="mt-auto pt-8 border-t border-brand-border/30">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-brand-primary to-brand-info flex items-center justify-center text-white font-bold">
                    {initial}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                </div>
            </div>
        </div>
        </nav>
        
        <main className="flex-1 p-8 overflow-auto z-10 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent">
            {/* Background Glow Effect limited to main area or global? Keep global on parent, main is transparent */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-info/5 rounded-full blur-[150px]"></div>
            </div>
            
            {/* Content Content - z-index to be above glow */}
            <div className="relative z-10">
                <Outlet />
            </div>
        </main>
    </div>
  </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/logout-success" element={<LogoutSuccessPage />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;