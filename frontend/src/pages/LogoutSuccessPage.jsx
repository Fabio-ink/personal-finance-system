import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { CheckCircle } from 'lucide-react';

const LogoutSuccessPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-brand-dark relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-info/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-brand-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
            <CheckCircle size={40} className="text-brand-success" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">You've logged out</h1>
        <p className="text-gray-400 text-lg mb-8">See you soon!</p>
        
        <Link to="/login" className="w-full">
          <Button variant="primary" className="w-full py-3! text-lg font-medium shadow-lg shadow-brand-primary/20">
            Login again
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LogoutSuccessPage;
