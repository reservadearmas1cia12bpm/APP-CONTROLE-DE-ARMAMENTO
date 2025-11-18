import React from 'react';
import { Shield, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { Armorer, AppSettings } from '../types';

interface HeaderProps {
  armorer: Armorer | null;
  settings: AppSettings;
  onLogout: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ armorer, settings, onLogout, toggleTheme, toggleSidebar }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg md:hidden">
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center overflow-hidden ${settings.institutionLogo ? 'bg-transparent' : 'bg-police-600 text-white font-bold'}`}>
                {settings.institutionLogo ? (
                    <img src={settings.institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <Shield size={18} />
                )}
            </div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white hidden sm:block">
                {settings.institutionName}
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Alternar Tema"
        >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {armorer && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{armorer.name}</p>
                  {armorer.role === 'SUPER_ADMIN' && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold uppercase tracking-wider">Super</span>
                  )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Armeiro ID: {armorer.matricula}</p>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};