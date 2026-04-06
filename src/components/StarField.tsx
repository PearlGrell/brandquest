import { useEffect, useRef } from "react";

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number; phase: number; color: [number, number, number] }[] = [];
    const shootingStars: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];
    const nebulae: { x: number; y: number; r: number; hue: number; opacity: number; phase: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);


    const starColors: [number, number, number][] = [
      [255, 79, 216],
      [155, 92, 255],
      [92, 205, 255],
      [255, 255, 255],
      [255, 200, 240],
    ];

    for (let i = 0; i < 250; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.3,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.003,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }


    for (let i = 0; i < 5; i++) {
      nebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 200 + Math.random() * 300,
        hue: [312, 264, 192][Math.floor(Math.random() * 3)],
        opacity: 0.015 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;


      nebulae.forEach((n) => {
        const breathe = 1 + Math.sin(time * 0.003 + n.phase) * 0.15;
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * breathe);
        const hsl = n.hue;
        gradient.addColorStop(0, `hsla(${hsl}, 80%, 50%, ${n.opacity * 1.5})`);
        gradient.addColorStop(0.4, `hsla(${hsl}, 60%, 40%, ${n.opacity})`);
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * breathe, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });


      stars.forEach((star) => {
        star.opacity = 0.3 + Math.sin(time * star.twinkleSpeed + star.phase) * 0.5;
        const [r, g, b] = star.color;


        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${star.opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${star.opacity * 0.15})`);
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();


        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.9})`;
        ctx.fill();
      });


      if (Math.random() < 0.006) {
        const colors = ["rgba(255, 79, 216,", "rgba(155, 92, 255,", "rgba(92, 205, 255,"];
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.3,
          vx: (Math.random() - 0.3) * 5 + 3,
          vy: Math.random() * 3 + 1.5,
          life: 0,
          maxLife: 50 + Math.random() * 50,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;
        const alpha = 1 - ss.life / ss.maxLife;


        const gradient = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * 15, ss.y - ss.vy * 15);
        gradient.addColorStop(0, `${ss.color} ${alpha * 0.9})`);
        gradient.addColorStop(1, `${ss.color} 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * 15, ss.y - ss.vy * 15);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();


        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: "linear-gradient(180deg, #030010 0%, #080020 30%, #0a0030 50%, #0d0025 70%, #050012 100%)"
      }}
    />
  );
};

export default StarField;
