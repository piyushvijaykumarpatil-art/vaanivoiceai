import React, { useState } from 'react';
import { Award, Code2, GraduationCap, MapPin, X } from 'lucide-react';

interface CreatorBadgeProps {
  primaryColor?: string;
  variant?: 'compact' | 'prominent';
}

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({
  primaryColor = '#F59E0B',
  variant = 'compact'
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`group relative inline-flex items-center gap-2 rounded-full border transition-all duration-300 hover:scale-105 ${
          variant === 'prominent'
            ? 'px-4 py-2 text-sm font-semibold bg-black/60 shadow-xl'
            : 'px-3 py-1 text-xs font-medium bg-black/40'
        }`}
        style={{
          borderColor: `${primaryColor}44`,
          boxShadow: `0 0 15px ${primaryColor}22`
        }}
      >
        <span className="animate-pulse">🚀</span>
        <span className="text-slate-200">
          Made by <strong className="text-white font-bold tracking-wide">Piyush</strong>
        </span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
        <span className="text-slate-400 group-hover:text-slate-300 transition-colors">
          1st Year Student of SGU
        </span>
      </button>

      {/* Creator Attribution Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-md p-6 rounded-3xl imperial-glass border shadow-2xl transition-all"
            style={{ borderColor: primaryColor }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                style={{ backgroundColor: `${primaryColor}25`, border: `1px solid ${primaryColor}` }}
              >
                👑
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-cinzel">Piyush</h3>
                <p className="text-xs text-slate-300 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  1st Year Student of SGU
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300 mb-6 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Institution:</strong> Sanjay Ghodawat University (SGU)
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Code2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Architecture:</strong> Conceived and engineered <em>Vaani — Imperial Edition</em> with studio-grade neural voices, 3D Gyroscopic Chrono-Orb, dual-layer ACID storage, and full Indian calendar intelligence.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Award className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Mission:</strong> To pioneer sovereign Indian AI experiences without language barriers or speech recognition latency.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg text-black"
              style={{ backgroundColor: primaryColor }}
            >
              Honored & Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
