import React, { useRef, useEffect } from 'react';

interface ChronoOrbProps {
  isSpeaking: boolean;
  frequencyData: Uint8Array;
  primaryColor?: string;
  themeId?: string;
}

export const ChronoOrb3D: React.FC<ChronoOrbProps> = ({
  isSpeaking,
  frequencyData,
  primaryColor = '#F59E0B'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0;
    let angleY = 0;
    let angleZ = 0;

    // Generate static cosmic stars
    const particleCount = 45;
    const particles: Array<{ x: number; y: number; z: number; size: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 350,
        y: (Math.random() - 0.5) * 350,
        z: (Math.random() - 0.5) * 350,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        speed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    const render = () => {
      // Handle high-DPI
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate audio amplitude average
      let sum = 0;
      if (frequencyData && frequencyData.length > 0) {
        for (let i = 0; i < frequencyData.length; i++) {
          sum += frequencyData[i];
        }
      }
      const audioAvg = frequencyData.length > 0 ? sum / frequencyData.length : 0;
      const audioScale = isSpeaking ? (audioAvg / 255) * 0.8 : 0;

      // Update rotational velocity
      const rotationSpeed = isSpeaking ? 0.02 + audioScale * 0.05 : 0.008;
      angleX += rotationSpeed * 0.7;
      angleY += rotationSpeed;
      angleZ += rotationSpeed * 0.5;

      // 1. Draw Background Ambient Radial Glow
      const glowRadius = Math.max(90, 110 + audioScale * 90);
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, glowRadius);
      gradient.addColorStop(0, primaryColor + '66'); // 40% alpha
      gradient.addColorStop(0.5, primaryColor + '22');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Floating 3D Cosmic Particle Stars
      for (const p of particles) {
        p.alpha += p.speed;
        if (p.alpha > 1 || p.alpha < 0.2) p.speed = -p.speed;

        // 3D rotation around Y
        const cosY = Math.cos(angleY * 0.4);
        const sinY = Math.sin(angleY * 0.4);
        const rotX = p.x * cosY - p.z * sinY;
        const rotZ = p.x * sinY + p.z * cosY;

        // Perspective projection
        const fov = 300;
        const scale = fov / (fov + rotZ + 150);
        const projX = centerX + rotX * scale;
        const projY = centerY + p.y * scale;

        if (scale > 0) {
          ctx.beginPath();
          ctx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = primaryColor;
          ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha * scale));
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // 3. Draw 3D Gyroscopic Orbital Rings
      const ringCount = 3;
      const baseRadius = 85 + (isSpeaking ? audioScale * 35 : Math.sin(Date.now() * 0.002) * 5);

      for (let r = 0; r < ringCount; r++) {
        const ringAngleOffset = (r * Math.PI) / 3;
        ctx.beginPath();
        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const rx = Math.cos(theta) * (baseRadius + r * 16);
          const ry = Math.sin(theta) * (baseRadius + r * 16);
          const rz = 0;

          // 3D Euler rotation
          const ringAngleX = angleX + ringAngleOffset;
          const ringAngleY = angleY + ringAngleOffset * 0.6;

          // Rotate X
          const y1 = ry * Math.cos(ringAngleX) - rz * Math.sin(ringAngleX);
          const z1 = ry * Math.sin(ringAngleX) + rz * Math.cos(ringAngleX);

          // Rotate Y
          const x2 = rx * Math.cos(ringAngleY) + z1 * Math.sin(ringAngleY);
          const z2 = -rx * Math.sin(ringAngleY) + z1 * Math.cos(ringAngleY);

          const fov = 350;
          const projScale = fov / (fov + z2 + 100);
          const px = centerX + x2 * projScale;
          const py = centerY + y1 * projScale;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = r === 0 ? 2.5 : 1.5;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = isSpeaking ? 18 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 4. Central Sovereign Chrono Core
      const corePulse = Math.sin(Date.now() * 0.003) * 4;
      const coreRadius = Math.max(30, 42 + (isSpeaking ? audioScale * 25 : corePulse));

      const coreGradient = ctx.createRadialGradient(centerX - 8, centerY - 8, 4, centerX, centerY, coreRadius);
      coreGradient.addColorStop(0, '#FFFFFF');
      coreGradient.addColorStop(0.3, primaryColor);
      coreGradient.addColorStop(0.8, '#05070B');
      coreGradient.addColorStop(1, primaryColor + '55');

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = isSpeaking ? 30 : 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Core Imperial Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor + 'AA';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, frequencyData, primaryColor]);

  return (
    <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer transition-transform duration-500 hover:scale-105"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
