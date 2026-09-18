import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx'; 
import { ToastProvider } from './contexts/ToastProvider.jsx';
import { initTelemetry } from './services/telemetry.js';
import './i18n'; 

initTelemetry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);