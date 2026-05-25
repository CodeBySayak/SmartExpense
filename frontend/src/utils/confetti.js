// Pure Vanilla JS Canvas Confetti simulation (zero npm dependencies)
export function fireConfetti() {
  const canvasId = "confetti-canvas";
  let canvas = document.getElementById(canvasId);
  
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = canvasId;
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colors = [
    "#8b5cf6", // violet
    "#a78bfa",
    "#ec4899", // pink
    "#f472b6",
    "#3b82f6", // blue
    "#60a5fa",
    "#10b981", // green
    "#34d399",
    "#fbbf24", // amber
  ];

  const particles = [];
  const particleCount = 120;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * -height - 20,
      r: Math.random() * 6 + 4,
      d: Math.random() * particleCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
      speed: Math.random() * 3 + 2,
    });
  }

  let startTime = Date.now();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.speed;
      p.x += Math.sin(p.tiltAngle) * 0.5;

      // Draw particle
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      // Check if it's still on screen
      if (p.y < height) {
        activeParticles++;
      }
    }

    // Stop after 4.5 seconds or if all particles went off screen
    if (activeParticles > 0 && Date.now() - startTime < 4500) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  // Handle window resizing
  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  draw();

  // Cleanup resize listener
  setTimeout(() => {
    window.removeEventListener("resize", handleResize);
  }, 5000);
}
