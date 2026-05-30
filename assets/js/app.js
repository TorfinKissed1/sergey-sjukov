/* Полусухая стяжка от Сергея Жукова — interactions
 * Sticky services stage, reveal motion, parallax, mobile menu, no libraries.
 */

(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopServicesQuery = window.matchMedia('(min-width: 1025px)');
  const tabletServicesQuery = window.matchMedia('(max-width: 1280px)');
  const hasReducedMotion = () => reducedMotionQuery.matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // ---------------------------------------------------------------------------
  // Preloader
  // ---------------------------------------------------------------------------
  const preloader = document.querySelector('.preloader');
  const preloaderPct = document.querySelector('.preloader__pct');
  let preloaderValue = 0;
  let preloaderFinished = false;
  let preloaderFallbackTimer = 0;
  let siteReadyFired = false;

  function fireSiteReady() {
    if (siteReadyFired) return;
    siteReadyFired = true;
    document.dispatchEvent(new Event('site:ready'));
  }

  function finishPreloader() {
    if (preloaderFinished) return;
    preloaderFinished = true;
    window.clearTimeout(preloaderFallbackTimer);

    if (preloader) {
      preloader.classList.add('preloader--done');
      setTimeout(() => preloader.remove(), hasReducedMotion() ? 0 : 1050);
    }
    body.classList.remove('page--preloading');
    fireSiteReady();
  }

  function tickPreloader() {
    if (preloaderFinished) return;

    const increment = Math.max(2.6, (100 - preloaderValue) * 0.14);
    preloaderValue = Math.min(100, preloaderValue + increment);

    if (preloaderPct) {
      preloaderPct.textContent = String(Math.floor(preloaderValue)).padStart(3, '0');
    }
    if (preloader) {
      preloader.style.setProperty('--p', preloaderValue + '%');
    }

    if (preloaderValue < 100) {
      requestAnimationFrame(tickPreloader);
    } else {
      setTimeout(finishPreloader, hasReducedMotion() ? 0 : 180);
    }
  }

  if (preloader) {
    preloaderFallbackTimer = window.setTimeout(finishPreloader, hasReducedMotion() ? 0 : 2400);
    setTimeout(() => requestAnimationFrame(tickPreloader), hasReducedMotion() ? 0 : 80);
  } else {
    body.classList.remove('page--preloading');
    queueMicrotask(fireSiteReady);
  }

  // ---------------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------------
  const header = document.querySelector('[data-header]');
  const parallaxItems = Array.from(document.querySelectorAll('[data-parallax]')).map((element) => ({
    element,
    speed: Number.parseFloat(element.dataset.parallax || '0.2') || 0.2,
  }));
  const floatArtItems = Array.from(document.querySelectorAll('[data-float-art]'));

  const servicesSection = document.querySelector('[data-pin-services]');
  const servicesVisual = document.querySelector('.services__visual');
  const serviceCards = Array.from(document.querySelectorAll('[data-service-card]'));
  const serviceNavItems = Array.from(document.querySelectorAll('[data-service-nav]'));
  const tickerTracks = Array.from(document.querySelectorAll('.ticker__track'));
  const tickerSources = new WeakMap();

  let scrollY = window.scrollY || window.pageYOffset;
  let scrollRequested = false;
  let tickerResizeTimer = 0;
  let servicesScrollHeight = '';

  // ---------------------------------------------------------------------------
  // Seamless ticker tracks
  // ---------------------------------------------------------------------------
  function appendTickerItems(group, items) {
    items.forEach((item) => {
      group.insertAdjacentHTML('beforeend', item);
    });
  }

  function getTickerSource(track) {
    const storedItems = tickerSources.get(track);
    if (storedItems) return storedItems;

    const items = Array.from(track.children)
      .filter((child) => child.classList.contains('ticker__item'))
      .map((item) => item.outerHTML);

    tickerSources.set(track, items);
    return items;
  }

  function setupTickerTrack(track) {
    const items = getTickerSource(track);
    if (items.length === 0) return;

    track.innerHTML = '';

    const group = document.createElement('div');
    group.className = 'ticker__group';
    track.append(group);

    const containerWidth = track.parentElement ? track.parentElement.clientWidth : window.innerWidth;
    const targetWidth = Math.max(containerWidth, window.innerWidth) * 1.15;
    let copies = 0;

    do {
      appendTickerItems(group, items);
      copies += 1;
    } while (group.scrollWidth < targetWidth && copies < 16);

    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);

    const duration = clamp(group.scrollWidth / 44, 24, 54);
    track.style.setProperty('--ticker-duration', `${duration.toFixed(1)}s`);
  }

  function setupTickers() {
    tickerTracks.forEach(setupTickerTrack);
  }

  setupTickers();

  window.addEventListener('resize', () => {
    window.clearTimeout(tickerResizeTimer);
    tickerResizeTimer = window.setTimeout(setupTickers, 160);
  }, { passive: true });

  // ---------------------------------------------------------------------------
  // Sticky services stage
  // ---------------------------------------------------------------------------
  function getServiceSegment(index) {
    if (serviceCards.length === 3) {
      return [
        { start: 0, end: 0.32 },
        { start: 0.32, end: 0.74 },
        { start: 0.74, end: 1 },
      ][index] || { start: 0, end: 1 };
    }

    const segmentSize = serviceCards.length <= 1 ? 1 : 1 / serviceCards.length;
    return {
      start: segmentSize * index,
      end: segmentSize * (index + 1),
    };
  }

  function getActiveServiceIndex(progressValue) {
    if (serviceCards.length <= 1) return 0;
    if (serviceCards.length === 3) {
      if (progressValue < 0.32) return 0;
      if (progressValue < 0.74) return 1;
      return 2;
    }

    return clamp(Math.floor(progressValue * serviceCards.length), 0, serviceCards.length - 1);
  }

  function setActiveService(index, progressValue) {
    serviceCards.forEach((card, cardIndex) => {
      const isActive = cardIndex === index;
      card.classList.toggle('service-card--active', isActive);
      card.classList.toggle('service-card--before', cardIndex < index);

      const segment = getServiceSegment(cardIndex);
      const segmentSize = Math.max(0.001, segment.end - segment.start);
      const localProgress = serviceCards.length <= 1
        ? 1
        : clamp((progressValue - segment.start) / segmentSize, 0, 1);
      card.style.setProperty('--card-progress', localProgress.toFixed(3));
    });

    serviceNavItems.forEach((item, itemIndex) => {
      item.classList.toggle('services-nav__item--active', itemIndex === index);
    });
  }

  function getServicesProgressOffset() {
    if (!tabletServicesQuery.matches || !servicesVisual) return 0;

    const visualOffset = servicesVisual.offsetTop || 0;
    const viewportGuard = Math.min(180, window.innerHeight * 0.22);
    return Math.max(0, visualOffset - viewportGuard);
  }

  function updateServicesScrollHeight() {
    if (!servicesSection) return;

    if (!desktopServicesQuery.matches || hasReducedMotion()) {
      if (servicesScrollHeight) {
        servicesSection.style.removeProperty('--services-scroll-height');
        servicesScrollHeight = '';
      }
      return;
    }

    const viewportHeight = window.innerHeight || root.clientHeight || 1;
    const transitionSpan = tabletServicesQuery.matches ? 0.82 : 0.9;
    const bufferSpan = tabletServicesQuery.matches ? 0.12 : 0.16;
    const scrollScreens = 1 + Math.max(0, serviceCards.length - 1) * transitionSpan + bufferSpan;
    const minHeight = `${Math.round(viewportHeight * scrollScreens)}px`;

    if (servicesScrollHeight !== minHeight) {
      servicesSection.style.setProperty('--services-scroll-height', minHeight);
      servicesScrollHeight = minHeight;
    }
  }

  function updatePinnedServices() {
    if (!servicesSection || serviceCards.length === 0) return;

    if (!desktopServicesQuery.matches || hasReducedMotion()) {
      servicesSection.style.setProperty('--services-progress', '1');
      serviceCards.forEach((card) => {
        card.classList.add('service-card--active');
        card.classList.remove('service-card--before');
        card.style.setProperty('--card-progress', '1');
      });
      return;
    }

    const rect = servicesSection.getBoundingClientRect();
    const progressOffset = getServicesProgressOffset();
    const distance = Math.max(1, rect.height - window.innerHeight - progressOffset);
    const progressValue = clamp((-rect.top - progressOffset) / distance, 0, 1);
    const activeIndex = getActiveServiceIndex(progressValue);

    servicesSection.style.setProperty('--services-progress', progressValue.toFixed(4));
    setActiveService(activeIndex, progressValue);
  }

  serviceNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      if (!servicesSection || serviceCards.length <= 1) return;
      const index = Number.parseInt(item.dataset.serviceNav || '0', 10);
      const segment = getServiceSegment(index);
      const targetProgress = serviceCards.length <= 1
        ? 1
        : clamp(segment.start + (segment.end - segment.start) * 0.5, 0, 1);

      if (tabletServicesQuery.matches) {
        servicesSection.style.setProperty('--services-progress', targetProgress.toFixed(4));
        setActiveService(index, targetProgress);
        return;
      }

      const progressOffset = getServicesProgressOffset();
      const maxDistance = Math.max(1, servicesSection.offsetHeight - window.innerHeight - progressOffset);
      const targetY = servicesSection.offsetTop + progressOffset + maxDistance * targetProgress;
      window.scrollTo({ top: targetY, behavior: hasReducedMotion() ? 'auto' : 'smooth' });
    });
  });

  // ---------------------------------------------------------------------------
  // Scroll state: header, progress, parallax, sticky stage
  // ---------------------------------------------------------------------------
  function applyScrollState() {
    scrollRequested = false;

    if (header) {
      header.classList.toggle('header--scrolled', scrollY > 32);
    }

    if (!hasReducedMotion()) {
      parallaxItems.forEach(({ element, speed }) => {
        element.style.transform = `translate3d(0, ${(scrollY * speed).toFixed(1)}px, 0)`;
      });

      floatArtItems.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const y = clamp((window.innerHeight * 0.5 - rect.top) * 0.08, -76, 96);
        element.style.setProperty('--art-y', `${y.toFixed(1)}px`);
      });
    }

    updateServicesScrollHeight();
    updatePinnedServices();
  }

  function onScroll() {
    scrollY = window.scrollY || window.pageYOffset;
    if (!scrollRequested) {
      scrollRequested = true;
      requestAnimationFrame(applyScrollState);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    updateServicesScrollHeight();
    applyScrollState();
  }, { passive: true });
  desktopServicesQuery.addEventListener('change', applyScrollState);
  tabletServicesQuery.addEventListener('change', applyScrollState);
  reducedMotionQuery.addEventListener('change', applyScrollState);
  applyScrollState();

  // ---------------------------------------------------------------------------
  // Mobile menu
  // ---------------------------------------------------------------------------
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  function setMenuState(isOpen) {
    if (!menuButton || !mobileMenu) return;

    menuButton.classList.toggle('burger--active', isOpen);
    mobileMenu.classList.toggle('mobile-menu--open', isOpen);
    header && header.classList.toggle('header--menu-open', isOpen);
    body.classList.toggle('page--menu-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      setMenuState(!mobileMenu.classList.contains('mobile-menu--open'));
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });

    mobileMenu.addEventListener('click', (event) => {
      if (event.target === mobileMenu) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuState(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Reveal and counters
  // ---------------------------------------------------------------------------
  function startCounter(element) {
    if (element.dataset.counted === 'true') return;
    element.dataset.counted = 'true';

    const target = Number.parseFloat(element.dataset.counter || '0');
    const duration = Number.parseInt(element.dataset.dur || '1200', 10);
    const startedAt = performance.now();

    function frame(now) {
      const progressValue = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      const current = target * eased;
      element.textContent = Math.floor(current).toLocaleString('ru-RU');

      if (progressValue < 1) {
        requestAnimationFrame(frame);
      } else {
        element.textContent = Math.floor(target).toLocaleString('ru-RU');
      }
    }

    requestAnimationFrame(frame);
  }

  function initReveals() {
    const targets = Array.from(document.querySelectorAll('.reveal, .word-reveal, [data-counter]'));

    if (hasReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((target) => {
        if (target.classList.contains('word-reveal')) {
          target.classList.add('word-reveal--visible');
        } else {
          target.classList.add('reveal--visible');
        }
        if (target.dataset.counter) startCounter(target);
      });
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = entry.target;
        if (target.classList.contains('word-reveal')) {
          target.classList.add('word-reveal--visible');
        } else {
          target.classList.add('reveal--visible');
        }

        if (target.dataset.counter) {
          startCounter(target);
        }

        observer.unobserve(target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((element) => revealObserver.observe(element));

    document.querySelectorAll('.hero .reveal, .hero .word-reveal').forEach((element) => {
      if (element.classList.contains('word-reveal')) {
        element.classList.add('word-reveal--visible');
      } else {
        element.classList.add('reveal--visible');
      }
    });
  }

  document.addEventListener('site:ready', initReveals, { once: true });

  // ---------------------------------------------------------------------------
  // Card hover tilt / pointer light
  // ---------------------------------------------------------------------------
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    if (hasReducedMotion()) return;

    card.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = clamp(x / rect.width, 0, 1);
      const py = clamp(y / rect.height, 0, 1);
      const rotateY = (px - 0.5) * 3.2;
      const rotateX = (0.5 - py) * 3.2;

      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--mx', '82%');
      card.style.setProperty('--my', '20%');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  // ---------------------------------------------------------------------------
  // Phone mask
  // ---------------------------------------------------------------------------
  document.querySelectorAll('input[name="phone"]').forEach((phoneInput) => {
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value) phoneInput.value = '+7 (';
    });

    phoneInput.addEventListener('input', () => {
      let value = phoneInput.value.replace(/\D/g, '');
      if (value.startsWith('8')) value = '7' + value.slice(1);
      if (!value.startsWith('7')) value = '7' + value;
      value = value.slice(0, 11);

      const payload = value.slice(1);
      let formatted = '+7';
      if (payload.length > 0) formatted += ` (${payload.slice(0, 3)}`;
      if (payload.length >= 4) formatted += `) ${payload.slice(3, 6)}`;
      if (payload.length >= 7) formatted += `-${payload.slice(6, 8)}`;
      if (payload.length >= 9) formatted += `-${payload.slice(8, 10)}`;
      phoneInput.value = formatted;
    });
  });

  // ---------------------------------------------------------------------------
  // Lead form submit state for static landing
  // ---------------------------------------------------------------------------
  const leadForm = document.querySelector('#lead-form');
  const leadSuccess = document.querySelector('.contact-form__success');

  if (leadForm) {
    leadForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const requiredFields = Array.from(leadForm.querySelectorAll('[required]'));
      const invalidField = requiredFields.find((field) => !field.value.trim());
      if (invalidField) {
        invalidField.focus();
        invalidField.reportValidity && invalidField.reportValidity();
        return;
      }

      const submit = leadForm.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Отправляем…';
      }

      setTimeout(() => {
        leadForm.hidden = true;
        leadSuccess && leadSuccess.classList.add('contact-form__success--visible');
      }, hasReducedMotion() ? 0 : 480);
    });
  }

  // ---------------------------------------------------------------------------
  // Dynamic year
  // ---------------------------------------------------------------------------
  const yearElement = document.querySelector('[data-year]');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
})();
