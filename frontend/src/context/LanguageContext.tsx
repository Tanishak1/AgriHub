import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'HI';

type TranslationKeys = Record<string, string>;

const translations: Record<Language, TranslationKeys> = {
  EN: {
    // Auth & Generic
    'app.name': 'AgriHub',
    'app.tagline': 'Smart IoT Agriculture & AI Advisor',
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.location': 'Farm Location',
    'auth.submit': 'Submit',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'btn.back': 'Back',
    'btn.next': 'Next',
    'btn.save': 'Save Changes',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Remove',

    // Welcome Page
    'welcome.loading': 'Connecting to Agricultural IoT...',
    'welcome.enter': 'Enter Platform',

    // Setup Page
    'setup.title': 'Platform Set-up Guide',
    'setup.tab1': '1. About AgriHub',
    'setup.tab2': '2. How it Works',
    'setup.tab3': '3. Installation Guide',
    'setup.tab1.title': 'About the AgriHub System',
    'setup.tab1.body': 'AgriHub is a smart farming framework utilizing ESP32 microcontrollers and specialized sensors to assess environmental risk. By combining physical telemetry with real-time weather APIs and simulated agronomy models, it helps farmers optimize water consumption, forecast crop yield conditions, and receive early warnings for pest intrusions or high-wind soil stressors.',
    'setup.tab2.title': 'AgriHub Data Pipelines',
    'setup.tab2.body': 'Our communication pipeline streams live inputs seamlessly: Sensors on the field connect to an ESP32 hub -> Data transmits via USB-C or local Serial Bridge -> Express WebSockets (Socket.IO) capture the data stream -> Frontend displays live graphs, triggers threshold alerts, and feeds the AI recommender.',
    'setup.tab3.title': 'Field Sensor Installation Guide',
    'setup.tab3.moisture': '1. Soil Moisture Probe: Insert the metal fork vertically into the root-zone soil (approx 10-15cm deep). Keep away from stone contact.',
    'setup.tab3.dht22': '2. Temperature & Humidity (DHT22): Suspend under a ventilated white shield canopy. Do not expose to direct sun rays or water puddles.',
    'setup.tab3.rain': '3. Rain Gauge: Install on a level, unblocked platform at least 1.5m above ground to capture rainfall unobstructed.',
    'setup.tab3.mic': '4. Pest Microphone: Position on a structural crop boundary stake, sheltered inside a sound-permeable rain-shield to detect insect swarm noise.',
    'setup.tab3.vibe': '5. Geophone/Vibration Sensor: Bury securely 5cm underground near the field entrance to monitor mechanical run-off or animal crossings.',
    'setup.cta': 'Proceed to Dashboard',

    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.setup': 'Set-up Guide',
    'nav.devices': 'Devices',
    'nav.profile': 'Profile',
    'nav.cropHealth': 'Crop Health',
    'nav.sensorHealth': 'Sensor Health',
    'nav.admin': 'Admin Panel',

    // Dashboard Overview
    'dash.title': 'Farm Dashboard Overview',
    'dash.telemetryTitle': 'Live Field Telemetry',
    'dash.healthTitle': 'Crop Performance Advisory',
    'dash.activeAlerts': 'Active Environmental Alerts',
    'dash.recentLogs': 'System Telemetry Feed',
    'dash.score': 'Health Index',
    'dash.advisory': 'AI Agronomist Advice',
    'dash.priority': 'Task Severity',
    'dash.action': 'Recommended Action',
    'dash.weather': 'Weather Advisory',
    'dash.noAlerts': 'No warning alerts active. Crops are healthy.',
    'dash.simulationMode': 'SIMULATION TELEMETRY ACTIVE',

    // Sensors
    'sensor.SOIL_MOISTURE': 'Soil Moisture',
    'sensor.TEMPERATURE': 'Air Temperature',
    'sensor.HUMIDITY': 'Air Humidity',
    'sensor.RAINFALL': 'Rainfall Probability',
    'sensor.SOUND': 'Pest Noise Level',
    'sensor.VIBRATION': 'Soil Vibration',
    'sensor.status': 'Status',
    'sensor.current': 'Current Value',
    'sensor.min': 'Min Safe Limit',
    'sensor.max': 'Max Safe Limit',
    'sensor.editThresholds': 'Configure Sensor Thresholds',
    'sensor.history': 'Historical Trend Logs',

    // Devices & Simulator
    'dev.title': 'Agricultural Devices',
    'dev.addBtn': 'Register New Device',
    'dev.id': 'Device Serial ID',
    'dev.name': 'Custom Name',
    'dev.type': 'Connection Interface',
    'dev.lastSeen': 'Last Active Sync',
    'dev.status': 'Connection Status',
    'dev.firmware': 'Firmware Version',
    'dev.simulatorCtrl': 'Hardware Simulation Controls',
    'dev.simStatus': 'Simulation Active',
    'dev.simStatusOn': 'Running',
    'dev.simStatusOff': 'Paused',
    'dev.simErrors': 'Inject Sensor Failures',
    'dev.simConnState': 'Force Device Status',
    'dev.resetBtn': 'Reset Override Parameters',
    'dev.serialHeader': 'Direct Web Serial Connector',
    'dev.serialConnect': 'Pair USB Device',
    'dev.serialDisconnect': 'Close Serial Port',
    'dev.serialLogs': 'Raw Serial Console Feed',

    // AI Chatbot
    'chat.header': 'AgriHub AI Advisor',
    'chat.placeholder': 'Ask a question about irrigation, pests, or fertilizer...',
    'chat.welcome': 'Namaste. I am checking your live sensors. Ask me anything about crop cycles, water needs, or fertilizer!',
    'chat.voiceOn': 'Audio Alerts Activated',
    'chat.voiceOff': 'Audio Alerts Muted',
  },
  HI: {
    // Auth & Generic
    'app.name': 'एग्रीहब',
    'app.tagline': 'स्मार्ट IoT कृषि और AI सलाहकार',
    'auth.login': 'लॉग इन करें',
    'auth.signup': 'साइन अप करें',
    'auth.logout': 'लॉग आउट',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.phone': 'फ़ोन नंबर',
    'auth.location': 'खेत का स्थान',
    'auth.submit': 'सबमिट करें',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.hasAccount': 'पहले से खाता है?',
    'btn.back': 'पीछे',
    'btn.next': 'आगे',
    'btn.save': 'परिवर्तन सहेजें',
    'btn.cancel': 'रद्द करें',
    'btn.delete': 'हटाएं',

    // Welcome Page
    'welcome.loading': 'कृषि IoT से जुड़ रहा है...',
    'welcome.enter': 'प्लेटफ़ॉर्म में प्रवेश करें',

    // Setup Page
    'setup.title': 'सिस्टम सेट-अप गाइड',
    'setup.tab1': '1. एग्रीहब के बारे में',
    'setup.tab2': '2. यह कैसे काम करता है',
    'setup.tab3': '3. स्थापना गाइड',
    'setup.tab1.title': 'एग्रीहब प्रणाली के बारे में',
    'setup.tab1.body': 'एग्रीहब एक स्मार्ट कृषि ढांचा है जो पर्यावरण जोखिम का आकलन करने के लिए ESP32 और विशेष सेंसरों का उपयोग करता है। वास्तविक समय के मौसम API और कृत्रिम बुद्धिमत्ता (AI) के साथ भौतिक टेलीमेट्री को जोड़कर, यह किसानों को पानी की खपत को अनुकूलित करने, फसल की उपज का अनुमान लगाने और कीटों के हमले या मिट्टी के तनाव के बारे में समय पर चेतावनी प्रदान करता है।',
    'setup.tab2.title': 'एग्रीहब डेटा प्रक्रिया',
    'setup.tab2.body': 'हमारी संचार प्रणाली लाइव इनपुट को आसानी से प्रसारित करती है: खेत के सेंसर ESP32 हब से जुड़ते हैं -> डेटा USB-C या लोकल सीरियल ब्रिज द्वारा भेजा जाता है -> बैकएंड (Socket.IO) डेटा प्रवाह को कैप्चर करता है -> फ्रंटएंड लाइव ग्राफ दिखाता है और AI को फीड प्रदान करता है।',
    'setup.tab3.title': 'खेत में सेंसर लगाने की विधि',
    'setup.tab3.moisture': '1. मिट्टी की नमी सेंसर: धातु के कांटे को जड़ों के पास मिट्टी में लंबवत (लगभग 10-15 सेमी गहरा) डालें। पत्थर के संपर्क से दूर रखें।',
    'setup.tab3.dht22': '2. तापमान और आर्द्रता (DHT22): इसे छायादार हवादार सफेद ढाल के नीचे लटकाएं। सीधे धूप या पानी के संपर्क में न आने दें।',
    'setup.tab3.rain': '3. वर्षा मापक: बारिश को ठीक से मापने के लिए जमीन से कम से कम 1.5 मीटर ऊपर एक समतल, खुले मंच पर स्थापित करें।',
    'setup.tab3.mic': '4. कीट माइक्रोफोन: कीटों के शोर का पता लगाने के लिए इसे खेत की सीमा पर हवादार वॉटरप्रूफ प्लास्टिक कवर के अंदर लगाएं।',
    'setup.tab3.vibe': '5. कंपन सेंसर (जियोफोन): जंगली जानवरों या ट्रैक्टरों के प्रवेश की निगरानी के लिए खेत के प्रवेश द्वार के पास 5 सेमी गहरा सुरक्षित रूप से दफनाएं।',
    'setup.cta': 'डैशबोर्ड पर जाएं',

    // Navbar
    'nav.dashboard': 'डैशबोर्ड',
    'nav.setup': 'सेट-अप गाइड',
    'nav.devices': 'डिवाइस',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.cropHealth': 'फसल स्वास्थ्य',
    'nav.sensorHealth': 'सेंसर स्वास्थ्य',
    'nav.admin': 'एडमिन पैनल',

    // Dashboard Overview
    'dash.title': 'खेत डैशबोर्ड अवलोकन',
    'dash.telemetryTitle': 'लाइव फील्ड टेलीमेट्री',
    'dash.healthTitle': 'फसल प्रदर्शन सलाहकार',
    'dash.activeAlerts': 'सक्रिय पर्यावरण चेतावनियां',
    'dash.recentLogs': 'सिस्टम टेलीमेट्री फीड',
    'dash.score': 'स्वास्थ्य सूचकांक',
    'dash.advisory': 'AI कृषि वैज्ञानिक सलाह',
    'dash.priority': 'कार्य की गंभीरता',
    'dash.action': 'अनुशंसित कार्रवाई',
    'dash.weather': 'मौसम सलाहकार',
    'dash.noAlerts': 'कोई चेतावनी सक्रिय नहीं है। फसलें स्वस्थ हैं।',
    'dash.simulationMode': 'सिमुलेशन टेलीमेट्री सक्रिय है',

    // Sensors
    'sensor.SOIL_MOISTURE': 'मिट्टी की नमी',
    'sensor.TEMPERATURE': 'हवा का तापमान',
    'sensor.HUMIDITY': 'हवा की आर्द्रता',
    'sensor.RAINFALL': 'बारिश की संभावना',
    'sensor.SOUND': 'कीट शोर स्तर',
    'sensor.VIBRATION': 'मिट्टी का कंपन',
    'sensor.status': 'स्थिति',
    'sensor.current': 'वर्तमान मूल्य',
    'sensor.min': 'न्यूनतम सुरक्षित सीमा',
    'sensor.max': 'अधिकतम सुरक्षित सीमा',
    'sensor.editThresholds': 'सेंसर सीमाएं सेट करें',
    'sensor.history': 'ऐतिहासिक रुझान लॉग',

    // Devices & Simulator
    'dev.title': 'कृषि उपकरण',
    'dev.addBtn': 'नया उपकरण पंजीकृत करें',
    'dev.id': 'डिवाइस सीरियल ID',
    'dev.name': 'डिवाइस का नाम',
    'dev.type': 'कनेक्शन इंटरफ़ेस',
    'dev.lastSeen': 'अंतिम सक्रिय सिंक',
    'dev.status': 'कनेक्शन स्थिति',
    'dev.firmware': 'फर्मवेयर संस्करण',
    'dev.simulatorCtrl': 'हार्डवेयर सिमुलेशन नियंत्रण',
    'dev.simStatus': 'सिमुलेशन सक्रिय है',
    'dev.simStatusOn': 'सक्रिय',
    'dev.simStatusOff': 'रुका हुआ',
    'dev.simErrors': 'कृत्रिम सेंसर खराबी लागू करें',
    'dev.simConnState': 'कृत्रिम डिवाइस स्थिति बदलें',
    'dev.resetBtn': 'पैरामीटर रीसेट करें',
    'dev.serialHeader': 'सीधा वेब सीरियल कनेक्टर',
    'dev.serialConnect': 'USB डिवाइस जोड़ें',
    'dev.serialDisconnect': 'सीरियल पोर्ट बंद करें',
    'dev.serialLogs': 'रॉ सीरियल कंसोल फीड',

    // AI Chatbot
    'chat.header': 'एग्रीहब AI सलाहकार',
    'chat.placeholder': 'सिंचाई, कीट या खाद के बारे में पूछें...',
    'chat.welcome': 'नमस्ते। मैं आपके लाइव सेंसर की जांच कर रहा हूं। फसल चक्र, पानी की आवश्यकता या खाद के बारे में कुछ भी पूछें!',
    'chat.voiceOn': 'आवाज अलर्ट चालू हैं',
    'chat.voiceOff': 'आवाज अलर्ट बंद हैं',
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('EN');

  useEffect(() => {
    const saved = localStorage.getItem('agrihub_lang') as Language;
    if (saved === 'EN' || saved === 'HI') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrihub_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['EN'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
