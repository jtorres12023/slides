(async function initPresentation(global) {
  'use strict';

  const queryParams = new URLSearchParams(global.location.search);
  const deckParam = queryParams.get('deck');
  const deckManifest = Array.isArray(global.SLIDESHOW_DECKS) ? global.SLIDESHOW_DECKS : [];
  const fallbackDeckId = getDefaultDeckId();
  const requestedDeckId = deckParam || fallbackDeckId;

  function isSafeDeckId(value) {
    return /^[a-z0-9_-]+$/i.test(value);
  }

  function getDefaultDeckId() {
    const defaultEntry = deckManifest.find(entry => entry && entry.default);
    if (defaultEntry && isSafeDeckId(defaultEntry.id)) {
      return defaultEntry.id;
    }

    const firstEntry = deckManifest.find(entry => entry && isSafeDeckId(entry.id));
    return firstEntry ? firstEntry.id : 'welcome';
  }

  function getDeckEntry(deckId) {
    return deckManifest.find(entry => entry && entry.id === deckId) || null;
  }

  function getDeckPath(deckId) {
    const entry = getDeckEntry(deckId);
    return entry && entry.path ? entry.path : `assets/decks/${deckId}.js`;
  }

  function getDeckRegistry() {
    global.SLIDE_DECKS = global.SLIDE_DECKS || {};
    return global.SLIDE_DECKS;
  }

  function imageCanLoad(src) {
    return new Promise(resolve => {
      const image = new Image();
      const timeoutId = global.setTimeout(() => resolve(false), 600);
      image.onload = () => {
        global.clearTimeout(timeoutId);
        resolve(true);
      };
      image.onerror = () => {
        global.clearTimeout(timeoutId);
        resolve(false);
      };
      image.src = src;
    });
  }

  async function resolveBackgroundImages(rawBackgroundImages) {
    const requestedImages = Array.isArray(rawBackgroundImages) && rawBackgroundImages.length > 0
      ? rawBackgroundImages
      : ['assets/image1.jpg'];
    const results = await Promise.all(requestedImages.map(async src => ({
      src,
      canLoad: await imageCanLoad(src)
    })));
    const availableImages = results.filter(result => result.canLoad).map(result => result.src);
    return availableImages.length > 0 ? availableImages : ['assets/image1.jpg'];
  }

  function loadDeckScript(deckId) {
    return new Promise(resolve => {
      if (!deckId || !isSafeDeckId(deckId)) {
        resolve(false);
        return;
      }

      const deckRegistry = getDeckRegistry();
      if (deckRegistry[deckId]) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(`script[data-deck-id="${deckId}"]`);
      if (existingScript) {
        const done = () => resolve(Boolean(getDeckRegistry()[deckId]));
        existingScript.addEventListener('load', done, { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = getDeckPath(deckId);
      script.dataset.deckId = deckId;
      script.onload = () => resolve(Boolean(getDeckRegistry()[deckId]));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async function resolveDeck() {
    const requestedLoaded = await loadDeckScript(requestedDeckId);
    const deckRegistry = getDeckRegistry();
    if (requestedLoaded && deckRegistry[requestedDeckId]) {
      return {
        deck: deckRegistry[requestedDeckId],
        requestedDeckId,
        resolvedDeckId: requestedDeckId
      };
    }

    if (requestedDeckId !== fallbackDeckId) {
      const fallbackLoaded = await loadDeckScript(fallbackDeckId);
      if (fallbackLoaded && deckRegistry[fallbackDeckId]) {
        return {
          deck: deckRegistry[fallbackDeckId],
          requestedDeckId,
          resolvedDeckId: fallbackDeckId
        };
      }
    }

    const deckIds = Object.keys(deckRegistry);
    if (deckIds.length === 0) {
      return null;
    }

    return {
      deck: deckRegistry[deckIds[0]],
      requestedDeckId,
      resolvedDeckId: deckIds[0]
    };
  }

  const deckResolution = await resolveDeck();
  const deck = deckResolution ? deckResolution.deck : null;
  const resolvedDeckId = deckResolution ? deckResolution.resolvedDeckId : requestedDeckId;

  if (!deck) {
    console.error('No deck data found.');
    return;
  }

  const presentationContainer = document.getElementById('presentationContainer');
  if (!presentationContainer) {
    console.error('Presentation container not found.');
    return;
  }

  presentationContainer.innerHTML = deck.slidesHtml || '';
  if (deck.title) {
    document.title = deck.title;
  }

  const backgroundImages = await resolveBackgroundImages(deck.backgroundImages);
  const slideElements = Array.from(document.querySelectorAll('.slide'));

  slideElements.forEach((slide, index) => {
    slide.dataset.slide = String(index + 1);
    slide.classList.toggle('active', index === 0);
    slide.classList.remove('prev');

    const backgroundImage = backgroundImages[index % backgroundImages.length];
    slide.style.backgroundImage = `url('${backgroundImage}')`;
  });

  let currentSlide = 1;
  const totalSlides = slideElements.length;
  const deckController = document.getElementById('deckController');
  const deckControllerToggle = document.getElementById('deckControllerToggle');
  const deckControllerPanel = document.getElementById('deckControllerPanel');
  const deckControllerClose = document.getElementById('deckControllerClose');
  const deckSelect = document.getElementById('deckSelect');
  const deckOpenBtn = document.getElementById('deckOpenBtn');
  const deckCopyLinkBtn = document.getElementById('deckCopyLinkBtn');
  const deckList = document.getElementById('deckList');
  const currentDeckMeta = document.getElementById('currentDeckMeta');
  const slideJumpInput = document.getElementById('slideJumpInput');
  const slideJumpBtn = document.getElementById('slideJumpBtn');
  const imageOnlyToggle = document.getElementById('imageOnlyToggle');
  const controlsHoverToggle = document.getElementById('controlsHoverToggle');
  const spinnerToggle = document.getElementById('spinnerToggle');
  const spinnerPanel = document.getElementById('spinnerPanel');
  const spinnerClose = document.getElementById('spinnerClose');
  const spinnerFab = document.getElementById('spinnerFab');
  const attendeeList = document.getElementById('attendeeList');
  const spinnerWheel = document.getElementById('spinnerWheel');
  const spinnerCanvas = document.getElementById('spinnerCanvas');
  const spinButton = document.getElementById('spinButton');
  const spinnerResult = document.getElementById('spinnerResult');
  const spinnerHint = document.getElementById('spinnerHint');
  const slideCounter = document.getElementById('slideCounter');
  const CONTROLS_HOVER_MODE_KEY = 'presentationControlsHoverMode';

  const SPIN_TRANSITION = 'transform 3.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
  const SNAP_TRANSITION = 'transform 0.35s ease';
  let attendees = [];
  let currentRotation = 0;
  let isSpinning = false;
  let dragState = null;

  if (slideJumpInput) {
    slideJumpInput.max = String(totalSlides);
    slideJumpInput.placeholder = `1-${totalSlides}`;
  }

  function getAvailableDecks() {
    if (deckManifest.length > 0) {
      return deckManifest.filter(entry => entry && isSafeDeckId(entry.id));
    }

    return [
      {
        id: resolvedDeckId,
        title: deck.title || resolvedDeckId,
        description: 'Current deck'
      }
    ];
  }

  function createDeckUrl(deckId) {
    const url = new URL(global.location.href);
    url.searchParams.set('deck', deckId);
    return url.toString();
  }

  function openDeck(deckId) {
    if (!deckId || deckId === resolvedDeckId) return;
    global.location.href = createDeckUrl(deckId);
  }

  function setDeckControllerOpen(open) {
    if (!deckController || !deckControllerToggle) return;
    deckController.classList.toggle('active', open);
    deckControllerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function setCopyButtonText(text) {
    if (!deckCopyLinkBtn) return;
    deckCopyLinkBtn.textContent = text;
    global.setTimeout(() => {
      if (deckCopyLinkBtn) {
        deckCopyLinkBtn.textContent = 'Copy link';
      }
    }, 1600);
  }

  async function copyCurrentDeckLink() {
    const deckUrl = createDeckUrl(resolvedDeckId);
    try {
      if (global.navigator && global.navigator.clipboard) {
        await global.navigator.clipboard.writeText(deckUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = deckUrl;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyButtonText('Copied');
    } catch (error) {
      setCopyButtonText('Copy failed');
    }
  }

  function renderDeckController() {
    const availableDecks = getAvailableDecks();
    const currentEntry = getDeckEntry(resolvedDeckId);
    const currentTitle = deck.title || (currentEntry && currentEntry.title) || resolvedDeckId;

    if (currentDeckMeta) {
      currentDeckMeta.textContent = `${currentTitle} - ${totalSlides} slide${totalSlides === 1 ? '' : 's'}`;
    }

    if (deckSelect) {
      deckSelect.innerHTML = '';
      availableDecks.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.id;
        option.textContent = entry.title || entry.id;
        option.selected = entry.id === resolvedDeckId;
        deckSelect.appendChild(option);
      });
    }

    if (deckList) {
      deckList.innerHTML = '';
      availableDecks.forEach(entry => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'deck-list-item';
        item.dataset.deckId = entry.id;
        item.classList.toggle('active', entry.id === resolvedDeckId);
        const name = document.createElement('span');
        name.className = 'deck-list-name';
        name.textContent = entry.title || entry.id;
        const description = document.createElement('span');
        description.className = 'deck-list-description';
        description.textContent = entry.description || entry.id;
        item.append(name, description);
        item.addEventListener('click', () => {
          if (deckSelect) {
            deckSelect.value = entry.id;
          }
          openDeck(entry.id);
        });
        deckList.appendChild(item);
      });
    }
  }

  function updateSlide() {
    document.querySelectorAll('.slide').forEach(slide => {
      slide.classList.remove('active', 'prev');
    });

    document.querySelectorAll('.slide').forEach(slide => {
      const slideNum = parseInt(slide.dataset.slide || '0', 10);
      if (slideNum === currentSlide) {
        slide.classList.add('active');
      } else if (slideNum < currentSlide) {
        slide.classList.add('prev');
      }
    });

    if (slideCounter) {
      slideCounter.textContent = `${currentSlide} / ${totalSlides}`;
    }

    const progress = totalSlides > 0 ? (currentSlide / totalSlides) * 100 : 0;
    if (global.gsap) {
      global.gsap.to('#progressFill', {
        width: progress + '%',
        duration: 0.5,
        ease: 'power2.out'
      });
    } else {
      const progressFill = document.getElementById('progressFill');
      if (progressFill) progressFill.style.width = progress + '%';
    }

    animateSlideContent();
  }

  function animateSlideContent() {
    const activeSlide = document.querySelector('.slide.active .slide-content');
    if (!activeSlide || !global.gsap) return;

    global.gsap.set(
      activeSlide.querySelectorAll('h1, h2, h3, h4, p, li, .highlight-box, .success-box, .warning-box, .code-example, .column, .badge, [style*="linear-gradient"]'),
      {
        opacity: 0,
        y: 20
      }
    );

    const h1 = activeSlide.querySelector('h1');
    if (h1) {
      global.gsap.to(h1, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    }

    const h2 = activeSlide.querySelector('h2');
    if (h2) {
      global.gsap.to(h2, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.1,
        ease: 'power2.out'
      });
    }

    const subtitle = activeSlide.querySelector('.subtitle');
    if (subtitle) {
      global.gsap.to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.15,
        ease: 'power2.out'
      });
    }

    const boxes = activeSlide.querySelectorAll('.highlight-box, .success-box, .warning-box, .code-example');
    global.gsap.to(boxes, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      delay: 0.2,
      ease: 'power2.out'
    });

    const boxContent = activeSlide.querySelectorAll('.highlight-box h3, .highlight-box h4, .highlight-box p, .highlight-box ul, .highlight-box li, .success-box p, .success-box ul, .success-box li, .warning-box p, .warning-box h3, .warning-box h4, .warning-box li, .code-example *');
    global.gsap.to(boxContent, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.03,
      delay: 0.3,
      ease: 'power2.out'
    });

    const listItems = activeSlide.querySelectorAll('ul > li, ol > li');
    global.gsap.to(listItems, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.08,
      delay: 0.3,
      ease: 'power2.out'
    });

    const gradientCards = activeSlide.querySelectorAll('[style*="linear-gradient"]');
    global.gsap.set(gradientCards, { scale: 0.95 });
    global.gsap.to(gradientCards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.08,
      delay: 0.3,
      ease: 'back.out(1.2)'
    });

    const cardContent = activeSlide.querySelectorAll('[style*="linear-gradient"] h3, [style*="linear-gradient"] h4, [style*="linear-gradient"] p');
    global.gsap.to(cardContent, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.05,
      delay: 0.4,
      ease: 'power2.out'
    });

    const columns = activeSlide.querySelectorAll('.column');
    global.gsap.to(columns, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.12,
      delay: 0.25,
      ease: 'power2.out'
    });

    const columnContent = activeSlide.querySelectorAll('.column h4, .column p, .column ul, .column li');
    global.gsap.to(columnContent, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.03,
      delay: 0.35,
      ease: 'power2.out'
    });

    const badges = activeSlide.querySelectorAll('.badge');
    global.gsap.set(badges, { scale: 0.9 });
    global.gsap.to(badges, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      stagger: 0.08,
      delay: 0.35,
      ease: 'back.out(1.5)'
    });

    const otherElements = activeSlide.querySelectorAll('h3:not([style*="linear-gradient"] h3), h4:not([style*="linear-gradient"] h4), p:not(.subtitle):not([style*="linear-gradient"] p):not(li p):not(.highlight-box p):not(.success-box p):not(.warning-box p)');
    global.gsap.to(otherElements, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.06,
      delay: 0.2,
      ease: 'power2.out'
    });
  }

  function changeSlide(direction) {
    const newSlide = currentSlide + direction;
    if (newSlide >= 1 && newSlide <= totalSlides) {
      currentSlide = newSlide;
      updateSlide();
    }
  }

  function jumpToSlide() {
    if (!slideJumpInput) return;
    const target = parseInt(slideJumpInput.value, 10);
    if (Number.isNaN(target)) return;
    const clamped = Math.min(Math.max(target, 1), totalSlides);
    if (clamped !== currentSlide) {
      currentSlide = clamped;
      updateSlide();
    }
    slideJumpInput.value = '';
  }

  function setImageOnlyMode(enabled) {
    document.body.classList.toggle('image-only', enabled);
  }

  function setControlsHoverMode(enabled) {
    document.body.classList.toggle('controls-hover-mode', enabled);
  }

  function readControlsHoverPreference() {
    try {
      return global.localStorage.getItem(CONTROLS_HOVER_MODE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function writeControlsHoverPreference(enabled) {
    try {
      global.localStorage.setItem(CONTROLS_HOVER_MODE_KEY, enabled ? '1' : '0');
    } catch (error) {
      // Ignore storage failures (private mode, blocked storage, etc.).
    }
  }

  function parseAttendees(raw) {
    if (!raw) return [];
    return raw
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(Boolean);
  }

  function truncateLabel(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.slice(0, Math.max(0, maxLen - 3)) + '...';
  }

  function normalizeRotation(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function formatCompactLabel(name) {
    const clean = name.trim();
    if (!clean) return '';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
      if (clean.length <= 8) return clean;
      return clean.slice(0, 7) + '.';
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    const firstShort = first.length > 8 ? first.slice(0, 7) + '.' : first;
    const initial = last.charAt(0).toUpperCase();
    return `${firstShort} ${initial}.`;
  }

  function getWinnerIndexFromRotation(rotationDeg) {
    if (attendees.length === 0) return -1;
    const segAngle = 360 / attendees.length;
    const normalized = normalizeRotation(-rotationDeg);
    return Math.floor(normalized / segAngle) % attendees.length;
  }

  function drawWheel(rotationDeg = 0) {
    if (!spinnerCanvas) return;
    const ctx = spinnerCanvas.getContext('2d');
    if (!ctx) return;

    const size = spinnerCanvas.width;
    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(radius, radius);

    const count = attendees.length;
    if (count === 0) {
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#374151';
      ctx.font = '16px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add names', 0, 6);
      ctx.restore();
      return;
    }

    const colors = ['#c7d2fe', '#fecdd3', '#bbf7d0', '#bae6fd', '#fde68a', '#ddd6fe', '#fecaca', '#a7f3d0'];
    const segAngle = (Math.PI * 2) / count;
    const rotationRad = (rotationDeg * Math.PI) / 180;
    const compactLabels = count > 12;
    const sizeDivisor = compactLabels ? 7.2 : 5;
    const fontSize = Math.max(9, Math.min(16, (segAngle * radius) / sizeDivisor));
    const radiusText = radius * (compactLabels ? 0.53 : count > 8 ? 0.6 : 0.65);

    for (let i = 0; i < count; i += 1) {
      const start = -Math.PI / 2 + i * segAngle;
      const end = start + segAngle;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 6, start, end);
      ctx.closePath();
      ctx.fill();

      const midAngle = start + segAngle / 2;
      const x = Math.cos(midAngle) * radiusText;
      const y = Math.sin(midAngle) * radiusText;
      ctx.save();
      ctx.translate(x, y);

      const twoPi = Math.PI * 2;
      let screenTextAngle = midAngle + Math.PI / 2 + rotationRad;
      screenTextAngle = ((screenTextAngle % twoPi) + twoPi) % twoPi;
      if (screenTextAngle > Math.PI / 2 && screenTextAngle < Math.PI * 1.5) {
        screenTextAngle += Math.PI;
      }

      const textAngle = screenTextAngle - rotationRad;
      ctx.rotate(textAngle);
      ctx.fillStyle = '#1f2937';
      ctx.font = `${fontSize}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxChars = compactLabels ? 12 : Math.max(6, Math.min(18, Math.floor(22 - count / 2)));
      const baseLabel = compactLabels ? formatCompactLabel(attendees[i]) : attendees[i];
      const label = truncateLabel(baseLabel, maxChars) || attendees[i].charAt(0);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  function updateSpinnerState(resetResult) {
    const hasNames = attendees.length > 0;
    if (spinButton) {
      spinButton.disabled = !hasNames || isSpinning;
    }
    if (spinnerResult && resetResult) {
      spinnerResult.textContent = 'Winner: -';
    }
    if (spinnerHint) {
      spinnerHint.textContent = hasNames
        ? `Loaded ${attendees.length} name(s).${attendees.length > 12 ? ' Compact labels enabled.' : ''} Drag the wheel to adjust.`
        : 'Add names in the settings panel to enable.';
    }
  }

  function updateAttendeesFromInput() {
    attendees = attendeeList ? parseAttendees(attendeeList.value) : [];
    isSpinning = false;
    currentRotation = 0;
    if (spinnerWheel) {
      spinnerWheel.style.transition = SPIN_TRANSITION;
      spinnerWheel.style.transform = 'rotate(0deg)';
    }
    drawWheel(currentRotation);
    updateSpinnerState(true);
  }

  function updateResultFromRotation() {
    const idx = getWinnerIndexFromRotation(currentRotation);
    if (spinnerResult) {
      spinnerResult.textContent = idx >= 0 ? `Winner: ${attendees[idx]}` : 'Winner: -';
    }
  }

  function setSpinnerVisible(show) {
    if (!spinnerPanel) return;
    spinnerPanel.classList.toggle('active', show);
    spinnerPanel.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (spinnerToggle) {
      spinnerToggle.checked = show;
    }
  }

  function spinWheel() {
    if (isSpinning || attendees.length === 0 || !spinnerWheel) return;
    isSpinning = true;
    updateSpinnerState(false);

    const count = attendees.length;
    const segAngle = 360 / count;
    const winnerIndex = Math.floor(Math.random() * count);
    const desiredRotation = -1 * (winnerIndex + 0.5) * segAngle;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const desiredMod = ((desiredRotation % 360) + 360) % 360;
    const delta = desiredMod - currentMod;
    const spins = 4 + Math.floor(Math.random() * 3);
    const targetRotation = currentRotation + spins * 360 + delta;

    spinnerWheel.style.transition = SPIN_TRANSITION;
    spinnerWheel.style.transform = `rotate(${targetRotation}deg)`;
    currentRotation = targetRotation;

    global.setTimeout(() => {
      isSpinning = false;
      if (spinnerResult) {
        spinnerResult.textContent = `Winner: ${attendees[winnerIndex]}`;
      }
      if (spinnerHint) {
        spinnerHint.textContent = 'Click Spin again or drag to adjust.';
      }
      drawWheel(currentRotation);
      updateSpinnerState(false);
    }, 3300);
  }

  function snapToNearestSegment() {
    if (!spinnerWheel || attendees.length === 0) return;
    const segAngle = 360 / attendees.length;
    const idx = getWinnerIndexFromRotation(currentRotation);
    const desired = -1 * (idx + 0.5) * segAngle;
    const currentMod = normalizeRotation(currentRotation);
    const desiredMod = normalizeRotation(desired);
    let delta = desiredMod - currentMod;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    currentRotation += delta;
    spinnerWheel.style.transition = SNAP_TRANSITION;
    spinnerWheel.style.transform = `rotate(${currentRotation}deg)`;

    global.setTimeout(() => {
      if (spinnerWheel) {
        spinnerWheel.style.transition = SPIN_TRANSITION;
      }
      drawWheel(currentRotation);
    }, 400);

    updateResultFromRotation();
  }

  function getPointerAngle(event) {
    if (!spinnerWheel) return 0;
    const rect = spinnerWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(event.clientY - centerY, event.clientX - centerX);
  }

  document.addEventListener('keydown', event => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') {
        return;
      }
    }

    const deckControllerActive = deckController && deckController.classList.contains('active');
    if (deckControllerActive && event.key === 'Escape') {
      event.preventDefault();
      setDeckControllerOpen(false);
      return;
    }

    const spinnerActive = spinnerPanel && spinnerPanel.classList.contains('active');
    if (spinnerActive) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSpinnerVisible(false);
      }
      return;
    }

    if (event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      changeSlide(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changeSlide(-1);
    }
  });

  if (deckControllerToggle) {
    deckControllerToggle.addEventListener('click', () => {
      const isOpen = deckController && deckController.classList.contains('active');
      setDeckControllerOpen(!isOpen);
    });
  }

  if (deckControllerClose) {
    deckControllerClose.addEventListener('click', () => {
      setDeckControllerOpen(false);
    });
  }

  if (deckOpenBtn) {
    deckOpenBtn.addEventListener('click', () => {
      if (deckSelect) {
        openDeck(deckSelect.value);
      }
    });
  }

  if (deckSelect) {
    deckSelect.addEventListener('change', () => {
      openDeck(deckSelect.value);
    });
  }

  if (deckCopyLinkBtn) {
    deckCopyLinkBtn.addEventListener('click', copyCurrentDeckLink);
  }

  if (deckControllerPanel) {
    deckControllerPanel.addEventListener('click', event => {
      event.stopPropagation();
    });
  }

  if (slideJumpBtn) {
    slideJumpBtn.addEventListener('click', jumpToSlide);
  }

  if (slideJumpInput) {
    slideJumpInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        jumpToSlide();
      }
    });
  }

  if (imageOnlyToggle) {
    imageOnlyToggle.addEventListener('change', () => {
      setImageOnlyMode(imageOnlyToggle.checked);
    });
  }

  if (controlsHoverToggle) {
    const savedHoverMode = readControlsHoverPreference();
    controlsHoverToggle.checked = savedHoverMode;
    setControlsHoverMode(savedHoverMode);

    controlsHoverToggle.addEventListener('change', () => {
      const enabled = controlsHoverToggle.checked;
      setControlsHoverMode(enabled);
      writeControlsHoverPreference(enabled);
    });
  }

  if (attendeeList) {
    attendeeList.addEventListener('input', updateAttendeesFromInput);
  }

  if (spinnerToggle) {
    spinnerToggle.addEventListener('change', () => {
      setSpinnerVisible(spinnerToggle.checked);
    });
  }

  if (spinnerClose) {
    spinnerClose.addEventListener('click', () => {
      setSpinnerVisible(false);
    });
  }

  if (spinnerFab) {
    spinnerFab.addEventListener('click', () => {
      if (!spinnerPanel) return;
      setSpinnerVisible(!spinnerPanel.classList.contains('active'));
    });
  }

  if (spinButton) {
    spinButton.addEventListener('click', spinWheel);
  }

  if (spinnerWheel) {
    spinnerWheel.addEventListener('pointerdown', event => {
      if (isSpinning || attendees.length === 0) return;
      dragState = {
        startAngle: getPointerAngle(event),
        startRotation: currentRotation
      };
      spinnerWheel.setPointerCapture(event.pointerId);
      spinnerWheel.style.transition = 'none';
    });

    spinnerWheel.addEventListener('pointermove', event => {
      if (!dragState || !spinnerWheel) return;
      const currentAngle = getPointerAngle(event);
      const deltaRad = currentAngle - dragState.startAngle;
      currentRotation = dragState.startRotation + (deltaRad * 180) / Math.PI;
      spinnerWheel.style.transform = `rotate(${currentRotation}deg)`;
      updateResultFromRotation();
    });

    const endDrag = event => {
      if (!dragState || !spinnerWheel) return;
      spinnerWheel.releasePointerCapture(event.pointerId);
      dragState = null;
      snapToNearestSegment();
    };

    spinnerWheel.addEventListener('pointerup', endDrag);
    spinnerWheel.addEventListener('pointercancel', endDrag);
    spinnerWheel.addEventListener('pointerleave', event => {
      if (dragState) {
        endDrag(event);
      }
    });
  }

  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].screenX;
  });

  document.addEventListener('touchend', event => {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
      changeSlide(1);
    }
    if (touchEndX > touchStartX + 50) {
      changeSlide(-1);
    }
  }

  renderDeckController();
  updateSlide();
  updateAttendeesFromInput();
  if (global.gsap) {
    global.gsap.delayedCall(0.1, animateSlideContent);
  }
})(window);
