// ============================================
// STARFIELD CANVAS
// ============================================
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let stars = [];
let width, height;

function initStars() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  const count = Math.floor((width * height) / 3000);
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.3,
      opacity: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, width, height);
  const now = performance.now() * 0.001;
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(now * s.speed * 40 + s.phase);
    const alpha = s.opacity * twinkle * 0.7;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,210,255,${alpha})`;
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}

initStars();
drawStars();
window.addEventListener('resize', initStars);

// ============================================
// CURSOR GLOW
// ============================================
const glow = document.querySelector('.cursor-glow');
let glowTimeout;

document.addEventListener('mousemove', (e) => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
  glow.classList.add('visible');
  clearTimeout(glowTimeout);
  glowTimeout = setTimeout(() => glow.classList.remove('visible'), 2000);
});

// ============================================
// HAMBURGER MENU
// ============================================
const hamburger = document.querySelector('.hamburger');
const navOverlay = document.querySelector('.nav-overlay');
const navLinks = document.querySelectorAll('.nav-links a');

hamburger.addEventListener('click', () => {
  const isOpen = navOverlay.classList.toggle('open');
  hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navOverlay.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ============================================
// ACTIVE SECTION (dot indicator + nav)
// ============================================
const sections = document.querySelectorAll('section[id]');
const dots = document.querySelectorAll('.nav-indicator .dot');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      dots.forEach(dot => {
        dot.classList.toggle('active', dot.dataset.section === id);
      });
    }
  });
}, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

sections.forEach(section => sectionObserver.observe(section));

// Dot click to scroll
dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const sectionId = dot.dataset.section;
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// ============================================
// COUNTER ANIMATION
// ============================================
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
let countersAnimated = false;

function animateCounters() {
  if (countersAnimated) return;
  statNumbers.forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(update);
  });
  countersAnimated = true;
}

const counterObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) animateCounters();
}, { threshold: 0.3 });

const statsContainer = document.querySelector('.about-stats');
if (statsContainer) counterObserver.observe(statsContainer);

// ============================================
// SCROLL REVEAL
// ============================================
const revealEls = document.querySelectorAll(
  '.skill-card, .bento-card, .about-lead, .about-details, .section-title'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  revealObserver.observe(el);
});

// ============================================
// MARQUEE PAUSE ON HOVER
// ============================================
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => {
    marqueeTrack.style.animationPlayState = 'paused';
  });
  marqueeTrack.addEventListener('mouseleave', () => {
    marqueeTrack.style.animationPlayState = 'running';
  });
}

// ============================================
// PARALLAX TILT ON BENTO CARDS
// ============================================
document.querySelectorAll('.bento-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  });
});
