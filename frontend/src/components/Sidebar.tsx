import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, HelpCircle, Cpu, User, Shield, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const { t } = useLanguage();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/setup', label: t('nav.setup'), icon: HelpCircle },
    { path: '/devices', label: t('nav.devices'), icon: Cpu },
    { path: '/hardware-diagnostics', label: 'Diagnostics', icon: Activity },
    { path: '/profile', label: t('nav.profile'), icon: User },
  ];

  const activeClass = (path: string) => {
    return location.pathname === path
      ? 'bg-farm-600/30 text-farm-300 border-l-4 border-farm-500 font-medium'
      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-4 border-transparent';
  };

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/60 hidden md:flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/40 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-farm-700 to-farm-400 flex items-center justify-center text-xl shadow-glow-green">
          🌱
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-wide">{t('app.name')}</h1>
          <p className="text-[10px] text-farm-400 font-semibold uppercase tracking-wider">{t('app.tagline').split(' ')[0]}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeClass(item.path)}`}
            >
              <Icon className="w-5 h-5 mr-3.5 group-hover:scale-105 transition-transform" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Navigation */}
        {userRole === 'ADMIN' && (
          <div className="pt-6 mt-6 border-t border-slate-800/40">
            <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Management</p>
            <Link
              to="/admin"
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeClass('/admin')}`}
            >
              <Shield className="w-5 h-5 mr-3.5 text-amber-500" />
              <span>{t('nav.admin')}</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer Branding */}
      <div className="p-6 border-t border-slate-800/40 text-center text-xs text-slate-500">
        © 2026 AgriHub Technology
      </div>
    </aside>
  );
};
