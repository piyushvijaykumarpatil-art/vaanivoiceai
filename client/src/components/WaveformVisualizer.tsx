import React from 'react';

interface WaveformVisualizerProps {
  frequencyData: Uint8Array;
  isSpeaking: boolean;
  primaryColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  frequencyData,
  isSpeaking,
  primaryColor = '#F59E0B'
}) => {
  // Ensure we display 20 bars
  const bars = Array.from({ length: 20 }, (_, index) => {
    let rawValue = 0;
    if (frequencyData && frequencyData.length > index) {
      rawValue = frequencyData[index];
    }
    // Calculate normalized height percentage
    const heightPercent = isSpeaking
      ? Math.max(12, Math.min(100, (rawValue / 255) * 100))
      : 8 + Math.sin((index + Date.now() * 0.005) * 0.5) * 4;

    return {
      id: index,
      height: heightPercent
    };
  });

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 px-4 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/5 shadow-inner">
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="w-1.5 md:w-2 rounded-full transition-all duration-75 ease-out"
          style={{
            height: `${bar.height}%`,
            backgroundColor: primaryColor,
            boxShadow: isSpeaking && bar.height > 40
              ? `0 0 12px ${primaryColor}99`
              : 'none',
            opacity: isSpeaking ? 0.95 : 0.4
          }}
        />
      ))}
    </div>
  );
};
