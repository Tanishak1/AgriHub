import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Globe, Check, Trash2, Menu } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import { alertAPI } from '../services/api';

interface NavbarProps {
  userName?: string;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userName, onLogout, onMenuToggle }) => {
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await alertAPI.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    
    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await alertAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await alertAPI.clearNotifications();
      setNotifications([]);
      setShowNotifDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'EN' ? 'HI' : 'EN';
    setLanguage(nextLang);
  };

  return (
    <header className="h-20 glass-panel border-b border-slate-800/40 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-glass">
      {/* Left side: Hamburger menu for mobile, and greeting */}
      <div className="flex items-center space-x-4">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="md:hidden text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div>
          <h2 className="text-sm text-slate-400">{language === 'EN' ? 'Welcome back,' : 'स्वागत है,'}</h2>
          <p className="font-bold text-white tracking-wide">{userName || 'Ramesh Patel'}</p>
        </div>
      </div>

      {/* Right side: Language, Notifications, Logout */}
      <div className="flex items-center space-x-4">
        {/* Language selector toggle button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all text-xs font-semibold"
          title="Switch Language"
        >
          <Globe className="w-4 h-4 text-farm-400" />
          <span>{language === 'EN' ? 'English' : 'हिंदी'}</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl shadow-glass border border-slate-700/40 p-4 max-h-96 overflow-y-auto z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-2">
                <h3 className="font-bold text-sm text-white">{t('dash.activeAlerts')}</h3>
                {notifications.length > 0 && (
                  <button onClick={handleClearAll} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  {t('dash.noAlerts')}
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl transition-all text-xs border ${
                        notif.isRead
                          ? 'bg-slate-900/20 border-slate-800/40 text-slate-400'
                          : 'bg-farm-900/10 border-farm-800/30 text-white font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold">{notif.title}</span>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkRead(notif.id, e)}
                            className="p-1 rounded bg-farm-900/30 hover:bg-farm-900/60 text-farm-400 border border-farm-800/40"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-red-950/20 hover:border-red-900/40 border border-slate-700/50 text-slate-400 hover:text-red-400 transition-all"
          title={t('auth.logout')}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
