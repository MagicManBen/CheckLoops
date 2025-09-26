/**
 * CheckLoops Animation Library
 * Advanced animation and interaction effects for the staff dashboard
 */

// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAnimations();
});

// Main initialization function for all animations
function initializeAnimations() {
  // Initialize background particles
  createParticleBackground();
  
  // Setup interactive elements
  setupCardInteractions();
  setupUserAvatar();
  setupHeroEffects(); // This will setup the typing effect for CQC quotes
  setupActivityFeed();
  setupDashboardCards();
  setupNavigationEffects();
  
  // Initialize live elements
  initializeLiveClock();
  initializeMotivationalQuotes();
  
  // Start initial animations with slight delay
  setTimeout(() => {
    runEntranceAnimations();
    animateProgressBars();
    animateMetricCounters();
  }, 300);
  
  // Listen for page visibility changes to pause/resume animations
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Creates a dynamic particle background effect
function createParticleBackground() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:-1;opacity:0.4;';
  document.body.prepend(canvas);
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  const particleCount = 30;
  
  // Create initial particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    });
  }
  
  // Animation loop
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      // Move particles
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });
    
    requestAnimationFrame(animateParticles);
  }
  
  // Start animation
  animateParticles();
  
  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Handle visibility change to optimize performance
function handleVisibilityChange() {
  // Pause/resume heavy animations based on page visibility
  const isVisible = document.visibilityState === 'visible';
  
  // Adjust animations based on visibility
  const particleCanvas = document.getElementById('particle-canvas');
  if (particleCanvas) {
    particleCanvas.style.opacity = isVisible ? '0.4' : '0';
  }
}

// Interactive card effects
function setupCardInteractions() {
  const cards = document.querySelectorAll('.dashboard-card, .action-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('disabled')) {
        card.classList.add('animate-on-hover');
      }
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('animate-on-hover');
    });
  });
}

// Animate the avatar and related elements
function setupUserAvatar() {
  const avatar = document.getElementById('user-avatar');
  if (avatar) {
    avatar.classList.add('animate-float');
    
    // Add a glow effect on hover
    avatar.addEventListener('mouseenter', () => {
      avatar.classList.add('animate-glow');
    });
    
    avatar.addEventListener('mouseleave', () => {
      avatar.classList.remove('animate-glow');
    });
    
    // Add click bounce effect (without confetti)
    avatar.addEventListener('click', () => {
      avatar.classList.add('animate-bounce');
      setTimeout(() => {
        avatar.classList.remove('animate-bounce');
      }, 2000);
    });
  }
}

// Hero section text effect
function setupHeroEffects() {
  const welcomeText = document.getElementById('welcome');
  const siteSubtitle = document.getElementById('site-subtitle');
  
  if (welcomeText) {
    welcomeText.classList.add('animate-fade-in');
  }
  
  if (siteSubtitle) {
    // Use the specific text requested
    typingEffect(siteSubtitle, "Leadership that inspires quality improvement.", 50);
  }
}

// Get a random CQC quote
function getCQCQuote() {
  const cqcQuotes = [
    "The best way to predict your future is to create it. ✨",
    "Safe, Effective, Caring, Responsive, Well-led.",
    "Putting people at the heart of healthcare.",
    "Excellence is not an exception, it's our expectation.",
    "Quality care is a right, not a privilege.",
    "Ensuring outstanding care for everyone, always.",
    "Committed to continuous improvement in all we do.",
    "Enhancing health, ensuring care, empowering choice.",
    "Evidence-based care for exceptional outcomes.",
    "Striving for better standards every day.",
    "Person-centered care makes all the difference.",
    "Your well-being is our highest priority.",
    "Dignity and respect in every interaction.",
    "Promoting independence through quality care.",
    "Together we achieve outstanding healthcare.",
    "Compassionate care creates positive experiences.",
    "Quality through continuous improvement.",
    "Accountable, transparent, and responsive care.",
    "Setting the standard for excellence in healthcare.",
    "Leadership that inspires quality improvement.",
    "Every patient matters, every experience counts.",
    "Consistent, reliable care you can trust.",
    "Supporting your journey to better health.",
    "Meeting needs with professional excellence.",
    "Building a culture of safety and improvement."
  ];
  
  // Choose quote based on day to keep it consistent within the same day
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const quoteIndex = dayOfYear % cqcQuotes.length;
  
  return cqcQuotes[quoteIndex];
}

// Typing effect for text
function typingEffect(element, text, speed) {
  let i = 0;
  element.innerHTML = '';
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Add blinking cursor at the end
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      element.appendChild(cursor);
    }
  }
  
  type();
}

// Activity feed animations
function setupActivityFeed() {
  const activityItems = document.querySelectorAll('.activity-item');
  
  if (activityItems.length) {
    activityItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'all 0.3s ease-out';
      
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 100 + (index * 150));
    });
  }
}

// Dashboard cards entrance animation
function setupDashboardCards() {
  const cards = document.querySelectorAll('.dashboard-card');
  
  if (cards.length) {
    cards.forEach((card, index) => {
      card.classList.add('animate-scale-in');
      card.style.animationDelay = `${0.1 + (index * 0.1)}s`;
    });
  }
}

// Add navigation animation effects
function setupNavigationEffects() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    // Add hover animation
    link.addEventListener('mouseenter', () => {
      link.style.transform = 'translateY(-3px)';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.transform = 'translateY(0)';
    });
  });
  
  // Mobile menu toggle effects
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      
      if (mobileToggle.classList.contains('active')) {
        mobileToggle.style.transform = 'rotate(90deg)';
      } else {
        mobileToggle.style.transform = 'rotate(0deg)';
      }
    });
  }
}

// Entrance animations
function runEntranceAnimations() {
  // Animate quick actions
  const quickActions = document.querySelector('.quick-actions');
  if (quickActions) {
    quickActions.classList.add('stagger-fade-in');
  }
  
  // Animate dashboard cards with a staggered delay
  const cards = document.querySelectorAll('.dashboard-card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-fade-in');
    }, 300 + (index * 100));
  });
}

// Animate progress bars
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-bar');
  
  progressBars.forEach(bar => {
    const fill = bar.querySelector('.progress-bar-fill');
    const targetWidth = fill.getAttribute('data-width') || '0%';
    
    // Start at 0 width
    fill.style.width = '0%';
    
    // Animate to target width
    setTimeout(() => {
      fill.style.width = targetWidth;
    }, 300);
  });
}

// Animate number counters
function animateMetricCounters() {
  const counters = document.querySelectorAll('.metric-value');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target')) || 0;
    const duration = 1500; // ms
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    let current = 0;
    
    function updateCounter() {
      current += step;
      if (current > target) current = target;
      counter.textContent = current;
      
      if (current < target) {
        requestAnimationFrame(updateCounter);
      }
    }
    
    requestAnimationFrame(updateCounter);
  });
}

// Clock display with animation
function initializeLiveClock() {
  const clockElement = document.getElementById('live-clock');
  if (!clockElement) return;
  
  function updateClock() {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    clockElement.innerHTML = now.toLocaleDateString('en-GB', options);
  }
  
  // Update immediately, then start interval
  updateClock();
  setInterval(updateClock, 1000);
}

// Daily motivational quotes
function initializeMotivationalQuotes() {
  const motivationElement = document.getElementById('daily-motivation');
  if (!motivationElement) return;
  
  const motivationalQuotes = [
    "Excellence is not a destination; it's a continuous journey that never ends.",
    "Your growth and development are what matter most. Keep learning!",
    "Small improvements, consistently done, yield remarkable results.",
    "Great achievements require time, patience and sustained effort.",
    "Challenges are what make work interesting; overcoming them makes work meaningful.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "You don't have to be great to start, but you have to start to be great.",
    "The secret of getting ahead is getting started. Take that first step today!",
    "Progress is impossible without change, and those who cannot change cannot progress.",
    "Every expert was once a beginner. Keep going!",
    "Set your goals high, and don't stop until you get there.",
    "Your attitude determines your direction. Keep positive!",
    "The difference between ordinary and extraordinary is that little extra.",
    "The best way to predict your future is to create it.",
    "Success isn't about how much money you make. It's about the difference you make in people's lives."
  ];
  
  // Choose a quote based on the day of the year
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % motivationalQuotes.length;
  
  const todaysQuote = motivationalQuotes[quoteIndex];
  
  // Create typing effect
  motivationElement.textContent = '';
  
  let i = 0;
  function typeWriter() {
    if (i < todaysQuote.length) {
      motivationElement.textContent += todaysQuote.charAt(i);
      i++;
      setTimeout(typeWriter, 50);
    }
  }
  
  typeWriter();
}

// Celebration effects for achievements
function celebrateAchievement(targetElement) {
  // Add visual celebration
  if (targetElement) {
    targetElement.classList.add('animate-pulse');
    setTimeout(() => {
      targetElement.classList.remove('animate-pulse');
    }, 2000);
  }
  
  // Confetti removed as per user request
  
  // Add celebration notification
  const isUser = Math.random() > 0.5; // Random for demo purposes
  
  showNotification({
    title: 'Achievement Unlocked!',
    detail: isUser ? 'Great to have you here!' : 'Let\'s give them a warm welcome!',
    status: 'celebration',
    duration: 5000
  });
}

// Display a toast notification
function showNotification(config) {
  const { title, detail, status = 'info', duration = 4000 } = config;
  
  const notificationEl = document.createElement('div');
  notificationEl.className = `toast-notification ${status}`;
  notificationEl.innerHTML = `
    <div class="toast-icon">${getIconForStatus(status)}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${detail}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  // Add to DOM
  document.body.appendChild(notificationEl);
  
  // Animate in
  setTimeout(() => {
    notificationEl.classList.add('visible');
  }, 10);
  
  // Set auto dismiss
  const dismissTimeout = setTimeout(() => {
    dismissNotification(notificationEl);
  }, duration);
  
  // Close button
  const closeBtn = notificationEl.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    clearTimeout(dismissTimeout);
    dismissNotification(notificationEl);
  });
  
  // Helper for dismissal
  function dismissNotification(el) {
    el.classList.remove('visible');
    setTimeout(() => {
      el.remove();
    }, 300);
  }
  
  // Helper for icons
  function getIconForStatus(status) {
    switch(status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'celebration': return '🎉';
      default: return 'ℹ️';
    }
  }
}
