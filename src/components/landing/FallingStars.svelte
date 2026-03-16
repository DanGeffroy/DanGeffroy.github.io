<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;

  interface Particle {
    x: number;
    y: number;
    size: number;
    speedY: number;
    speedX: number;
    opacity: number;
    baseOpacity: number;
    phase: number;
    phaseSpeed: number;
    colorIndex: number;
  }

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    let animationId: number;
    let particles: Particle[] = [];

    const PARTICLE_COUNT = 35;
    const COLORS = ["#C8965A", "#DBA86C", "#A67832", "#6B8F71", "#8AAF8F"];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      for (const p of particles) {
        if (p.x > canvas.width) p.x = Math.random() * canvas.width;
      }
    }

    function createParticle(): Particle {
      const baseOpacity = Math.random() * 0.35 + 0.1;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: baseOpacity,
        baseOpacity,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.015 + 0.005,
        colorIndex: Math.floor(Math.random() * COLORS.length),
      };
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        const color = COLORS[p.colorIndex];

        // Main dot
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow
        ctx.globalAlpha = p.opacity * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function update() {
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.phase += p.phaseSpeed;
        p.opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(p.phase));

        // Wrap around screen edges gently
        if (p.y > canvas.height + 10) p.y = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.x < -10) p.x = canvas.width + 10;
      }
    }

    function animate() {
      update();
      draw();
      animationId = requestAnimationFrame(animate);
    }

    init();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} class="falling-stars"></canvas>

<style>
  .falling-stars {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }
</style>
