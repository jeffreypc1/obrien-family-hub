'use client';

import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const isTouchDevice = useRef(false);

  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window;
    if (isTouchDevice.current) return;

    const NUM_DOTS = 12;
    const positions = Array.from({ length: NUM_DOTS }, () => ({ x: 0, y: 0 }));

    const dots = Array.from({ length: NUM_DOTS }, (_, i) => {
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      const size = 8 - i * 0.5;
      const opacity = 0.6 - i * 0.04;
      const hue = 280 + i * 8;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.background = `hsla(${hue}, 80%, 65%, ${opacity})`;
      dot.style.boxShadow = `0 0 ${size * 2}px hsla(${hue}, 80%, 65%, ${opacity * 0.5})`;
      document.body.appendChild(dot);
      return dot;
    });
    dotsRef.current = dots;

    const handleMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMove);

    let raf: number;
    const animate = () => {
      positions[0].x += (mouse.current.x - positions[0].x) * 0.3;
      positions[0].y += (mouse.current.y - positions[0].y) * 0.3;

      for (let i = 1; i < NUM_DOTS; i++) {
        positions[i].x += (positions[i - 1].x - positions[i].x) * 0.25;
        positions[i].y += (positions[i - 1].y - positions[i].y) * 0.25;
      }

      dots.forEach((dot, i) => {
        dot.style.transform = `translate(${positions[i].x - 4}px, ${positions[i].y - 4}px)`;
      });

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleMove);
      dots.forEach((d) => d.remove());
    };
  }, []);

  return null;
}
