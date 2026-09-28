export type LuxuryThemeId = 'gold' | 'emerald' | 'sapphire' | 'ruby' | 'amethyst' | 'cyan';

export interface ThemeConfig {
  id: LuxuryThemeId;
  name: string;
  subtitle: string;
  primaryColor: string;
  bgColor: string;
  icon: string;
}

export interface VoiceLanguage {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  voiceName: string;
  samplePhrase: string;
  sampleQuestion: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: string;
  language?: string;
}

export interface SessionRecord {
  id: string;
  title: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  language: string;
  personality: string;
  messages: ChatMessage[];
  message_count: number;
  created_at: string;
}

export interface CalendarContext {
  istTime: string;
  istDate: string;
  dayOfWeek: string;
  tithi: string;
  paksha: string;
  season: string;
  isShravan: boolean;
  upcomingFestival: {
    name: string;
    description: string;
  };
  weatherSimulation: {
    city: string;
    temperature: string;
    condition: string;
  };
}

export interface MemoryRecord {
  id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRecord {
  id: string;
  rating: number;
  category: string;
  comments: string;
  user_name: string;
  created_at: string;
}

export type VoiceGender = 'female' | 'male';
export type VoicePersona = 'imperial' | 'sovereign' | 'studio' | 'natural';

export interface VoiceModelConfig {
  id: string;
  name: string;
  tag: string;
  gender: VoiceGender;
  persona: VoicePersona;
  pitch: number;
  rate: number;
  description: string;
  sampleText: string;
  avatar: string;
}

export interface VoiceSettings {
  modelId: string;
  pitch: number;
  rate: number;
  volume: number;
  handsFreeAutoSend: boolean;
  systemVoiceName?: string;
}

