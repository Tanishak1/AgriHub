import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Globe, Save, HelpCircle, Plus, LayoutGrid, Leaf } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import { authAPI, cropAPI } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  
  // Profile Update Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  
  // Field Register Form State
  const [farms, setFarms] = useState<any[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [cropName, setCropName] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfileAndFarms = async () => {
    try {
      setLoading(true);
      const [profileRes, farmsRes] = await Promise.all([
        authAPI.getMe(),
        cropAPI.getFarms()
      ]);
      setProfile(profileRes.data);
      setName(profileRes.data.name);
      setPhone(profileRes.data.phone || '');
      setLocation(profileRes.data.location || '');
      setFarms(farmsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndFarms();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;
    try {
      setSavingProfile(true);
      const res = await authAPI.updateProfile({
        name,
        phone,
        location,
        language
      });
      setProfile(res.data.user);
      setMessage('Profile settings saved successfully.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName || !fieldSize || savingField) return;
    try {
      setSavingField(true);
      const targetFarmId = farms[0]?.id;
      if (!targetFarmId) return;

      await cropAPI.createField({
        name: fieldName,
        size: parseFloat(fieldSize),
        farmId: targetFarmId,
        cropName: cropName || undefined
      });

      setFieldName('');
      setFieldSize('');
      setCropName('');
      setShowAddField(false);
      
      // Refresh farms layout
      const farmsRes = await cropAPI.getFarms();
      setFarms(farmsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingField(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  if (loading && !profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">{t('nav.profile')}</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Manage farmer credentials and field registers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Form (Takes 2 Columns) */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-3xl p-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800/60 pb-3 mb-6 flex items-center">
            <User className="w-4 h-4 mr-2 text-farm-400" />
            Farmer Registration Card
          </h3>

          {message && (
            <div className="p-3 rounded-xl bg-farm-950/20 border border-farm-800/30 text-farm-400 text-xs font-semibold mb-4 animate-fadeIn">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('auth.name')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                    required
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-slate-400 uppercase tracking-widest">{t('auth.email')}</label>
                <input
                  type="email"
                  value={profile?.email}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 cursor-not-allowed focus:outline-none"
                  readOnly
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-widest">{t('auth.phone')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/40">
              <label className="text-slate-400 uppercase tracking-widest flex items-center">
                <Globe className="w-4 h-4 mr-2 text-farm-400" />
                Application UI Language / भाषायें
              </label>
              
              <div className="flex space-x-3">
                {['EN', 'HI'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang as Language)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase border tracking-wider transition-all ${
                      language === lang 
                        ? 'bg-farm-600 border-farm-500/25 text-white shadow-glow-green' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:bg-slate-900'
                    }`}
                  >
                    {lang === 'EN' ? 'English (EN)' : 'हिंदी (HI)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-3 rounded-xl bg-farm-600 hover:bg-farm-500 disabled:bg-slate-800 text-white font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 border border-farm-500/20 shadow-glow-green"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : t('btn.save')}</span>
            </button>
          </form>
        </div>

        {/* Fields Register column */}
        <div className="glass-panel border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 flex items-center">
                <LayoutGrid className="w-4 h-4 mr-2 text-farm-400" />
                Land Fields
              </h3>
              <button
                onClick={() => setShowAddField(!showAddField)}
                className="p-1 rounded-lg bg-farm-950/20 text-farm-400 hover:bg-farm-900 border border-farm-800/40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddField ? (
              <form onSubmit={handleAddField} className="space-y-3.5 text-xs font-bold bg-slate-950/30 border border-slate-850 p-4 rounded-2xl animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Field Title</label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. North Fields"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fieldSize}
                    onChange={(e) => setFieldSize(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Initial Crop</label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="e.g. Wheat"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingField}
                  className="w-full py-2.5 rounded-xl bg-farm-600 hover:bg-farm-500 disabled:bg-slate-850 text-white font-bold uppercase tracking-wider transition-all border border-farm-500/20"
                >
                  Create Field
                </button>
              </form>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {farms[0]?.fields.map((field: any) => (
                  <div key={field.id} className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-extrabold text-white">{field.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{field.size} Acres</p>
                    </div>

                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-farm-950/20 text-farm-400 border border-farm-800/30 text-[9px] font-bold uppercase">
                      <Leaf className="w-3.5 h-3.5 fill-current" />
                      <span>{field.cropCycles[0]?.cropName || 'Fallow'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center leading-relaxed">
            <HelpCircle className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
            <span>Adding new fields configures matching dashboard visual selectors automatically.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
