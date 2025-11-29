
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PenTool, TrendingUp, ShieldCheck, Bell, User as UserIcon, Menu, LogOut, BookOpen, Key, X, Save, ExternalLink } from 'lucide-react';
import NewsDashboard from './components/NewsDashboard';
import ContentGenerator from './components/ContentGenerator';
import TrendDetection from './components/TrendDetection';
import FactCheck from './components/FactCheck';
import Library from './components/Library';
import AuthPage from './components/AuthPage';
import { ViewState, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [passedData, setPassedData] = useState<{ topic?: string; source?: string }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Simulate session check and load API Key
  useEffect(() => {
    const savedUser = localStorage.getItem('meridian_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedKey = localStorage.getItem('meridian_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeyInput(savedKey);
    }
  }, []);

  const persistApiKey = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setApiKeyInput(trimmed);
    localStorage.setItem('meridian_api_key', trimmed);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('meridian_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('meridian_user');
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleNavigate = (view: ViewState, data?: { topic?: string; source?: string }) => {
    if (data) setPassedData(data);
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile nav
  };

  const saveApiKey = () => {
    if (!apiKeyInput.trim()) {
      alert('Please paste a valid Gemini API key.');
      return;
    }
    persistApiKey(apiKeyInput);
    setShowSettings(false);
    // Ideally trigger a reload or context update, but for now next API call will pick it up
    alert('API Key Saved!');
  };

  const handleInitialKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    persistApiKey(apiKeyInput);
  };

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'News Dashboard', icon: LayoutDashboard },
    { id: ViewState.GENERATOR, label: 'Content Generator', icon: PenTool },
    { id: ViewState.TRENDS, label: 'Trend Detection', icon: TrendingUp },
    { id: ViewState.FACT_CHECK, label: 'Fact Check', icon: ShieldCheck },
    { id: ViewState.LIBRARY, label: 'Library', icon: BookOpen },
  ];

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary text-sm uppercase tracking-[0.4em] font-semibold">
              <Key size={18} />
              API ACCESS REQUIRED
            </div>
            <h1 className="text-2xl font-bold text-white">Connect Gemini</h1>
            <p className="text-slate-400 text-sm">
              Meridian needs your Gemini API Key to activate AI copilots. Generate a free key inside Google AI Studio and paste it below.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-primary to-secondary text-slate-900 font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={18} />
            Open Google AI Studio
          </a>

          <form onSubmit={handleInitialKeySubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Gemini API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-slate-900 font-bold py-3 rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Save & Continue
            </button>
            <p className="text-xs text-slate-500 text-center">
              Key is only stored locally in your browser and never sent to Meridian servers.
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="text-primary" size={20} /> API Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
              Enter your Google Gemini API Key to enable AI features. The key is stored locally in your browser.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-primary focus:outline-none"
                />
              </div>
              
              <button 
                onClick={saveApiKey}
                className="w-full bg-primary hover:bg-cyan-400 text-slate-900 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save Key
              </button>

              <div className="text-xs text-center text-slate-500">
                Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">Get one here</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-center border-b border-slate-800 h-20">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest cursor-pointer" onClick={() => handleNavigate(ViewState.DASHBOARD)}>
            MERIDIAN
          </h1>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 space-y-3">
           <button 
             onClick={() => setShowSettings(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
           >
             <Key size={20} />
             <span className="font-medium text-sm">API Settings</span>
           </button>

           <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Connected API</p>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></div>
                Gemini 2.5 Flash
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block text-sm text-slate-400">
               Welcome back, <span className="text-white font-semibold">{user.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 p-[1px] cursor-pointer group relative">
               <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={16} className="text-white" />
                  )}
               </div>
               
               {/* Dropdown for logout */}
               <div className="absolute right-0 top-full mt-2 w-32 bg-surface border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                 <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg"
                  >
                    <LogOut size={14} /> Logout
                 </button>
               </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          {/* View Routing */}
          {currentView === ViewState.DASHBOARD && (
            <NewsDashboard onNavigate={handleNavigate} />
          )}
          {currentView === ViewState.GENERATOR && (
            <ContentGenerator initialTopic={passedData.topic} />
          )}
          {currentView === ViewState.TRENDS && (
            <TrendDetection />
          )}
          {currentView === ViewState.FACT_CHECK && (
            <FactCheck initialText={passedData.topic} initialSource={passedData.source} />
          )}
          {currentView === ViewState.LIBRARY && (
            <Library />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
