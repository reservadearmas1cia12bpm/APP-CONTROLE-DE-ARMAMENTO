import React from 'react';
import { LayoutDashboard, Users, Package, ArrowRightLeft, FileText, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personnel', label: 'Efetivo', icon: Users },
    { id: 'inventory', label: 'Armamento e Material', icon: Package },
    { id: 'cautela', label: 'Cautelas (Saída/Dev)', icon: ArrowRightLeft },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
      transition-all duration-300 z-10 overflow-y-auto
      ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20 lg:w-64'}
    `}>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                ${active 
                  ? 'bg-police-50 dark:bg-police-900/30 text-police-700 dark:text-police-300 font-medium' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
              `}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={`whitespace-nowrap ${isOpen ? 'block' : 'block md:hidden lg:block'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};