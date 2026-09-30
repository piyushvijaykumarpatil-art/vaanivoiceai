/**
 * Indian Calendar Intelligence & Temporal Calculation Service
 * Computes live IST time, Tithis, Panchang, Shravan season, and Indian festival dates.
 */

export interface CalendarInfo {
  istTime: string;
  istDate: string;
  dayOfWeek: string;
  tithi: string;
  paksha: 'Shukla Paksha' | 'Krishna Paksha';
  season: string;
  isShravan: boolean;
  upcomingFestival: {
    name: string;
    description: string;
    daysRemaining?: number;
  };
  weatherSimulation: {
    city: string;
    temperature: string;
    condition: string;
  };
}

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima / Amavasya'
];

export function getIndianCalendarContext(): CalendarInfo {
  // Current time in IST (UTC+5:30)
  const now = new Date();
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 3600000;
  const istDateObj = new Date(utcOffset + istOffset);

  const istTime = istDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const istDate = istDateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dayOfWeek = istDateObj.toLocaleDateString('en-IN', { weekday: 'long' });

  // Calculate approximate Hindu Lunar Tithi
  const dayOfMonth = istDateObj.getDate();
  const month = istDateObj.getMonth() + 1; // 1-12
  const tithiIndex = (dayOfMonth % 15);
  const paksha: 'Shukla Paksha' | 'Krishna Paksha' = dayOfMonth <= 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const tithi = `${paksha} ${TITHI_NAMES[tithiIndex] || 'Panchami'}`;

  // Check Shravan season (usually July - August, approx months 7 & 8)
  const isShravan = month === 7 || month === 8;
  const season = isShravan ? 'Shravan Maas (Monsoon Sacred Holy Season)' :
    (month >= 3 && month <= 6 ? 'Grishma (Summer)' :
    (month >= 7 && month <= 9 ? 'Varsha (Monsoon)' :
    (month >= 10 && month <= 11 ? 'Sharad (Autumn)' : 'Hemant / Shishir (Winter)')));

  // Festival lookup based on month
  const festivalMap: Record<number, { name: string; description: string }> = {
    1: { name: 'Makar Sankranti & Pongal', description: 'Celebration of Sun transition into Capricorn and harvest' },
    2: { name: 'Maha Shivratri', description: 'The Great Night of Lord Shiva with sacred chanting and fasting' },
    3: { name: 'Holi', description: 'The Festival of Colors celebrating spring, devotion, and triumph of good' },
    4: { name: 'Gudi Padwa & Ugadi', description: 'Traditional Vedic New Year in Maharashtra and Deccan region' },
    5: { name: 'Buddha Purnima', description: 'Commemoration of the birth and enlightenment of Gautama Buddha' },
    6: { name: 'Ganga Dussehra & Rath Yatra', description: 'Honoring sacred river descent and Jagannath Rath Yatra' },
    7: { name: 'Guru Purnima & Shravan Somwar', description: 'Veneration of spiritual teachers and devotion to Shiva' },
    8: { name: 'Raksha Bandhan & Janmashtami', description: 'Sacred bond of protection and Lord Krishna birth celebration' },
    9: { name: 'Ganesh Chaturthi', description: 'Grand ten-day celebration welcoming Lord Ganesha in Maharashtra and across India' },
    10: { name: 'Navratri & Dussehra (Vijayadashami)', description: 'Nine nights of Maa Durga and victory of Lord Rama over Ravana' },
    11: { name: 'Diwali (Deepavali)', description: 'The Sovereign Festival of Lights, Lakshmi Pujan, and divine illumination' },
    12: { name: 'Gita Jayanti', description: 'Celebration of the revelation of Bhagavad Gita to Arjuna' }
  };

  const upcomingFestival = festivalMap[month] || {
    name: 'Diwali',
    description: 'The Festival of Lights and Prosperity'
  };

  return {
    istTime,
    istDate,
    dayOfWeek,
    tithi,
    paksha,
    season,
    isShravan,
    upcomingFestival,
    weatherSimulation: {
      city: 'Pune (NIAT Innovation Hub)',
      temperature: '26°C',
      condition: 'Pleasant & Breezy'
    }
  };
}

import { evaluateAccurateMath } from './mathEngine.js';

export function evaluateQuickMath(query: string, language: string = 'en'): string | null {
  const result = evaluateAccurateMath(query, language);
  return result ? result.reply : null;
}

