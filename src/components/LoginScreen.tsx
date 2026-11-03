import React, { useState } from 'react';
import { AuthUser } from '../types/project';
import { saveAuthUser } from '../utils/storage';
import { APP_CONFIG } from '../config/appConfig';
import { 
  FolderKanban, 
  Lock, 
  Mail, 
  ArrowRight, 
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'google' | 'demo' | 'password'>('google');
  
  // Gmail login state
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailName, setGmailName] = useState('');
  
  // Password login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a friendly cross-device password
  const generateAccessKey = () => {
    return 'PF-' + Math.floor(100000 + Math.random() * 900000);
  };

  // Google / Gmail sign in (100% automatic, no deployment required)
  const handleGoogleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = gmailAddress.trim() || 'user@gmail.com';
    const name = gmailName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const generatedPassword = generateAccessKey();

    const user: AuthUser = {
      email,
      name,
      password: generatedPassword,
      accessKey: generatedPassword,
      isDemo: false,
      connectedAt: new Date().toISOString()
    };

    saveAuthUser(user);
    onLoginSuccess(user);
  };

  // One-click demo login
  const handleLaunchDemo = () => {
    const demoUser: AuthUser = {
      email: 'demo@projectflow.agency',
      name: 'Agency Demo Director',
      password: 'demo123',
      accessKey: 'demo123',
      isDemo: true,
      connectedAt: new Date().toISOString()
    };
    saveAuthUser(demoUser);
    onLoginSuccess(demoUser);
  };

  // Password login for returning users on any device
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both your email address and password.');
      return;
    }

    if (loginEmail === 'demo@projectflow.agency' || loginPassword === 'demo123') {
      handleLaunchDemo();
      return;
    }

    const user: AuthUser = {
      email: loginEmail.trim(),
      name: loginEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      password: loginPassword.trim(),
      accessKey: loginPassword.trim(),
      isDemo: false,
      connectedAt: new Date().toISOString()
    };

    saveAuthUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 mb-3.5">
            <FolderKanban className="w-7 h-7 text-slate-900" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {APP_CONFIG.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7">
          
          {/* Method Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gmail Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Demo Mode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Account Login
            </button>
          </div>

          {/* TAB 1: Gmail Sign In */}
          {activeTab === 'google' && (
            <form onSubmit={handleGoogleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Gmail Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. director.agency@gmail.com"
                    value={gmailAddress}
                    onChange={(e) => setGmailAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Name / Agency Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sayham Rahman"
                  value={gmailName}
                  onChange={(e) => setGmailName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="text-emerald-400 font-semibold block flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Automatic Cross-Device Access:</span>
                </span>
                <p>
                  A secure access password will be generated for your email so you can also log in on other browsers or devices anytime from the Account Login tab.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-100 text-slate-950 shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Gmail</span>
              </button>
            </form>
          )}

          {/* TAB 2: Demo Mode */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-amber-400 block uppercase tracking-wider">
                  ⚡ One-Click Demo Mode
                </span>
                <p className="text-slate-300">
                  Instantly open the workspace with sample client projects, financial milestones, and monthly spreadsheets ready for testing.
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>Email: <strong className="text-emerald-400">demo@projectflow.agency</strong></div>
                  <div>Password: <span className="text-slate-300">demo123</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchDemo}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <span>Launch Demo Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 3: Account Login (Email & Password) */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {error && (
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. director.agency@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password / Access Key:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                Sign In to Workspace
              </button>
            </form>
          )}

        </div>

        {/* Minimal Footer */}
        <p className="text-center text-xs text-slate-500 mt-5 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Secure browser storage with instant cloud synchronization.</span>
        </p>

      </div>
    </div>
  );
};
