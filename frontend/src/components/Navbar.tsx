import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Binary,
  Code2,
  GitFork,
  Search,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await api.checkHealth();
        if (mounted && res.status === 'ok') {
          setBackendStatus('connected');
        } else if (mounted) {
          setBackendStatus('disconnected');
        }
      } catch {
        if (mounted) setBackendStatus('disconnected');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'editor', label: 'Grammar Editor', icon: Code2 },
    { id: 'parser', label: 'Parse Tree Viewer', icon: GitFork },
    { id: 'ambiguity', label: 'Ambiguity Analyzer', icon: Search },
    { id: 'playground', label: 'Playground (CYK & FIRST/FOLLOW)', icon: Binary },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <GitFork className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  GrammarScope
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CFG Analyzer
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Syntax Tree Generator & Ambiguity Engine</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                backendStatus === 'connected'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                  : backendStatus === 'disconnected'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
              }`}
            >
              {backendStatus === 'connected' && <CheckCircle2 size={12} className="text-emerald-400" />}
              {backendStatus === 'disconnected' && <XCircle size={12} className="text-rose-400" />}
              {backendStatus === 'checking' && <HelpCircle size={12} className="text-amber-400" />}
              <span>
                {backendStatus === 'connected'
                  ? 'API Online'
                  : backendStatus === 'disconnected'
                  ? 'API Disconnected'
                  : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
