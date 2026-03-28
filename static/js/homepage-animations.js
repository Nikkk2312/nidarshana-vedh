/* ============================================
   HOMEPAGE ANIMATIONS
   Wisdom band, 3D cards, icon effects,
   zodiac wheel, scroll effects
   ============================================ */

(function () {
  'use strict';

  var isMobile = window.innerWidth < 768;

  // --- Scroll Progress Bar ---
  var progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (scrollTop / docHeight * 100) + '%';
    }, { passive: true });
  }

  // --- Text Reveal on Scroll ---
  var textReveals = document.querySelectorAll('.text-reveal');
  if (textReveals.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    textReveals.forEach(function (el) { revealObserver.observe(el); });
  }

  // --- Wisdom Band Infinite Scroll ---
  var wisdomTrack = document.querySelector('.wisdom-track');
  if (wisdomTrack) {
    wisdomTrack.innerHTML += wisdomTrack.innerHTML;
  }

  // --- 3D Card Tilt ---
  if (!isMobile) {
    var cards = document.querySelectorAll('.card-3d');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -6;
        var rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(10px)';
        card.style.setProperty('--mouse-x', (x / rect.width * 100).toFixed(0) + '%');
        card.style.setProperty('--mouse-y', (y / rect.height * 100).toFixed(0) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  // --- Niche Card Icon Hover Animations ---
  var nicheCards = document.querySelectorAll('.niche-card');
  var iconEffects = ['pulse', 'spin', 'float', 'shimmer', 'heartbeat', 'glow', 'sway', 'takeoff'];
  nicheCards.forEach(function (card, i) {
    var icon = card.querySelector('.niche-icon');
    if (!icon) return;
    var effect = iconEffects[i] || 'pulse';
    card.addEventListener('mouseenter', function () { icon.classList.add('icon-' + effect); });
    card.addEventListener('mouseleave', function () { icon.classList.remove('icon-' + effect); });
  });

  // --- Section Divider SVG Line Draw ---
  var dividers = document.querySelectorAll('.section-divider');
  if (dividers.length) {
    var dividerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          dividerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    dividers.forEach(function (d) { dividerObserver.observe(d); });
  }

  // --- Staggered Fade-In ---
  var fadeEls = document.querySelectorAll('.fade-in[data-delay]');
  fadeEls.forEach(function (el) {
    el.style.setProperty('--stagger-delay', el.dataset.delay);
  });

  // --- CTA Zodiac Wheel (canvas-based, meaningful animation) ---
  var ctaCanvas = document.getElementById('cta-zodiac-canvas');
  if (ctaCanvas) {
    var ctx = ctaCanvas.getContext('2d');
    var rashiSymbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
    var rashiNames = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];

    function resizeCtaCanvas() {
      var rect = ctaCanvas.parentElement.getBoundingClientRect();
      ctaCanvas.width = rect.width * window.devicePixelRatio;
      ctaCanvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctaCanvas.style.width = rect.width + 'px';
      ctaCanvas.style.height = rect.height + 'px';
    }
    resizeCtaCanvas();
    window.addEventListener('resize', resizeCtaCanvas);

    var ctaAngle = 0;
    var ctaVisible = false;

    var ctaObserver = new IntersectionObserver(function (entries) {
      ctaVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    ctaObserver.observe(ctaCanvas);

    function drawZodiacWheel() {
      if (!ctaVisible) {
        requestAnimationFrame(drawZodiacWheel);
        return;
      }

      var w = ctaCanvas.width / window.devicePixelRatio;
      var h = ctaCanvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      var cx = w / 2;
      var cy = h / 2;
      var maxR = Math.min(w, h) * 0.42;

      ctaAngle += 0.002;

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(196, 154, 44, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(196, 154, 44, 0.06)';
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(196, 154, 44, 0.2)';
      ctx.fill();

      // 12 division lines
      for (var i = 0; i < 12; i++) {
        var a = ctaAngle + (i * Math.PI * 2 / 12);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * maxR * 0.65, cy + Math.sin(a) * maxR * 0.65);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.strokeStyle = 'rgba(196, 154, 44, 0.06)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Rashi symbols on outer ring
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var j = 0; j < 12; j++) {
        var angle = ctaAngle + (j * Math.PI * 2 / 12) + (Math.PI / 12);
        var r = maxR * 0.83;
        var x = cx + Math.cos(angle) * r;
        var y = cy + Math.sin(angle) * r;

        // Symbol
        ctx.font = '16px serif';
        ctx.fillStyle = 'rgba(196, 154, 44, 0.3)';
        ctx.fillText(rashiSymbols[j], x, y - 6);

        // Name
        ctx.font = '500 7px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(196, 154, 44, 0.15)';
        ctx.fillText(rashiNames[j], x, y + 8);
      }

      // Slowly pulsing center glow
      var pulse = 0.08 + Math.sin(Date.now() * 0.002) * 0.04;
      var gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.4);
      gradient.addColorStop(0, 'rgba(196, 154, 44, ' + pulse + ')');
      gradient.addColorStop(1, 'rgba(196, 154, 44, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      requestAnimationFrame(drawZodiacWheel);
    }

    drawZodiacWheel();
  }

  // --- Floating Particles ---
  var particleContainer = document.getElementById('floating-particles');
  if (particleContainer && !isMobile) {
    for (var i = 0; i < 25; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--duration', (12 + Math.random() * 18) + 's');
      p.style.setProperty('--delay', (Math.random() * 15) + 's');
      p.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
      p.style.setProperty('--max-opacity', (0.15 + Math.random() * 0.2).toFixed(2));
      particleContainer.appendChild(p);
    }
  }

  // --- Blog Card Staggered Entrance ---
  var blogCards = document.querySelectorAll('.blog-card');
  if (blogCards.length) {
    var blogObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          blogObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    blogCards.forEach(function (card, i) {
      card.style.transitionDelay = (i * 0.15) + 's';
      blogObserver.observe(card);
    });
  }

})();
