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
  const [istTime, setIstTime] = useState<string>('');
  const [calendarData, setCalendarData] = useState<CalendarContext | null>(null);

  // Live ticking clock in IST (UTC+5:30)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (5.5 * 3600000));
      setIstTime(ist.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial calendar context from server
  useEffect(() => {
    getCalendarContext()
      .then((data) => setCalendarData(data))
      .catch((err) => console.warn('Could not fetch calendar context:', err));
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
        <span className="text-white font-semibold">{istTime || 'IST Live'}</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300 truncate max-w-[120px]">{calendarData?.tithi || 'Tithi Active'}</span>
      </div>
    );
  }

  return (
    <div
      className="imperial-glass rounded-2xl p-4 border transition-all duration-300"
      style={{ borderColor: `${primaryColor}33` }}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: primaryColor }} />
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Indian Standard Time (IST)
          </span>
        </div>
        <span className="text-base font-bold font-mono text-white tracking-widest px-2.5 py-0.5 rounded-lg bg-black/50 border border-white/5">
          {istTime || '12:00:00 PM'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>{calendarData?.istDate || 'Indian Solar Calendar'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Moon className="w-3.5 h-3.5 text-purple-400" />
          <span className="truncate">{calendarData?.tithi || 'Shukla Paksha'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 col-span-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-200/90 truncate">
            {calendarData?.season || 'Seasonal Cycle'} • {calendarData?.upcomingFestival?.name || 'Festival Season'}
          </span>
        </div>
      </div>
    </div>
  );
};
