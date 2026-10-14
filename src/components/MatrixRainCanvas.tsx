import React, { useEffect, useRef } from 'react';

interface MatrixRainCanvasProps {
  isActive?: boolean;
  intensity?: 'subtle' | 'normal' | 'turbo';
  className?: string;
}

const MatrixRainCanvasComponent: React.FC<MatrixRainCanvasProps> = ({
  isActive = true,
  intensity = 'normal',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Characters: Katakana + Hex + Latin + Cyber symbols
    const chars =
      'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ9876543210ABCDEF<>[]{}/\\*+~#@$%&|=_';
    const charArray = chars.split('');
    const fontSize = intensity === 'turbo' ? 12 : 14;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];

    const initDrops = () => {
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -50);
      }
    };

    initDrops();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initDrops();
    };

    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    const fps = intensity === 'turbo' ? 45 : intensity === 'subtle' ? 24 : 32;
    const interval = 1000 / fps;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      // Fade out trail
      ctx.fillStyle =
        intensity === 'subtle'
          ? 'rgba(3, 7, 18, 0.12)'
          : intensity === 'turbo'
          ? 'rgba(3, 7, 18, 0.08)'
          : 'rgba(3, 7, 18, 0.1)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0 && y < height) {
          // Leading bright head vs body without expensive canvas shadowBlur
          if (Math.random() > 0.88 || intensity === 'turbo') {
            ctx.fillStyle = '#ffffff';
          } else if (i % 7 === 0) {
            ctx.fillStyle = '#00f0ff'; // Cyan accent
          } else {
            ctx.fillStyle = intensity === 'subtle' ? '#00bb44' : '#00ff66';
          }

          ctx.fillText(text, x, y);
        }

        // Reset drop or advance
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += intensity === 'turbo' ? 1.5 : 1;
        }
      }
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none transition-opacity duration-700 ${className}`}
    />
  );
};

export const MatrixRainCanvas = React.memo(MatrixRainCanvasComponent);
