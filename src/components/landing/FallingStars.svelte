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
    tailLength: number;
    colorIndex: number;
  }

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    let animationId: number;
    let particles: Particle[] = [];

    const PARTICLE_COUNT = 40;
    const COLORS = ["#FF3F00", "#FF6B3D", "#CC3200", "#FF5722", "#FF8A65"];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      for (const p of particles) {
        if (p.x > canvas.width) p.x = Math.random() * canvas.width;
      }
    }

    function createParticle(): Particle {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 1.5 + 0.3,
        speedY: Math.random() * 1.2 + 0.3,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.05,
        tailLength: Math.random() * 30 + 15,
        colorIndex: Math.floor(Math.random() * COLORS.length),
      };
    }

    function drawGrid() {
      const gridSize = 80;
      ctx.strokeStyle = "rgba(255, 63, 0, 0.02)";
      ctx.lineWidth = 0.5;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = createParticle();
        p.y = Math.random() * canvas.height;
        particles.push(p);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid();

      for (const p of particles) {
        const color = COLORS[p.colorIndex];

        const gradient = ctx.createLinearGradient(
          p.x, p.y - p.tailLength,
          p.x, p.y,
        );
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(1, color);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.size;
        ctx.globalAlpha = p.opacity;
        ctx.moveTo(p.x - p.speedX * p.tailLength, p.y - p.tailLength);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = p.opacity * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function update() {
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > canvas.height + p.tailLength) {
          p.y = -p.tailLength;
          p.x = Math.random() * canvas.width;
          p.opacity = Math.random() * 0.3 + 0.05;
          p.speedY = Math.random() * 1.2 + 0.3;
          p.speedX = (Math.random() - 0.5) * 0.3;
          p.colorIndex = Math.floor(Math.random() * COLORS.length);
        }
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

<canvas bind:this={canvas} class="fixed inset-0 w-full h-full pointer-events-none z-0"></canvas>
