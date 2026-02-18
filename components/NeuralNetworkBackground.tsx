import React, { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

const NeuralNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const particleCount = Math.min(window.innerWidth / 10, 150); // Responsive count
    const connectionDistance = 150;
    const mouseRepelDistance = 200;

    // Colors based on theme
    const getNodeColor = () => theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    const getLineColor = (opacity: number) => theme === 'dark' 
      ? `rgba(56, 189, 248, ${opacity})` // Sky blue in dark mode
      : `rgba(239, 68, 68, ${opacity})`; // Red in light mode

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        // Natural movement
        this.x += this.vx;
        this.y += this.vy;

        // Interactive drift: particles drift in the direction of the cursor relative to center
        // This adds a "wind" effect based on mouse position
        if (mouseX > 0 && mouseY > 0) {
            const centerX = canvas!.width / 2;
            const centerY = canvas!.height / 2;
            // Normalized offset from center (-1 to 1 range roughly)
            const driftX = (mouseX - centerX) * 0.0001; 
            const driftY = (mouseY - centerY) * 0.0001;
            
            this.x += driftX;
            this.y += driftY;
        }

        // Bounce off edges
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;

        // Mouse repulsion
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRepelDistance) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseRepelDistance - distance) / mouseRepelDistance;
          const repelStrength = 2; // Strength of repulsion

          this.vx -= forceDirectionX * force * repelStrength * 0.05;
          this.vy -= forceDirectionY * force * repelStrength * 0.05;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = getNodeColor();
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        // Draw connections
        for (let j = index; j < particles.length; j++) {
          const dx = particles[j].x - particle.x;
          const dy = particles[j].y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            const opacity = 1 - distance / connectionDistance;
            ctx.strokeStyle = getLineColor(opacity * 0.5); // reduced opacity
            ctx.lineWidth = 1;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40 dark:opacity-30"
    />
  );
};

export default NeuralNetworkBackground;