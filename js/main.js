document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Compact the translucent header after the first scroll without layout thrashing.
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Accessible mobile navigation.
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      }
    });
  }

  // Reveal elements once as they enter view; reduced-motion users see content immediately.
  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    revealItems.forEach(item => observer.observe(item));
  }

  // Hero video: the designed poster/placeholder stays visible until video playback starts.
  document.querySelectorAll('.hero-video').forEach(video => {
    const wrapper = video.closest('.hero-video-media');
    const markReady = () => wrapper?.classList.add('video-ready');
    const markFallback = () => wrapper?.classList.remove('video-ready');
    video.addEventListener('playing', markReady);
    video.addEventListener('error', markFallback);
    video.addEventListener('stalled', markFallback);
    if (!reduceMotion) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(markFallback);
    } else {
      video.pause();
      markFallback();
    }
  });

  // Location-first appointment enquiry flow.
  const modal = document.querySelector('.modal-backdrop');
  const result = document.querySelector('.booking-result');
  let selected = '';
  let lastTrigger = null;
  const openModal = event => {
    lastTrigger = event?.currentTarget || document.activeElement;
    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden', 'false');
    modal?.querySelector('.modal-close')?.focus();
  };
  const closeModal = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    result?.classList.remove('show');
    lastTrigger?.focus?.();
  };
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', openModal));
  document.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal?.classList.contains('open')) closeModal(); });

  document.querySelectorAll('[data-clinic-choice]').forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.clinicChoice;
    const clinic = window.SITE_CONFIG?.clinics?.[selected];
    const label = document.querySelector('#selected-clinic-label');
    if (label) label.textContent = clinic?.name || (selected === 'one' ? 'Clinic One' : 'Clinic Two');
    result?.classList.add('show');
  }));
  const selectedClinic = () => window.SITE_CONFIG?.clinics?.[selected];
  document.querySelector('[data-book-call]')?.addEventListener('click', () => {
    const phone = selectedClinic()?.phone;
    if (phone) window.location.href = 'tel:' + phone.replace(/[^\d+]/g, '');
    else alert('Add the verified clinic phone in js/config.js before launch.');
  });
  document.querySelector('[data-book-whatsapp]')?.addEventListener('click', () => {
    const number = window.SITE_CONFIG?.whatsappNumber || selectedClinic()?.phone?.replace(/\D/g, '');
    if (!number) { alert('Add the verified WhatsApp number in js/config.js before launch.'); return; }
    window.open('https://wa.me/' + number + '?text=' + encodeURIComponent('Hello, I would like to enquire about an appointment at ' + (selectedClinic()?.name || 'the clinic') + '.'), '_blank', 'noopener');
  });
  document.querySelectorAll('[data-team-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-team-filter]').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-team-location]').forEach(group => { group.hidden = button.dataset.teamFilter !== 'all' && group.dataset.teamLocation !== button.dataset.teamFilter; });
  }));
  document.querySelectorAll('[data-year]').forEach(item => item.textContent = new Date().getFullYear());
});
