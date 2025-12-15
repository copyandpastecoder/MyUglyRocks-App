'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'square' | 'circle' | 'rectangle';
}

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
];

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  onComplete?: () => void;
}

/**
 * Confetti - Celebration animation component
 *
 * Usage:
 * ```tsx
 * const [showConfetti, setShowConfetti] = useState(false);
 *
 * <Confetti
 *   active={showConfetti}
 *   onComplete={() => setShowConfetti(false)}
 * />
 *
 * // Trigger with:
 * setShowConfetti(true);
 * ```
 */
export function Confetti({
  active,
  duration = 3000,
  particleCount = 100,
  spread = 50,
  origin = { x: 0.5, y: 0.5 },
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const createParticles = useCallback(() => {
    const particles: Particle[] = [];
    const shapes: Particle['shape'][] = ['square', 'circle', 'rectangle'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const velocity = 5 + Math.random() * 10;

      particles.push({
        id: i,
        x: window.innerWidth * origin.x,
        y: window.innerHeight * origin.y,
        vx: Math.cos(angle) * velocity * (spread / 50),
        vy: Math.sin(angle) * velocity - 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    return particles;
  }, [particleCount, spread, origin]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    particlesRef.current.forEach((particle) => {
      if (particle.opacity <= 0) return;
      activeParticles++;

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // Gravity
      particle.rotation += particle.rotationSpeed;
      particle.opacity -= 0.008;
      particle.vx *= 0.99; // Air resistance

      // Draw particle
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, particle.opacity);
      ctx.fillStyle = particle.color;

      switch (particle.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rectangle':
          ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
          break;
        default:
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }

      ctx.restore();
    });

    if (activeParticles > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!active || !mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = createParticles();
    animate();

    const timeout = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, mounted, createParticles, animate, duration, onComplete]);

  if (!mounted || !active) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />,
    document.body
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const fire = useCallback((_options?: { origin?: { x: number; y: number } }) => {
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    fire,
    reset,
    Confetti: (props: Partial<ConfettiProps>) => (
      <Confetti active={isActive} onComplete={reset} {...props} />
    ),
  };
}
