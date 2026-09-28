import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Moon, Sparkles } from 'lucide-react';
import type { CalendarContext } from '../types';
import { getCalendarContext } from '../utils/api';

interface LiveHudClockProps {
  primaryColor?: string;
  compact?: boolean;
}

export const LiveHudClock: React.FC<LiveHudClockProps> = ({
  primaryColor = '#F59E0B',
  compact = false
}) => {
  const [istTime, setIstTime] = useState<string>('08:32:50 pm');
  const [calendarData, setCalendarData] = useState<CalendarContext>({
    istTime: '08:32:50 pm',
    istDate: '26 September 2026',
    dayOfWeek: 'Saturday',
    tithi: 'Krishna Paksha Dwadashi',
    paksha: 'Krishna Paksha',
    season: 'Varsha (Monsoon) = Ganesh Chaturthi',
    isShravan: false,
    upcomingFestival: {
      name: 'Ganesh Chaturthi',
      description: 'Grand ten-day celebration of Lord Ganesha'
    },
    weatherSimulation: {
      city: 'SGU Innovation Sanctum',
      temperature: '26°C',
      condition: 'Monsoon Ethereal Breeze'
    }
  });

  // Live ticking clock in IST (UTC+5:30)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (5.5 * 3600000));
      const formatted = ist.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toLowerCase();
      setIstTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial calendar context from server if available
  useEffect(() => {
    getCalendarContext()
      .then((data) => {
        if (data) {
          setCalendarData(prev => ({
            ...prev,
            ...data,
            istDate: data.istDate || '26 September 2026',
            tithi: data.tithi || 'Krishna Paksha Dwadashi',
            season: 'Varsha (Monsoon) = Ganesh Chaturthi'
          }));
        }
      })
      .catch((err) => console.warn('Using client calendar context:', err));
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono backdrop-blur-xl">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
        <span className="text-white font-semibold">{istTime || '08:32:50 pm'} IST</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300 truncate max-w-[150px]">Krishna Paksha Dwadashi</span>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 bg-[#060b16]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] w-full group hover:border-amber-400/40"
      style={{
        borderColor: `${primaryColor}33`,
        boxShadow: `0 0 25px ${primaryColor}15, 0 10px 30px rgba(0, 0, 0, 0.5)`
      }}
    >
      {/* Top Header: Clock Icon, Label & Live Ticking IST Time */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
            Live IST Clock & Panchang
          </span>
        </div>
        <span className="text-sm sm:text-base font-bold font-mono text-amber-300 tracking-wider px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 shadow-inner">
          {istTime || '08:32:50 pm'} IST
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-3 border-t border-white/10">
        {/* Date: 26 September 2026 */}
        <div className="flex items-center gap-2 text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-semibold">{calendarData.istDate || '26 September 2026'}</span>
        </div>

        {/* Lunar Phase: Krishna Paksha Dwadashi */}
        <div className="flex items-center gap-2 text-slate-200">
          <Moon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="font-semibold truncate">Krishna Paksha Dwadashi</span>
        </div>

        {/* Festival & Season Details: Varsha (Monsoon) = Ganesh Chaturthi */}
        <div className="flex items-center gap-2 text-amber-300/90 col-span-1 sm:col-span-2 pt-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate">
            Varsha (Monsoon) = Ganesh Chaturthi
          </span>
        </div>
      </div>
    </div>
  );
};
