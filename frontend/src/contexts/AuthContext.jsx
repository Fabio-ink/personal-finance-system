import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { clearAllLocalData } from '../services/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLocalMode, setIsLocalMode] = useState(localStorage.getItem('isLocalMode') === 'true');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token || localStorage.getItem('isLocalMode') === 'true');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedLocalMode = localStorage.getItem('isLocalMode') === 'true';
    if (storedToken) {
      try {
        const decodedUser = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;
        if (decodedUser.exp && decodedUser.exp < currentTime) {
          throw new Error("Token expired");
        }
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        setUser(decodedUser);
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token inválido ou expirado", error);
        logout();
      }
    } else if (storedLocalMode) {
      setIsLocalMode(true);
      setUser({ name: 'Local User', email: 'local@syncwallet.com' });
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      await clearAllLocalData().catch(console.error);
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.removeItem('isLocalMode');
      setIsLocalMode(false);
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      
      const decodedUser = jwtDecode(data.token);
      setUser(decodedUser);
      
      setToken(data.token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      await clearAllLocalData().catch(console.error);
      await api.post('/auth/register', { name, email, password });
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };

  const logout = () => {
    const wasCloudMode = !!token;
    localStorage.removeItem('token');
    localStorage.removeItem('isLocalMode');
    delete api.defaults.headers.Authorization;
    setToken(null);
    setUser(null);
    setIsLocalMode(false);
    setIsAuthenticated(false);
    if (wasCloudMode) {
      clearAllLocalData().catch(console.error);
    }
  };

  const enterLocalMode = () => {
    localStorage.setItem('isLocalMode', 'true');
    localStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
    setToken(null);
    setIsLocalMode(true);
    setUser({ name: 'Local User', email: 'local@syncwallet.com' });
    setIsAuthenticated(true);
  };

  const updateUserToken = (newToken) => {
    localStorage.setItem('token', newToken);
    localStorage.removeItem('isLocalMode');
    setIsLocalMode(false);
    api.defaults.headers.Authorization = `Bearer ${newToken}`;
    const decodedUser = jwtDecode(newToken);
    setUser(decodedUser);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, isLoading, login, register, logout, updateUserToken, isLocalMode, enterLocalMode }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);