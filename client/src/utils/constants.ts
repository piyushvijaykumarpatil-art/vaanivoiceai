import type { ThemeConfig, VoiceLanguage, VoiceModelConfig, VoiceSettings } from '../types';

export const LUXURY_THEMES: ThemeConfig[] = [
  {
    id: 'gold',
    name: '24K Gold',
    subtitle: 'Imperial Onyx & Gold Radiance',
    primaryColor: '#F59E0B',
    bgColor: '#05070B',
    icon: '👑'
  },
  {
    id: 'emerald',
    name: 'Royal Emerald',
    subtitle: 'Sovereign Royal Jade Glassmorphism',
    primaryColor: '#10B981',
    bgColor: '#040A07',
    icon: '💎'
  },
  {
    id: 'sapphire',
    name: 'Celestial Sapphire',
    subtitle: 'Midnight Deep Blue Astral Radiance',
    primaryColor: '#3B82F6',
    bgColor: '#040714',
    icon: '🌌'
  },
  {
    id: 'ruby',
    name: 'Crimson Ruby',
    subtitle: 'Velvet Crimson Glow & Sovereignty',
    primaryColor: '#F43F5E',
    bgColor: '#0C0407',
    icon: '🌹'
  },
  {
    id: 'amethyst',
    name: 'Cyber Amethyst',
    subtitle: 'Mystic Purple Cosmic Aura',
    primaryColor: '#A855F7',
    bgColor: '#080411',
    icon: '🔮'
  },
  {
    id: 'cyan',
    name: 'Titanium Cyan',
    subtitle: 'Aurora Titanium Cyber Brilliance',
    primaryColor: '#06B6D4',
    bgColor: '#030A0D',
    icon: '⚡'
  }
];

export const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    voiceName: 'mr-IN-AarohiNeural',
    samplePhrase: 'नमस्कार! मी वाणी आहे, आपली शाही व्हॉईस सहाय्यक.',
    sampleQuestion: 'पियूष कोण आहेत आणि त्यांनी तुला कसे बनवले?'
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    voiceName: 'hi-IN-SwaraNeural',
    samplePhrase: 'नमस्ते! मैं वाणी हूँ, आपकी सार्वभौम आवाज साथी।',
    sampleQuestion: 'आज का पंचांग और तिथि क्या है?'
  },
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    voiceName: 'en-US-JennyNeural',
    samplePhrase: 'Greetings! I am Vaani, your sovereign voice AI companion.',
    sampleQuestion: 'Who created you and what is your royal origin?'
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    voiceName: 'te-IN-ShriftivNeural',
    samplePhrase: 'నమస్కారం! నేను మీ రాజ వాయిస్ ఏఐ సహచరిణి వాణిని.',
    sampleQuestion: 'ఈ రోజు తిథి మరియు పంచాంగం ఏమిటి?'
  },
  {
    id: 'kn',
    name: 'Komodo/Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    voiceName: 'kn-IN-SopacNeural',
    samplePhrase: 'ನಮಸ್ಕಾರ! ನಾನು ವಾಣಿ, ನಿಮ್ಮ ಧ್ವನಿ ಸಹಚರಿ.',
    sampleQuestion: 'ನಿಮ್ಮನ್ನು ಯಾರು ರಚಿಸಿದರು?'
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    voiceName: 'pa-IN-OurpresiNeural',
    samplePhrase: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਵਾਣੀ ਹਾਂ, ਤੁਹਾਡੀ ਸ਼ਾਹੀ ਸਾਥੀ।',
    sampleQuestion: 'ਪਿਊਸ਼ ਕੌਣ ਹੈ ਅਤੇ ਉਹ ਕਿੱਥੇ ਪੜ੍ਹਦਾ ਹੈ?'
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    voiceName: "ta-IN-PuiLov'Neural",
    samplePhrase: 'வணக்கம்! நான் வாணி, உங்கள் அரச குரல் AI துணை.',
    sampleQuestion: 'இன்றைய நல்ல நேரம் மற்றும் திதி என்ன?'
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    voiceName: 'bn-IN-TanithaeiNeural',
    samplePhrase: 'নমস্কার! আমি বাণী, আপনার রাজকীয় ভয়েস সঙ্গী।',
    sampleQuestion: 'পীযূষ কে এবং তিনি তোমাকে কীভাবে তৈরি করেছেন?'
  },
  {
    id: 'gu',
    name: 'Gujorari',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    voiceName: 'gu-IN-DiivaniNeural',
    samplePhrase: 'નમસ્તે! હું વાણી છું, તમારી શાહી વૉઇસ સહાયક.',
    sampleQuestion: 'આજનો પંચાંગ અને સમય શું છે?'
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    voiceName: 'ml-IN-SobhanaNeural',
    samplePhrase: 'നമസ്കാരം! ഞാൻ വാണിയാണ്, നിങ്ങളുടെ രാജകീയ വോയ്സ് എഐ സഹചാരി.',
    sampleQuestion: 'നിങ്ങളെ ആരാണ് നിർമ്മിച്ചത്?'
  }
];

export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
  en: [
    "Who is Piyush and how did he engineer you?",
    "What is today's Indian Calendar Tithi and Shravan season?",
    "What was my last question to you?",
    "Calculate 145 multiplied by 38",
    "Tell me an ancient sovereign legend from Indian history"
  ],
  hi: [
    "पीयूष कौन हैं और उन्होंने आपको कैसे बनाया?",
    "आज का भारतीय पंचांग और तिथि बताइए?",
    "मेरा पिछला सवाल क्या था?",
    "श्रावण मास का क्या आध्यात्मिक महत्व है?",
    "पुणे और महाराष्ट्र के ऐतिहासिक गौरव के बारे में बताएं"
  ],
  mr: [
    "पियूष कोण आहेत आणि त्यांनी तुला कसे बनवले?",
    "आजची तिथी, पंचांग आणि वेळ काय आहे?",
    "याआधी मी तुला काय विचारले होते?",
    "श्रावण महिन्याचे महत्त्व सांगा",
    "एस.जी.यू (SGU) आणि शिवरायांच्या इतिहासाबद्दल सांगा"
  ]
};

export const VOICE_MODELS: VoiceModelConfig[] = [
  {
    id: 'vaani-empress',
    name: 'Vaani Imperial',
    tag: 'Empress • Royal Melodic',
    gender: 'female',
    persona: 'imperial',
    pitch: 1.08,
    rate: 0.98,
    avatar: '👑',
    description: 'Warm, melodious, royal and culturally resonant female cadence.',
    sampleText: 'Greetings, sovereign seeker. I am VAANI • IMPERIAL EDITION, made by Piyush • 1st year student of SGU.'
  },
  {
    id: 'vaani-sovereign',
    name: 'Vaani Sovereign',
    tag: 'King • Deep Command',
    gender: 'male',
    persona: 'sovereign',
    pitch: 0.84,
    rate: 0.95,
    avatar: '⚡',
    description: 'Deep, commanding, authoritative and powerful masculine timbre.',
    sampleText: 'Stand tall. I am Vaani Sovereign, your commanding voice AI companion.'
  },
  {
    id: 'neural-studio',
    name: 'Studio Neural',
    tag: 'Ultra-Clear • Balanced',
    gender: 'female',
    persona: 'studio',
    pitch: 1.0,
    rate: 1.02,
    avatar: '🔮',
    description: 'Crisp, crystal-clear, modern studio-grade neural precision.',
    sampleText: 'Studio Neural voice model online with ultra-low latency response.'
  },
  {
    id: 'regional-maestro',
    name: 'Regional Maestro',
    tag: 'Native Accent • Cultural',
    gender: 'female',
    persona: 'natural',
    pitch: 1.0,
    rate: 1.0,
    avatar: '🌐',
    description: 'Native Indian phonetic inflection tailored for Marathi, Hindi, Telugu & more.',
    sampleText: 'नमस्कार, मी वाणी आहे. पियूष यांनी मला अतिशय कुशलतेने तयार केले आहे.'
  }
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  modelId: 'vaani-empress',
  pitch: 1.08,
  rate: 0.98,
  volume: 1.0,
  handsFreeAutoSend: true
};

