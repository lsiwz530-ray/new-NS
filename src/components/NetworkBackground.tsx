import { useEffect, useRef } from "react";

/**
 * Interactive particle network background.
 * Nodes are repelled by the cursor and connect with lines when near.
 */
export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    type P = { x: number; y: number; vx: number; vy: number; ox: number; oy: number };
    let points: P[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = width + "px";
      canvas!.style.height = height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // recreate points based on area
      const density = Math.min(140, Math.floor((width * height) / 14000));
      points = Array.from({ length: density }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return { x, y, ox: x, oy: y, vx: 0, vy: 0 };
      });
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }
    function onTouch(e: TouchEvent) {
      if (e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    }

    const REPEL = 130;
    const REPEL_STRENGTH = 55;
    const LINK = 130;

    function tick() {
      ctx!.clearRect(0, 0, width, height);

      // subtle gradient wash
      const g = ctx!.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.2);
      g.addColorStop(0, "rgba(90, 30, 160, 0.18)");
      g.addColorStop(1, "rgba(10, 5, 20, 0)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, width, height);

      for (const p of points) {
        // spring back to origin
        p.vx += (p.ox - p.x) * 0.008;
        p.vy += (p.oy - p.y) * 0.008;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL && dist > 0.01) {
            const force = ((REPEL - dist) / REPEL) * REPEL_STRENGTH;
            p.vx += (dx / dist) * force * 0.05;
            p.vy += (dy / dist) * force * 0.05;
          }
        }

        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Lines
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * 0.35;
            ctx!.strokeStyle = `rgba(180, 120, 255, ${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // Dots
      for (const p of points) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(220, 180, 255, 0.85)";
        ctx!.shadowColor = "rgba(170, 100, 255, 0.7)";
        ctx!.shadowBlur = 6;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: "radial-gradient(ellipse at top, #1a0a2e 0%, #0a0410 60%, #05020a 100%)" }}
      aria-hidden
    />
  );
}
