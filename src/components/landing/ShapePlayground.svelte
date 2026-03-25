<script lang="ts">
  import { onMount } from "svelte";
  import Matter from "matter-js";

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  const BRUTAL_COLORS = ["#FF6B9D", "#FFE74C", "#4DEEEA", "#06D6A0", "#C77DFF"];
  const INK = "#1A1A2E";
  const BORDER_WIDTH = 3;

  onMount(() => {
    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
      Events,
    } = Matter;

    const width = window.innerWidth;
    const viewHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    const engine = Engine.create();
    engine.gravity.y = 1;

    const render = Render.create({
      element: container,
      canvas,
      engine,
      options: {
        width,
        height: viewHeight,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
        hasBounds: true,
      },
    });

    // Set initial render bounds to current scroll
    render.bounds.min.y = window.scrollY;
    render.bounds.max.y = window.scrollY + viewHeight;

    // Scale shapes based on container width
    const scale = Math.min(width / 700, 1);
    const shapeSize = Math.max(35, 50 * scale);

    // Walls: floor at document bottom, left, right
    const wallThickness = 60;
    const walls = [
      // floor — at the bottom of the full document
      Bodies.rectangle(width / 2, docHeight + wallThickness / 2 - 3, width + 100, wallThickness, {
        isStatic: true,
        render: { visible: false },
      }),
      // left
      Bodies.rectangle(-wallThickness / 2, docHeight / 2, wallThickness, docHeight * 2, {
        isStatic: true,
        render: { visible: false },
      }),
      // right
      Bodies.rectangle(width + wallThickness / 2, docHeight / 2, wallThickness, docHeight * 2, {
        isStatic: true,
        render: { visible: false },
      }),
    ];

    // Shape factory functions
    function makeSquare(x: number, y: number, color: string) {
      return Bodies.rectangle(x, y, shapeSize, shapeSize, {
        chamfer: { radius: 2 },
        restitution: 0.5,
        friction: 0.3,
        render: {
          fillStyle: color,
          strokeStyle: INK,
          lineWidth: BORDER_WIDTH,
        },
      });
    }

    function makeRectangle(x: number, y: number, color: string) {
      return Bodies.rectangle(x, y, shapeSize * 1.6, shapeSize * 0.8, {
        chamfer: { radius: 2 },
        restitution: 0.5,
        friction: 0.3,
        render: {
          fillStyle: color,
          strokeStyle: INK,
          lineWidth: BORDER_WIDTH,
        },
      });
    }

    function makeCircle(x: number, y: number, color: string) {
      return Bodies.circle(x, y, shapeSize / 2, {
        restitution: 0.6,
        friction: 0.2,
        render: {
          fillStyle: color,
          strokeStyle: INK,
          lineWidth: BORDER_WIDTH,
        },
      });
    }

    function makeTriangle(x: number, y: number, color: string) {
      return Bodies.polygon(x, y, 3, shapeSize * 0.6, {
        restitution: 0.4,
        friction: 0.4,
        render: {
          fillStyle: color,
          strokeStyle: INK,
          lineWidth: BORDER_WIDTH,
        },
      });
    }

    function makePentagon(x: number, y: number, color: string) {
      return Bodies.polygon(x, y, 5, shapeSize * 0.5, {
        restitution: 0.5,
        friction: 0.3,
        render: {
          fillStyle: color,
          strokeStyle: INK,
          lineWidth: BORDER_WIDTH,
        },
      });
    }

    // Draw a tiny neobrutalist browser card to an offscreen canvas
    function makeBrowserCard(x: number, y: number) {
      const cardW = Math.round(shapeSize * 2);
      const cardH = Math.round(shapeSize * 1.5);
      const headerH = Math.round(cardH * 0.28);
      const dpr = window.devicePixelRatio || 1;
      const r = 6; // corner radius

      const offscreen = document.createElement("canvas");
      offscreen.width = cardW * dpr;
      offscreen.height = cardH * dpr;
      const ctx = offscreen.getContext("2d")!;
      ctx.scale(dpr, dpr);

      // Clip to rounded rectangle
      ctx.beginPath();
      ctx.roundRect(0, 0, cardW, cardH, r);
      ctx.clip();

      // Card background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cardW, cardH);

      // Header bar
      ctx.fillStyle = "#FF6B9D";
      ctx.fillRect(0, 0, cardW, headerH);

      // Header bottom border
      ctx.fillStyle = INK;
      ctx.fillRect(0, headerH - 2, cardW, 2);

      // Traffic light dots
      const dotY = headerH / 2;
      const dotR = Math.max(2, shapeSize * 0.04);
      const colors = ["#FF6B9D", "#FFE74C", "#06D6A0"];
      for (let i = 0; i < 3; i++) {
        const dotX = 6 + i * (dotR * 2 + 3);
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? "#e0456f" : colors[i];
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Fake URL bar
      const urlX = 6 + 3 * (dotR * 2 + 3) + 4;
      const urlW = cardW - urlX - 4;
      const urlH = headerH * 0.4;
      const urlY = (headerH - urlH) / 2;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.fillRect(urlX, urlY, urlW, urlH);
      ctx.strokeRect(urlX, urlY, urlW, urlH);

      // Tiny URL text
      ctx.fillStyle = INK;
      ctx.font = `bold ${Math.max(5, shapeSize * 0.12)}px Inter, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("dangeffroy.dev", urlX + 2, urlY + urlH / 2);

      // Content area — fake lines
      const lineY = headerH + 8;
      const lineH = 3;
      const lineGap = 5;
      ctx.fillStyle = "#e8e0d0";
      for (let i = 0; i < 3; i++) {
        const lw = cardW * (0.7 - i * 0.15);
        ctx.fillRect(6, lineY + i * (lineH + lineGap), lw, lineH);
      }

      // Card outer border (rounded)
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(1, 1, cardW - 2, cardH - 2, r);
      ctx.stroke();

      const spriteUrl = offscreen.toDataURL();

      const body = Bodies.rectangle(x, y, cardW, cardH, {
        chamfer: { radius: 3 },
        restitution: 0.4,
        friction: 0.3,
        render: {
          sprite: {
            texture: spriteUrl,
            xScale: 1 / dpr,
            yScale: 1 / dpr,
          },
          // Disable default fill/stroke since we use sprite
          fillStyle: "transparent",
          strokeStyle: "transparent",
          lineWidth: 0,
        },
      });
      // Tag this body so afterRender skips default shape drawing
      (body as any).isCard = true;
      return body;
    }

    // Create shapes but don't add them yet
    const spacing = width / 7;
    const spawnY = docHeight - viewHeight * 0.5;
    const shapes = [
      makeSquare(spacing * 1, spawnY, BRUTAL_COLORS[0]),
      makeRectangle(spacing * 2, spawnY + 10, BRUTAL_COLORS[1]),
      makeTriangle(spacing * 3, spawnY + 5, BRUTAL_COLORS[2]),
      makeCircle(spacing * 4, spawnY + 15, BRUTAL_COLORS[3]),
      makePentagon(spacing * 5, spawnY + 8, BRUTAL_COLORS[4]),
      makeBrowserCard(spacing * 6, spawnY + 12),
    ];

    for (const shape of shapes) {
      Matter.Body.setAngularVelocity(shape, (Math.random() - 0.5) * 0.1);
    }

    // Only add walls initially — shapes spawn when user scrolls down
    Composite.add(engine.world, walls);

    let shapesSpawned = false;
    const trigger = document.getElementById("shape-spawn-trigger");
    if (trigger) {
      const spawnObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !shapesSpawned) {
          shapesSpawned = true;
          Composite.add(engine.world, shapes);
          spawnObserver.disconnect();
        }
      }, { threshold: 0 });
      spawnObserver.observe(trigger);
    }

    // Mouse interaction for dragging
    const mouse = Mouse.create(canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    mouse.pixelRatio = window.devicePixelRatio || 1;

    // Allow page scrolling
    mouse.element.removeEventListener("wheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Track mouse position via document so we can detect shape hover
    // even when canvas has pointer-events: none
    let docMouseX = 0;
    let docMouseY = 0;
    let isDragging = false;

    function onDocMouseMove(e: MouseEvent) {
      docMouseX = e.clientX;
      docMouseY = e.clientY;

      if (!isDragging) {
        // Convert viewport coords to world coords (add scroll offset)
        const worldY = docMouseY + window.scrollY;
        const hit = Matter.Query.point(shapes, { x: docMouseX, y: worldY });
        canvas.style.pointerEvents = hit.length > 0 ? "auto" : "none";
      }
    }

    function onDocMouseUp() {
      // Small delay to let Matter.js finish the drag release
      setTimeout(() => {
        isDragging = false;
        canvas.style.pointerEvents = "none";
      }, 50);
    }

    // Detect drag start via Matter.js event
    Events.on(mouseConstraint, "startdrag", () => {
      isDragging = true;
      canvas.style.pointerEvents = "auto";
    });

    Events.on(mouseConstraint, "enddrag", () => {
      onDocMouseUp();
    });

    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", onDocMouseUp);

    // Touch support for mobile — feed touch coords directly into Matter.js mouse
    function onDocTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      const worldX = touch.clientX;
      const worldY = touch.clientY + window.scrollY;
      const hit = Matter.Query.point(shapes, { x: worldX, y: worldY });
      if (hit.length > 0) {
        isDragging = true;
        // Set absolute position (Matter.js adds offset internally to get mouse.position)
        (mouse as any).absolute.x = worldX;
        (mouse as any).absolute.y = touch.clientY;
        mouse.position.x = worldX;
        mouse.position.y = worldY;
        (mouse as any).mousedownPosition = { x: worldX, y: worldY };
        mouse.button = 0;
        e.preventDefault();
      }
    }

    function onDocTouchMove(e: TouchEvent) {
      if (isDragging && e.touches.length > 0) {
        const touch = e.touches[0];
        const worldX = touch.clientX;
        const worldY = touch.clientY + window.scrollY;
        (mouse as any).absolute.x = worldX;
        (mouse as any).absolute.y = touch.clientY;
        mouse.position.x = worldX;
        mouse.position.y = worldY;
        e.preventDefault();
      }
    }

    function onDocTouchEnd() {
      if (isDragging) {
        mouse.button = -1;
        (mouse as any).mouseupPosition = { x: mouse.position.x, y: mouse.position.y };
        isDragging = false;
      }
    }

    document.addEventListener("touchstart", onDocTouchStart, { passive: false });
    document.addEventListener("touchmove", onDocTouchMove, { passive: false });
    document.addEventListener("touchend", onDocTouchEnd);

    // Set cursor style on hover
    Events.on(mouseConstraint, "mousemove", () => {
      const hit = Matter.Query.point(shapes, mouse.position);
      canvas.style.cursor = hit.length > 0 ? "grab" : "default";
    });
    Events.on(mouseConstraint, "startdrag", () => {
      canvas.style.cursor = "grabbing";
    });
    Events.on(mouseConstraint, "enddrag", () => {
      canvas.style.cursor = "default";
    });

    // Update render bounds on scroll so we see the right slice of the world
    function onScroll() {
      render.bounds.min.y = window.scrollY;
      render.bounds.max.y = window.scrollY + window.innerHeight;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // Offset mouse so Matter.js maps viewport coords to world coords
    Events.on(render, "beforeRender", () => {
      mouse.offset.y = -window.scrollY;
    });

    // Custom afterRender: draw neobrutalist shadows then shapes on top
    Events.on(render, "afterRender", () => {
      const ctx = render.context;
      const bodies = Composite.allBodies(engine.world);
      const dpr = window.devicePixelRatio || 1;
      const shadowOffset = 3 * dpr;

      for (const body of bodies) {
        if (body.isStatic || !body.render.visible || (body as any).isCard) continue;
        ctx.save();
        ctx.translate(shadowOffset, shadowOffset);
        const vertices = body.vertices;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.closePath();
        ctx.fillStyle = INK;
        ctx.fill();
        ctx.restore();
      }

      for (const body of bodies) {
        if (body.isStatic || !body.render.visible || (body as any).isCard) continue;
        const vertices = body.vertices;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.closePath();
        ctx.fillStyle = body.render.fillStyle || "#fff";
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = BORDER_WIDTH;
        ctx.stroke();
      }
    });

    // Safety: reset shapes that go too far off-screen
    Events.on(engine, "afterUpdate", () => {
      const currentW = render.options.width!;
      const currentDocH = document.documentElement.scrollHeight;
      const margin = 200;
      for (const shape of shapes) {
        const { x, y } = shape.position;
        if (x < -margin || x > currentW + margin || y > currentDocH + margin) {
          Matter.Body.setPosition(shape, { x: currentW / 2, y: currentDocH - window.innerHeight });
          Matter.Body.setVelocity(shape, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(shape, 0);
        }
      }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    function handleResize() {
      const newWidth = window.innerWidth;
      const newViewHeight = window.innerHeight;
      const newDocHeight = document.documentElement.scrollHeight;
      const dpr = window.devicePixelRatio || 1;
      render.canvas.width = newWidth * dpr;
      render.canvas.height = newViewHeight * dpr;
      render.options.width = newWidth;
      render.options.height = newViewHeight;
      render.bounds.min.y = window.scrollY;
      render.bounds.max.y = window.scrollY + newViewHeight;

      // Update floor to document bottom
      Matter.Body.setPosition(walls[0], {
        x: newWidth / 2,
        y: newDocHeight + wallThickness / 2 - 3,
      });
      const floorWidth = walls[0].bounds.max.x - walls[0].bounds.min.x;
      if (floorWidth > 0) Matter.Body.scale(walls[0], (newWidth + 100) / floorWidth, 1);

      // Update right wall
      Matter.Body.setPosition(walls[2], {
        x: newWidth + wallThickness / 2,
        y: newDocHeight / 2,
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousemove", onDocMouseMove);
      document.removeEventListener("mouseup", onDocMouseUp);
      document.removeEventListener("touchstart", onDocTouchStart);
      document.removeEventListener("touchend", onDocTouchEnd);
      document.removeEventListener("touchmove", onDocTouchMove);
    };
  });
</script>

<div
  bind:this={container}
  class="fixed inset-0 z-20 pointer-events-none"
>
  <canvas bind:this={canvas} class="block w-full h-full" style="pointer-events: none;"></canvas>
</div>
