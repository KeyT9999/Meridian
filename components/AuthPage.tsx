import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User as UserIcon } from 'lucide-react';
import { AuthState, User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resolveLoginIdentity = (value: string) => {
    const trimmed = value.trim();
    const isEmail = trimmed.includes('@');
    return {
      email: isEmail ? trimmed : `${trimmed || 'agent'}@meridian.ai`,
      name: isEmail ? trimmed.split('@')[0] || 'Agent' : trimmed || 'Agent'
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    // Simulate API call delay
    setTimeout(() => {
      // Mock successful login/register
      const baseUser =
        authState === AuthState.LOGIN
          ? resolveLoginIdentity(identifier)
          : { email: email || 'user@example.com', name: name || 'Crypto Marketer' };
      const mockUser: User = {
        email: baseUser.email,
        name: baseUser.name,
        avatarUrl: undefined
      };
      
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  const toggleAuth = () => {
    setAuthState(prev => prev === AuthState.LOGIN ? AuthState.REGISTER : AuthState.LOGIN);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-surface border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest mb-2">
            MERIDIAN
          </h1>
          <p className="text-slate-400 text-sm">
            {authState === AuthState.LOGIN ? 'Welcome back, Agent.' : 'Initialize your Agent Workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authState === AuthState.REGISTER && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {authState === AuthState.LOGIN ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 ml-1">Email or Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="agent@meridian.ai or agent007"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@meridian.ai"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {authState === AuthState.LOGIN && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-primary hover:text-cyan-400 transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {authState === AuthState.LOGIN ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            {authState === AuthState.LOGIN ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleAuth}
              className="text-primary hover:text-cyan-400 font-medium transition-colors"
            >
              {authState === AuthState.LOGIN ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;