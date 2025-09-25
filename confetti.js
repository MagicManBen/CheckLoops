/**
 * Simple Confetti Effect for CheckLoops
 * A lightweight particle-based confetti animation
 */

// Create a self-contained confetti module to avoid global scope pollution
const CheckLoopsConfetti = (function() {
  // Configuration settings
  const defaults = {
    particleCount: 100,
    spread: 70,
    startVelocity: 30,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
  };
  
  // Create canvas element for confetti
  function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    return canvas;
  }
  
  // Create a confetti particle
  function createParticle(x, y, options) {
    const colors = options.colors || defaults.colors;
    const colorIndex = Math.floor(Math.random() * colors.length);
    
    return {
      x: x,
      y: y,
      wobble: Math.random() * 10,
      velocity: (options.startVelocity || defaults.startVelocity) * (Math.random() * (1 - 0.5) + 0.5),
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: Math.random() * 0.2,
      rotation: 0,
      drift: (options.drift || defaults.drift) + (Math.random() - 0.5),
      tiltAngle: 0,
      color: colors[colorIndex],
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      size: Math.random() * 10 + 5,
      opacity: 1
    };
  }
  
  // Update particle position and properties
  function updateParticle(particle, width, height, options) {
    particle.velocity *= options.decay || defaults.decay;
    particle.x += Math.cos(particle.angle) * particle.velocity;
    particle.y += Math.sin(particle.angle) * particle.velocity + (options.gravity || defaults.gravity);
    particle.wobble += 0.1;
    particle.rotation += particle.rotationSpeed;
    particle.opacity -= 1 / (options.ticks || defaults.ticks);
    
    // Add drift effect
    particle.x += particle.drift;
    
    return particle.opacity > 0;
  }
  
  // Draw a single particle on the canvas
  function drawParticle(particle, ctx) {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    
    const wobbleX = Math.sin(particle.wobble) * 10;
    const wobbleY = Math.cos(particle.wobble) * 10;
    
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity;
    
    if (particle.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(wobbleX / 2, wobbleY / 2, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(wobbleX / 2, wobbleY / 2, particle.size, particle.size);
    }
    
    ctx.restore();
  }
  
  // Main confetti function
  function fire(options = {}) {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');
    const particles = [];
    const x = options.x || canvas.width / 2;
    const y = options.y || canvas.height / 4;
    const particleCount = options.particleCount || defaults.particleCount;
    const spread = options.spread || defaults.spread;
    
    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
      const startX = x + (Math.random() - 0.5) * spread;
      const startY = y + (Math.random() - 0.5) * spread;
      particles.push(createParticle(startX, startY, options));
    }
    
    // Animation loop
    let animationFrame;
    let remainingTicks = options.ticks || defaults.ticks;
    
    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      remainingTicks -= 1;
      let stillAlive = false;
      
      for (const particle of particles) {
        if (updateParticle(particle, canvas.width, canvas.height, options)) {
          drawParticle(particle, ctx);
          stillAlive = true;
        }
      }
      
      if (stillAlive && remainingTicks > 0) {
        animationFrame = requestAnimationFrame(update);
      } else {
        cancelAnimationFrame(animationFrame);
        document.body.removeChild(canvas);
      }
    }
    
    animationFrame = requestAnimationFrame(update);
    
    // Return a function to stop the animation early if needed
    return function() {
      cancelAnimationFrame(animationFrame);
      document.body.removeChild(canvas);
    };
  }
  
  // Export public API
  return {
    fire: fire
  };
})();

// Expose the confetti function globally
window.fireConfetti = function(options = {}) {
  return CheckLoopsConfetti.fire(options);
};