import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';

interface SignupPageProps {
  onSignupSuccess: (user: any) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || loading) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await authAPI.signup({
        name,
        email,
        password,
        phone: phone || undefined,
        location: location || undefined,
      });

      // Save token
      localStorage.setItem('agrihub_token', res.data.token);
      
      // Update state
      onSignupSuccess(res.data.user);
      
      // Redirect
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Registration failed. Verify input details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-farm-800/10 blur-3xl animate-pulse-soft"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-soil-800/10 blur-3xl animate-pulse-soft delay-1000"></div>

      <div className="w-full max-w-md z-10 flex flex-col items-center my-8">
        {/* Brand Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-farm-700 to-farm-400 flex items-center justify-center text-3xl shadow-glow-green mb-4 border border-farm-500/20">
          🌱
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">{t('app.name')}</h1>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-8">{t('app.tagline')}</p>

        {/* Central Card */}
        <div className="w-full glass-panel border border-slate-800/80 rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-farm-400" />
            {t('auth.signup')}
          </h2>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-semibold animate-fadeIn">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4 text-xs font-bold">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest">{t('auth.name')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramesh Patel"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-farm-500/50"
                  required
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest">{t('auth.email')}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@agrihub.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-farm-500/50"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-farm-500/50"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('auth.phone')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-farm-500/50"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('auth.location')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Indore, MP"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-farm-500/50"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-farm-600 hover:bg-farm-500 disabled:bg-slate-850 text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 border border-farm-500/20 shadow-glow-green"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Registering...' : t('auth.signup')}</span>
            </button>
          </form>

          {/* Toggle link */}
          <div className="text-center pt-2 border-t border-slate-800/40 text-xs text-slate-400">
            <span>{t('auth.hasAccount')} </span>
            <Link to="/login" className="text-farm-400 hover:text-farm-300 font-bold transition-all underline">
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
