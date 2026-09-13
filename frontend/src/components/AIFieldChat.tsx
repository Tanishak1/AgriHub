import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { aiAPI } from '../services/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AIFieldChat: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message based on language selector
  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text: language === 'EN' ? t('chat.welcome') : 'नमस्ते। मैं आपके लाइव सेंसरों की निगरानी कर रहा हूं। मुझसे सिंचाई, जल स्तर, कीटों के खतरे या खाद छिड़काव के बारे में कुछ भी पूछें!',
        timestamp: new Date(),
      },
    ]);
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Web Speech API synthesis
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select voice according to language toggle
    if (language === 'HI') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const response = await aiAPI.askChat(userMsg);
      const answer = language === 'EN' ? response.data.answer : response.data.answerHi;

      setMessages(prev => [...prev, { sender: 'ai', text: answer, timestamp: new Date() }]);
      
      // Speak response aloud
      speakText(answer);
    } catch (err) {
      console.error(err);
      const errMsg = language === 'EN' 
        ? 'Apologies, my telemetry links are down. Please check back shortly.'
        : 'क्षमा करें, मेरा टेलीमेट्री संपर्क टूट गया है। कृपया थोड़ी देर में पुनः प्रयास करें।';
      setMessages(prev => [...prev, { sender: 'ai', text: errMsg, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] glass-panel border border-slate-700/50 rounded-2xl shadow-glass flex flex-col mb-4 overflow-hidden animate-slideUp">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-farm-900/60 to-slate-900 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-farm-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{t('chat.header')}</h3>
                <span className="text-[10px] text-farm-400 font-semibold uppercase tracking-widest">Active Agronomist</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Text to Speech Toggle */}
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) window.speechSynthesis.cancel();
                }}
                className={`p-1.5 rounded transition-all border ${
                  voiceEnabled 
                    ? 'bg-farm-900/40 text-farm-300 border-farm-800/40' 
                    : 'text-slate-500 hover:text-slate-300 border-transparent'
                }`}
                title={voiceEnabled ? t('chat.voiceOff') : t('chat.voiceOn')}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis.cancel();
                }}
                className="p-1 rounded text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Board */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[80%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-farm-600 text-white rounded-br-none shadow-glow-green'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/30 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl rounded-bl-none text-xs text-slate-400 max-w-[50%]">
                <div className="w-1.5 h-1.5 bg-farm-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-farm-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-farm-400 rounded-full animate-bounce delay-150"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800/60 bg-slate-900/60 flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-farm-500/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-farm-600 hover:bg-farm-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-glow-green"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Windmill Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) window.speechSynthesis.cancel();
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-glow-green text-3xl focus:outline-none transition-all duration-300 hover:scale-105 active:scale-95 border ${
          isOpen 
            ? 'bg-slate-900 border-red-500/30 text-red-400 rotate-90' 
            : 'bg-gradient-to-tr from-farm-700 to-farm-400 border-farm-500/30 text-white'
        }`}
        title="Activate AI Advisor"
      >
        <div className="w-full h-full flex items-center justify-center animate-spin-slow">
          {/* Custom SVG Windmill/Flower shape representing AgriHub wireframe logo */}
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A3,3,0,0,0,9,5V9.17A5.94,5.94,0,0,0,7.24,10.2L4.31,7.27a3,3,0,0,0-4.24,4.24l2.93,2.93A5.94,5.94,0,0,0,4,16.18V20a3,3,0,0,0,6,0V15.83a5.94,5.94,0,0,0,1.76-1L14.69,17.7a3,3,0,0,0,4.24-4.24l-2.93-2.93a5.94,5.94,0,0,0,.08-1.7V5A3,3,0,0,0,12,2Zm1.5,7a1.5,1.5,0,1,1-1.5-1.5A1.5,1.5,0,0,1,13.5,9Z"/>
          </svg>
        </div>
      </button>
    </div>
  );
};
