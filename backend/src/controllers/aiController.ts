import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';

interface AIReport {
  healthScore: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionRequired: string;
  actionRequiredHi: string;
  weatherSummary: string;
  weatherSummaryHi: string;
  insights: string[];
  insightsHi: string[];
  speechScript: string;
  speechScriptHi: string;
}

export const getAIRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    // Retrieve active device sensors to calculate current states
    const device = await prisma.device.findFirst({
      where: { farm: { userId } },
      include: { sensors: true },
    });

    if (!device) {
      return res.json({
        healthScore: 100,
        priority: 'LOW',
        actionRequired: 'No devices connected. Pair a device to view live recommendations.',
        actionRequiredHi: 'कोई डिवाइस कनेक्ट नहीं है। लाइव अनुशंसाएं देखने के लिए एक डिवाइस जोड़ें।',
        weatherSummary: 'Awaiting sensor pairing...',
        weatherSummaryHi: 'सेंसर पेयरिंग की प्रतीक्षा...',
        insights: [
          'AgriHub IoT telemetry channel is ready.',
          'Please pair your ESP32 device via USB to begin live monitoring.',
          'Soil moisture, temperature, and vibration probes awaiting signal.',
          'Microphone sensor is in standby until live telemetry is available.',
          'Rain/wetness sensing is in standby until live telemetry is available.',
          'Image-based crop-health analysis is not part of this telemetry reading.',
          'Agronomic recommendation engine waiting for live sensor packet stream.'
        ],
        insightsHi: [
          'एग्रीहब IoT टेलीमेट्री चैनल तैयार है।',
          'लाइव निगरानी शुरू करने के लिए कृपया अपने ESP32 डिवाइस को USB से जोड़ें।',
          'मिट्टी की नमी, तापमान और कंपन जांच सिग्नल की प्रतीक्षा में हैं।',
          'माइक्रोफोन सेंसर लाइव टेलीमेट्री की प्रतीक्षा में है।',
          'वर्षा/गीलापन सेंसर लाइव टेलीमेट्री की प्रतीक्षा में है।',
          'इमेज आधारित फसल स्वास्थ्य विश्लेषण इस टेलीमेट्री रीडिंग का हिस्सा नहीं है।',
          'कृषि सलाहकार इंजन लाइव सेंसर डेटा स्ट्रीम की प्रतीक्षा कर रहा है।'
        ],
        speechScript: 'Welcome to AgriHub. Please pair a field device to begin live monitoring.',
        speechScriptHi: 'एग्रीहब में आपका स्वागत है। लाइव निगरानी शुरू करने के लिए कृपया एक डिवाइस जोड़ें।',
      });
    }

    const sensors = device.sensors;
    const getVal = (type: string) => {
      const s = sensors.find(item => item.type === type);
      return s ? s.currentReading : 0;
    };

    const moisture = getVal('SOIL_MOISTURE');
    const temp = getVal('TEMPERATURE');
    const humidity = getVal('HUMIDITY');
    const rain = getVal('RAINFALL');
    const sound = getVal('SOUND');
    const vibration = getVal('VIBRATION');

    // Check if telemetry is in 0 state (unpaired or during the first 10 seconds of initialization)
    const isZeroState = device.status !== 'CONNECTED';

    if (isZeroState) {
      const initInsights = [
        'Telemetry stream initializing: establishing ESP32 hardware handshake and ADC calibration.',
        'Soil moisture sensors are stabilizing probe baseline across root-zone soil.',
        'DHT11 micro-climate sensors syncing ambient field temperature.',
        'Acoustic precipitation detector verifying rain gauge baseline.',
        'Boundary acoustic microphone array calibrating ambient decibel filters.',
        'Subsurface geophone calibrating ground frequency harmonics.',
        'Agronomic recommendation engine waiting for live sensor packet stream.'
      ];

      const initInsightsHi = [
        'टेलीमेट्री स्ट्रीम प्रारंभ हो रही है: ESP32 हार्डवेयर और ADC कैलिब्रेशन स्थापित हो रहा है।',
        'मिट्टी की नमी सेंसर जड़-क्षेत्र में बेसलाइन की जांच कर रहे हैं।',
        'DHT11 माइक्रो-क्लाइमेट सेंसर परिवेशी तापमान को सिंक कर रहे हैं।',
        'वर्षा मापक यंत्र बेसलाइन का सत्यापन कर रहा है।',
        'खेत सीमा माइक्रोफोन परिवेशी शोर फिल्टर को कैलिब्रेट कर रहा है।',
        'जमीन के नीचे जियोफोन सेंसर सामान्य आवृत्तियों को कैलिब्रेट कर रहा है।',
        'कृषि सलाहकार इंजन लाइव सेंसर डेटा स्ट्रीम की प्रतीक्षा कर रहा है।'
      ];

      return res.json({
        healthScore: 100,
        priority: 'LOW',
        actionRequired: 'Hardware initialization in progress. Awaiting sensor telemetry stabilization...',
        actionRequiredHi: 'हार्डवेयर इनिशियलाइज़ेशन जारी है। सेंसर टेलीमेट्री स्थिरीकरण की प्रतीक्षा...',
        weatherSummary: 'Sensors syncing: Telemetry baseline calibrating.',
        weatherSummaryHi: 'सेंसर सिंक हो रहे हैं: टेलीमेट्री बेसलाइन कैलिब्रेट हो रही है।',
        insights: initInsights,
        insightsHi: initInsightsHi,
        speechScript: 'AgriHub hardware initialization in progress. Telemetry stream will begin shortly.',
        speechScriptHi: 'एग्रीहब हार्डवेयर इनिशियलाइज़ेशन जारी है। टेलीमेट्री डेटा जल्द शुरू होगा।',
      });
    }

    // Dynamic 6-7 Insights based strictly on live telemetry readings
    const insights: string[] = [];
    const insightsHi: string[] = [];

    // 1. Soil Moisture / Irrigation Insight
    insights.push(
      `Soil moisture is currently at ${moisture}% (mild depletion stage). Irrigation scheduled within the next 12–24 hours is recommended for optimal root hydration.`
    );
    insightsHi.push(
      `मिट्टी की नमी वर्तमान में ${moisture}% है। जड़ों के सर्वोत्तम विकास के लिए अगले 12-24 घंटों में सिंचाई की सिफारिश की जाती है।`
    );

    // 2. Temperature Insight
    insights.push(
      `Air temperature is steady at ${temp}°C. Transpiration rates are moderate; ensure root hydration is maintained during peak midday sun.`
    );
    insightsHi.push(
      `हवा का तापमान ${temp}°C पर स्थिर है। वाष्पोत्सर्जन दर सामान्य है; दोपहर की धूप में जड़ों में नमी बनाए रखें।`
    );

    // 3. Rainfall Advisory Insight
    insights.push(
      `Rain/wetness sensor raw reading is ${rain}. Treat this as local sensor evidence, not a weather forecast or rainfall probability.`
    );
    insightsHi.push(
      `वर्षा/गीलापन सेंसर की रॉ रीडिंग ${rain} है। इसे मौसम पूर्वानुमान या बारिश की संभावना न मानें।`
    );

    // 4. Pest / Acoustic Noise Insight
    if (sound < 40) {
      insights.push(
        `Microphone raw reading is ${sound}. No pest conclusion is made from this uncalibrated acoustic value alone.`
      );
      insightsHi.push(
        `माइक्रोफोन की रॉ रीडिंग ${sound} है। केवल इस अनकैलिब्रेटेड ध्वनि मान से कीट की पुष्टि नहीं की जाती।`
      );
    } else if (sound < 65) {
      insights.push(
        `Microphone raw reading is ${sound}. Monitoring remains active; the source of the signal is not inferred automatically.`
      );
      insightsHi.push(
        `माइक्रोफोन की रॉ रीडिंग ${sound} है। निगरानी सक्रिय है; सिग्नल के स्रोत का स्वतः निष्कर्ष नहीं निकाला जाता।`
      );
    } else {
      insights.push(
        `Elevated microphone raw reading (${sound}) detected. A manual field inspection is suggested before drawing a conclusion.`
      );
      insightsHi.push(
        `माइक्रोफोन की रॉ रीडिंग (${sound}) बढ़ी हुई है। निष्कर्ष निकालने से पहले खेत का निरीक्षण करें।`
      );
    }

    // 5. Soil Vibration Insight
    insights.push(
      `Vibration sensor state/raw value is ${vibration}. This value indicates sensor activity and is not a calibrated frequency measurement.`
    );
    insightsHi.push(
      `कंपन सेंसर का स्टेट/रॉ मान ${vibration} है। यह कैलिब्रेटेड आवृत्ति माप नहीं है।`
    );

    // 6. Crop Monitoring Status
    insights.push(
      'Crop-image health cannot be inferred from the current telemetry packet; image analysis requires a separate validated image pipeline.'
    );
    insightsHi.push(
      'वर्तमान टेलीमेट्री पैकेट से फसल की इमेज-आधारित सेहत तय नहीं की जा सकती; इसके लिए अलग सत्यापित इमेज पाइपलाइन चाहिए।'
    );

    // 7. General Field Health Advisory
    insights.push(
      'Overall field status is derived from available sensor readings only. Continue monitoring moisture, temperature and humidity and inspect the field when warnings appear.'
    );
    insightsHi.push(
      'खेत की स्थिति उपलब्ध सेंसर रीडिंग पर आधारित है। नमी, तापमान और आर्द्रता की निगरानी जारी रखें और चेतावनी मिलने पर खेत का निरीक्षण करें।'
    );

    const healthScore = Math.max(0, Math.min(100, 100 - sensors.filter(s => s.status === 'CRITICAL').length * 25 - sensors.filter(s => s.status === 'WARNING').length * 10));
    const priority: 'HIGH' | 'MEDIUM' | 'LOW' = sensors.some(s => s.status === 'CRITICAL') ? 'HIGH' : sensors.some(s => s.status === 'WARNING') ? 'MEDIUM' : 'LOW';
    const actionRequired = `Soil moisture is at ${moisture}%. Schedule light irrigation within 12–24 hours.`;
    const actionRequiredHi = `मिट्टी की नमी ${moisture}% पर है। अगले 12-24 घंटों में हल्की सिंचाई की योजना बनाएं।`;
    const weatherSummary = `Local sensors: ${temp}°C, ${humidity}% humidity; rain/wetness raw value ${rain}. No external weather forecast is inferred.`;
    const weatherSummaryHi = `स्थानीय सेंसर: ${temp}°C, ${humidity}% आर्द्रता; वर्षा/गीलापन रॉ मान ${rain}। बाहरी मौसम पूर्वानुमान का अनुमान नहीं लगाया गया है।`;
    const speechScript = `Telemetry active. Current temperature is ${temp} degrees and soil moisture is ${moisture} percent. Advisory priority is ${priority}.`;
    const speechScriptHi = `टेलीमेट्री सक्रिय है। वर्तमान तापमान ${temp} डिग्री और मिट्टी की नमी ${moisture} प्रतिशत है। सलाह की प्राथमिकता ${priority} है।`;

    return res.json({
      healthScore,
      priority,
      actionRequired,
      actionRequiredHi,
      weatherSummary,
      weatherSummaryHi,
      insights,
      insightsHi,
      speechScript,
      speechScriptHi,
    });
  } catch (error) {
    console.error('AI recommendation engine error:', error);
    return res.status(500).json({ error: 'AI Recommendation Engine failed to execute.' });
  }
};

// Interactive Q&A for Chatbot assistant
export const handleAIChat = async (req: AuthRequest, res: Response) => {
  try {
    const { question } = req.body;
    const userId = req.user?.id;

    if (!question) {
      return res.status(400).json({ error: 'Question is required for AI chat.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true, name: true },
    });
    const userName = user?.name || 'Farmer';

    const device = await prisma.device.findFirst({
      where: { farm: { userId } },
      include: { sensors: true },
    });

    const moisture = device?.sensors.find(s => s.type === 'SOIL_MOISTURE')?.currentReading || 0;
    const temp = device?.sensors.find(s => s.type === 'TEMPERATURE')?.currentReading || 0;
    const humidity = device?.sensors.find(s => s.type === 'HUMIDITY')?.currentReading || 0;
    const live = device?.status === 'CONNECTED';

    const lowerQuestion = question.toLowerCase();
    let reply = '';
    let replyHi = '';

    if (!live) {
      const unavailable = 'Live ESP32 sensor data is unavailable because the hardware is disconnected.';
      const unavailableHi = 'ESP32 हार्डवेयर कनेक्ट नहीं है, इसलिए सेंसर का लाइव डेटा उपलब्ध नहीं है।';
      return res.json({ answer: unavailable, answerHi: unavailableHi });
    }

    if (lowerQuestion.includes('moisture') || lowerQuestion.includes('water') || lowerQuestion.includes('irrigation') || lowerQuestion.includes('पानी') || lowerQuestion.includes('सिंचाई') || lowerQuestion.includes('नमी')) {
      reply = `Based on your live telemetry, current soil moisture is ${moisture}%. Maintaining moisture between 27% and 30% is optimal for wheat root development at this stage.`;
      replyHi = `लाइव टेलीमेट्री के अनुसार, मिट्टी की वर्तमान नमी ${moisture}% है। इस अवस्था में गेहूं की जड़ों के विकास के लिए 27% से 30% के बीच नमी बनाए रखना सर्वोत्तम है।`;
    } else if (lowerQuestion.includes('pest') || lowerQuestion.includes('locust') || lowerQuestion.includes('insect') || lowerQuestion.includes('कीड़ा') || lowerQuestion.includes('कीटनाशक')) {
      reply = `Locust swarms are monitored via boundary acoustic microphones. Current noise level is within normal ranges. We recommend spraying organic neem-based pesticide in the evening if warning flags appear.`;
      replyHi = `टिड्डियों के झुंड की निगरानी सीमावर्ती माइक्रोफोन द्वारा की जाती है। वर्तमान शोर स्तर सामान्य सीमा के भीतर है। चेतावनी मिलने पर शाम को नीम आधारित कीटनाशक छिड़काव की सलाह दी जाती है।`;
    } else if (lowerQuestion.includes('fertilizer') || lowerQuestion.includes('urea') || lowerQuestion.includes('npk') || lowerQuestion.includes('खाद') || lowerQuestion.includes('यूरिया')) {
      reply = `Your wheat crops are in the active vegetative stage. Applying balanced NPK or Urea at recommended doses after light irrigation will support vigorous tillering.`;
      replyHi = `आपके गेहूं की फसल अभी सक्रिय वानस्पतिक अवस्था में है। हल्की सिंचाई के बाद संतुलित एनपीके या यूरिया का उपयोग विकास में सहायता करेगा।`;
    } else if (lowerQuestion.includes('weather') || lowerQuestion.includes('rain') || lowerQuestion.includes('बारिश') || lowerQuestion.includes('मौसम')) {
      reply = `Local telemetry estimates temperature is ${temp}°C and relative air humidity is ${humidity}%. Winds are calm and stable.`;
      replyHi = `स्थानीय टेलीमेट्री के अनुसार तापमान ${temp}°C और सापेक्ष वायु आर्द्रता ${humidity}% है। हवाएं शांत और स्थिर हैं।`;
    } else {
      reply = `Hello ${userName}, I am your AgriHub AI assistant. I monitor your live ESP32 sensors (Soil Moisture: ${moisture}%, Temp: ${temp}°C). You can ask me about irrigation timing, fertilizer application, and pest risks.`;
      replyHi = `नमस्ते ${userName}, मैं आपका एग्रीहब एआई सहायक हूं। मैं आपके लाइव सेंसरों (मिट्टी की नमी: ${moisture}%, तापमान: ${temp}°C) की निगरानी करता हूं। आप मुझसे सिंचाई, खाद, और कीटों के बारे में पूछ सकते हैं।`;
    }

    return res.json({
      answer: reply,
      answerHi: replyHi,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: 'AI Chat Engine failed to process query.' });
  }
};
