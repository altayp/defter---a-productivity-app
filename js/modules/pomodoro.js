/* ═══════════════════════════════════════
   pomodoro.js
   ═══════════════════════════════════════ */

/* ── Faz ikonları (yüklenen SVG path'leri) ── */
const POMO_PHASE_ICONS = {
  focus: `<svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.16923 2.00234C8.11301 2.00078 8.0566 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 7.9434 13.9992 7.88699 13.9977 7.83077L15.7642 6.06422C15.9182 6.68407 16 7.33249 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C8.66751 0 9.31593 0.0817526 9.93578 0.235791L8.16923 2.00234Z" fill="currentColor"/><path d="M4 7.99996C4 6.13612 5.27477 4.57002 7 4.12598V6.26752C6.4022 6.61333 6 7.25968 6 7.99996C6 9.10453 6.89543 9.99996 8 9.99996C8.74028 9.99996 9.38663 9.59776 9.73244 8.99996H11.874C11.4299 10.7252 9.86384 12 8 12C5.79086 12 4 10.2091 4 7.99996Z" fill="currentColor"/><path d="M14 2L13 0L10 3V4.58579L7.79289 6.79289L9.20711 8.20711L11.4142 6H13L16 3L14 2Z" fill="currentColor"/></svg>`,
  'short-break': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="6" y1="1" x2="6" y2="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="14" y1="1" x2="14" y2="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  'long-break': `<svg width="18" height="18" viewBox="-97 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M68.822,394.263l21.259,-49.604l51.65,51.65l-16.93,34.695c-1.613,3.306 -3.784,6.309 -6.418,8.877l-63.912,62.324c-12.504,12.193 -32.56,12.023 -44.961,-0.275c-12.627,-12.523 -12.708,-33.027 -0.073,-45.543l52.492,-51.994c2.929,-2.901 5.269,-6.341 6.893,-10.13Zm25.076,-180.83l26.489,-10.52l-18.105,82.627c-1.075,4.907 0.217,10.035 3.489,13.846l0.28,0.326l53.312,60.288l-0.167,0.517l0.224,-0.46l32.816,44.244c2.456,3.31 4.249,7.065 5.28,11.056l18.488,71.534c4.45,17.218 22.205,27.473 39.384,22.87c16.869,-4.52 27.116,-21.762 22.878,-38.705l-21.323,-85.252c-1.111,-4.444 -3.163,-8.597 -6.018,-12.179l-54.38,-68.24l16.859,-65.748l9.711,25.748c2.123,5.629 5.789,10.546 10.579,14.186l33.912,25.773c14.026,10.66 34.04,7.965 44.762,-6.013c10.783,-14.057 8.104,-34.213 -5.99,-44.947l-25.107,-19.123c-4.523,-3.445 -8.047,-8.033 -10.208,-13.292l-21.681,-52.748c-2.806,-6.826 -7.906,-12.036 -14.053,-15.086l0.034,-0.135c0,0 -25.696,-17.436 -44.5,-22.5c-19.553,-5.265 -50.639,-1.941 -54.17,-1.538c-3.94,-0.014 -7.947,0.704 -11.834,2.238l-72.866,28.762c-1.72,0.679 -3.217,1.821 -4.327,3.299l-33.134,44.146c-10.593,14.114 -7.735,34.159 6.357,44.782c14.112,10.639 34.204,7.844 44.842,-6.268l21.296,-28.249c1.767,-2.343 4.144,-4.155 6.871,-5.239Zm105.465,-101.433c30.928,0 56,-25.072 56,-56c0,-30.928 -25.072,-56 -56,-56c-30.928,0 -56,25.072 -56,56c0,30.928 25.072,56 56,56Z"/></svg>`,
};

/* ── Varsayılan ayarlar ── */
const POMO_DEFAULTS = {
  focusMins:        25,
  shortBreakMins:   5,
  longBreakMins:    15,
  sessionsUntilLong: 4,
  alarmSound:       'bell',
  alarmVolume:      0.6,
  autoStart:        false,
  emojiRain:        true,
};

/* ── Durum ──
   completedInRound : bu turdaki tamamlanan odak seansı sayısı (0..sessionsUntilLong)
   totalToday       : bugün tamamlanan toplam odak seansı
*/
const pomoState = {
  phase:            'focus',
  secondsLeft:      0,
  running:          false,
  intervalId:       null,
  completedInRound: 0,
  settings:         null,
};

function pomoSettings() {
  if (!pomoState.settings) {
    pomoState.settings = loadJSON('pomo-settings', { ...POMO_DEFAULTS });
    // Eksik alanları varsayılanla tamamla
    Object.keys(POMO_DEFAULTS).forEach(k => {
      if (pomoState.settings[k] === undefined) pomoState.settings[k] = POMO_DEFAULTS[k];
    });
  }
  return pomoState.settings;
}

function savePomoDayStats() {
  const today = new Date().toDateString();
  const data  = loadJSON('pomo-day-stats', {});
  data[today] = (data[today] || 0) + 1;
  saveJSON('pomo-day-stats', data);
}

function getPomoDayStats() {
  const today = new Date().toDateString();
  return loadJSON('pomo-day-stats', {})[today] || 0;
}

/* ── Faz rengi ── */
function phaseColor() {
  if (pomoState.phase === 'focus')       return 'var(--accent)';
  if (pomoState.phase === 'short-break') return '#5aaad4';
  return '#aa88d8';
}

/* ── Faz etiketi ── */
function phaseLabel() {
  if (pomoState.phase === 'focus')       return 'Odak';
  if (pomoState.phase === 'short-break') return 'Kısa Mola';
  return 'Uzun Mola';
}

function phaseIconHTML(size) {
  const s = size || 16;
  const key = pomoState.phase;
  const svg = POMO_PHASE_ICONS[key] || POMO_PHASE_ICONS.focus;
  // Boyutu override et
  return svg.replace(/width="\d+"/, `width="${s}"`).replace(/height="\d+"/, `height="${s}"`);
}

/* ── Toplam saniye ── */
function pomoTotalSecs() {
  const s = pomoSettings();
  if (pomoState.phase === 'focus')       return s.focusMins * 60;
  if (pomoState.phase === 'short-break') return s.shortBreakMins * 60;
  return s.longBreakMins * 60;
}

/* ── Zaman formatla ── */
function formatPomoTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ── Alarm sesleri ── */
function playPomoAlarm(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const vol = pomoSettings().alarmVolume ?? 0.6;
    const t   = type || pomoSettings().alarmSound;

    const sounds = {
      bell: () => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0);
        g.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
        o.start(); o.stop(ctx.currentTime + 1.4);
      },
      chime: () => {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine'; o.frequency.value = freq;
          const st = ctx.currentTime + i * 0.22;
          g.gain.setValueAtTime(vol * 0.4, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.8);
          o.start(st); o.stop(st + 0.85);
        });
      },
      digital: () => {
        [0, 0.18, 0.36, 0.9, 1.08].forEach(offset => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'square'; o.frequency.value = 1200;
          const st = ctx.currentTime + offset;
          g.gain.setValueAtTime(vol * 0.15, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
          o.start(st); o.stop(st + 0.14);
        });
      },
      soft: () => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = 432;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(vol * 0.35, ctx.currentTime + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        o.start(); o.stop(ctx.currentTime + 2.5);
      },
      bowl: () => {
        [196, 196.5].forEach((freq, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine'; o.frequency.value = freq;
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(vol * 0.3, ctx.currentTime + 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
          o.start(ctx.currentTime + i * 0.01);
          o.stop(ctx.currentTime + 3.6);
        });
      },
      none: () => {},
    };
    (sounds[t] || sounds.bell)();
  } catch (e) { console.warn('Ses çalınamadı:', e); }
}

/* ── Emoji yağmuru ── */
const BREAK_EMOJIS = ['☕', '🍵', '🧃', '🌿', '🎵', '💤', '🌸', '✨', '🍪', '🛋️'];
const FOCUS_EMOJIS = ['🧠', '📝', '✏️', '📖', '💡', '🎯', '⚡', '🔥', '💎', '🌟'];

function launchEmojiRain(finishedPhase) {
  if (pomoSettings().emojiRain === false) return;
  const emojis = finishedPhase === 'focus' ? BREAK_EMOJIS : FOCUS_EMOJIS;
  const wrap   = document.createElement('div');
  wrap.className = 'emoji-rain-container';
  document.body.appendChild(wrap);
  for (let i = 0; i < 28; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className   = 'emoji-particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left  = Math.random() * 100 + 'vw';
      el.style.fontSize = (18 + Math.random() * 18) + 'px';
      const dur = 2.5 + Math.random() * 2;
      el.style.animationDuration = dur + 's';
      el.style.animationDelay   = (Math.random() * 0.6) + 's';
      wrap.appendChild(el);
      setTimeout(() => el.remove(), (dur + 1.2) * 1000);
    }, i * 55);
  }
  setTimeout(() => wrap.remove(), 6000);
}

/* ── Timer ── */
function startPomo() {
  if (pomoState.running) return;
  pomoState.running = true;
  pomoState.intervalId = setInterval(() => {
    pomoState.secondsLeft--;
    updatePomoDisplay();
    syncPomoWidget();
    if (pomoState.secondsLeft <= 0) {
      clearInterval(pomoState.intervalId);
      pomoState.running = false;
      onPomoPhaseEnd();
    }
  }, 1000);
  updatePomoDisplay();
  syncPomoWidget();
}

function pausePomo() {
  if (!pomoState.running) return;
  pomoState.running = false;
  clearInterval(pomoState.intervalId);
  updatePomoDisplay();
  syncPomoWidget();
}

function resetPomo() {
  pausePomo();
  pomoState.phase            = 'focus';
  pomoState.completedInRound = 0;
  pomoState.secondsLeft      = pomoTotalSecs();
  updatePomoDisplay();
  syncPomoWidget();
}

function skipPomo() {
  pausePomo();
  if (pomoState.phase === 'focus') {
    const s = pomoSettings();
    if (pomoState.completedInRound >= s.sessionsUntilLong - 1) {
      advancePhase('long-break');
    } else {
      advancePhase('short-break');
    }
  } else {
    advancePhase('focus');
  }
}

function onPomoPhaseEnd() {
  const finished = pomoState.phase;
  playPomoAlarm();
  launchEmojiRain(finished);

  if (finished === 'focus') {
    savePomoDayStats();
    pomoState.completedInRound++;
    if (pomoState.completedInRound >= pomoSettings().sessionsUntilLong) {
      // Tur tamamlandı — uzun mola ver, sonra sıfırla
      pomoState.completedInRound = 0;
      advancePhase('long-break');
    } else {
      advancePhase('short-break');
    }
  } else {
    advancePhase('focus');
  }
}

function advancePhase(nextPhase) {
  // nextPhase dışarıdan belirtilmezse odak -> kısa mola, mola -> odak
  if (nextPhase) {
    pomoState.phase = nextPhase;
  } else if (pomoState.phase !== 'focus') {
    pomoState.phase = 'focus';
  } else {
    pomoState.phase = 'short-break';
  }

  pomoState.secondsLeft = pomoTotalSecs();
  updatePomoDisplay();
  syncPomoWidget();

  if (pomoSettings().autoStart) {
    setTimeout(() => startPomo(), 1200);
  }
}

/* ── Ekran güncelle ── */
function updatePomoDisplay() {
  const timeEl  = document.getElementById('pomo-time');
  const phaseEl = document.getElementById('pomo-phase-lbl');
  const ringEl  = document.getElementById('pomo-ring-fill');
  const sessEl  = document.getElementById('pomo-session-lbl');
  const startEl = document.getElementById('pomo-start-btn');
  const summEl  = document.getElementById('pomo-summary');
  const s       = pomoSettings();

  // Zaman
  if (timeEl) {
    timeEl.textContent = formatPomoTime(pomoState.secondsLeft);
    timeEl.style.color = phaseColor();
  }

  // Faz etiketi
  if (phaseEl) {
    phaseEl.innerHTML   = phaseIconHTML(15) + ' ' + phaseLabel();
    phaseEl.style.color = phaseColor();
  }

  // Ring rengi ve doluluğu
  if (ringEl) {
    const total = pomoTotalSecs();
    const ratio = total > 0 ? pomoState.secondsLeft / total : 1;
    const circ  = 2 * Math.PI * 96;
    ringEl.style.stroke           = phaseColor();
    ringEl.style.strokeDasharray  = circ;
    ringEl.style.strokeDashoffset = circ * (1 - ratio);
  }

  // Seans etiketi: "Seans X / Y" — X = aktif seans numarası (1..sessionsUntilLong)
  if (sessEl) {
    const current = (pomoState.completedInRound % s.sessionsUntilLong) + 1;
    sessEl.textContent = `Seans ${current} / ${s.sessionsUntilLong}`;
  }

  // Başlat/Durdur butonu
  if (startEl) {
    startEl.innerHTML = pomoState.running
      ? getIcon('pause', 18) + ' Durdur'
      : getIcon('play',  18) + ' Başlat';
  }

  // Seans noktaları — sayı değişmiş olabilir, container'ı yeniden render et
  const dotsContainer = document.getElementById('pomo-dots');
  if (dotsContainer) {
    const s        = pomoSettings();
    const count    = s.sessionsUntilLong;
    const existing = dotsContainer.querySelectorAll('.pomo-dot');

    // Nokta sayısı değiştiyse yeniden oluştur
    if (existing.length !== count) {
      dotsContainer.innerHTML = Array.from({ length: count }, (_, i) =>
        `<div class="pomo-dot" data-idx="${i}"></div>`
      ).join('');
    }

    dotsContainer.querySelectorAll('.pomo-dot').forEach((dot, i) => {
      dot.classList.remove('done', 'current');
      if (i < pomoState.completedInRound) {
        dot.classList.add('done');
      } else if (i === pomoState.completedInRound && pomoState.phase === 'focus') {
        dot.classList.add('current');
      }
    });
  }

  // Günlük özet
  if (summEl) {
    summEl.textContent = `Bugün: ${getPomoDayStats()} seans tamamlandı`;
  }

  // Pencere başlığı
  document.title = pomoState.running
    ? `${formatPomoTime(pomoState.secondsLeft)} — Defter`
    : 'Defter';
}

/* ── Widget güncelle ── */
function syncPomoWidget() {
  const timerEl = document.getElementById('pomo-widget-timer');
  const phaseEl = document.getElementById('pomo-widget-phase');
  const btnEl   = document.getElementById('pomo-widget-btn');

  if (timerEl) {
    timerEl.textContent = formatPomoTime(pomoState.secondsLeft);
    timerEl.style.color = phaseColor();
  }
  if (phaseEl) phaseEl.innerHTML = phaseIconHTML(13) + ' ' + phaseLabel();
  if (btnEl) {
    btnEl.innerHTML = pomoState.running
      ? getIcon('pause', 14) + ' Durdur'
      : getIcon('play',  14) + ' Başlat';
  }
}

/* ── Widget render ── */
function renderPomoWidget() {
  const body = document.getElementById('pomo-widget-body');
  if (!body) return;
  if (pomoState.secondsLeft === 0) {
    pomoState.phase       = 'focus';
    pomoState.secondsLeft = pomoTotalSecs();
  }
  body.innerHTML = `
    <div class="pomo-widget-timer" id="pomo-widget-timer"></div>
    <div class="pomo-widget-phase" id="pomo-widget-phase"></div>
    <button class="pomo-widget-btn" id="pomo-widget-btn"></button>
  `;
  syncPomoWidget();
  document.getElementById('pomo-widget-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (pomoState.running) pausePomo(); else startPomo();
  });
}

/* ── Modül açma ── */
let pomoResizeObs = null;

function openPomoModule() {
  const center = document.getElementById('col-center');
  if (!center) return;
  if (pomoResizeObs) { pomoResizeObs.disconnect(); pomoResizeObs = null; }

  const s = pomoSettings();
  center.innerHTML = `
    <div id="module-pomodoro">

      <div class="pomo-ring-wrap" id="pomo-ring-wrap">
        <svg id="pomo-svg" viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet"
             style="width:100%;height:100%;transform:rotate(-90deg);display:block">
          <circle class="pomo-ring-bg"   cx="110" cy="110" r="96"/>
          <circle class="pomo-ring-fill" cx="110" cy="110" r="96"
            id="pomo-ring-fill"
            stroke-dasharray="${2 * Math.PI * 96}"
            stroke-dashoffset="0"/>
        </svg>
        <div class="pomo-ring-inner">
          <div class="pomo-phase-label" id="pomo-phase-lbl"></div>
          <div class="pomo-time-display" id="pomo-time"></div>
          <div class="pomo-session-label" id="pomo-session-lbl"></div>
        </div>
      </div>

      <div class="pomo-dots" id="pomo-dots">
        ${Array.from({ length: s.sessionsUntilLong }, (_, i) =>
          `<div class="pomo-dot" data-idx="${i}"></div>`
        ).join('')}
      </div>

      <div class="pomo-controls">
        <button class="pomo-btn" id="pomo-reset-btn">${getIcon('history', 15)} Sıfırla</button>
        <button class="pomo-btn primary" id="pomo-start-btn"></button>
        <button class="pomo-btn" id="pomo-skip-btn">${getIcon('expand', 15)} Atla</button>
      </div>

      <div class="pomo-summary" id="pomo-summary"></div>

      <div class="pomo-settings-panel">
        <div class="pomo-settings-title">${getIcon('settings', 14)} Süre & Ayarlar</div>
        <div class="pomo-settings-grid">

          <div class="pomo-setting-card">
            <div class="pomo-setting-label">${POMO_PHASE_ICONS.focus.replace(/width="\d+"/, 'width="13"').replace(/height="\d+"/, 'height="13"')} Odak</div>
            <div class="pomo-spin">
              <button class="pomo-spin-btn" data-key="focusMins" data-dir="-1">−</button>
              <span id="sv-focusMins">${s.focusMins}</span><span class="pomo-spin-unit">dk</span>
              <button class="pomo-spin-btn" data-key="focusMins" data-dir="1">+</button>
            </div>
          </div>

          <div class="pomo-setting-card">
            <div class="pomo-setting-label">${POMO_PHASE_ICONS['short-break'].replace(/width="\d+"/, 'width="13"').replace(/height="\d+"/, 'height="13"')} Kısa Mola</div>
            <div class="pomo-spin">
              <button class="pomo-spin-btn" data-key="shortBreakMins" data-dir="-1">−</button>
              <span id="sv-shortBreakMins">${s.shortBreakMins}</span><span class="pomo-spin-unit">dk</span>
              <button class="pomo-spin-btn" data-key="shortBreakMins" data-dir="1">+</button>
            </div>
          </div>

          <div class="pomo-setting-card">
            <div class="pomo-setting-label">${POMO_PHASE_ICONS['long-break'].replace(/width="\d+"/, 'width="13"').replace(/height="\d+"/, 'height="13"')} Uzun Mola</div>
            <div class="pomo-spin">
              <button class="pomo-spin-btn" data-key="longBreakMins" data-dir="-1">−</button>
              <span id="sv-longBreakMins">${s.longBreakMins}</span><span class="pomo-spin-unit">dk</span>
              <button class="pomo-spin-btn" data-key="longBreakMins" data-dir="1">+</button>
            </div>
          </div>

          <div class="pomo-setting-card">
            <div class="pomo-setting-label">${getIcon('check', 13)} Seans Sayısı</div>
            <div class="pomo-spin">
              <button class="pomo-spin-btn" data-key="sessionsUntilLong" data-dir="-1">−</button>
              <span id="sv-sessionsUntilLong">${s.sessionsUntilLong}</span><span class="pomo-spin-unit">seans</span>
              <button class="pomo-spin-btn" data-key="sessionsUntilLong" data-dir="1">+</button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  updatePomoDisplay();
  bindPomoModuleEvents();

  pomoResizeObs = new ResizeObserver(() => updatePomoDisplay());
  pomoResizeObs.observe(center);
}

function bindPomoModuleEvents() {
  document.getElementById('pomo-start-btn')?.addEventListener('click', () => {
    if (pomoState.running) pausePomo(); else startPomo();
  });
  document.getElementById('pomo-reset-btn')?.addEventListener('click', resetPomo);
  document.getElementById('pomo-skip-btn') ?.addEventListener('click', skipPomo);

  const limits = {
    focusMins:[1,99], shortBreakMins:[1,30],
    longBreakMins:[5,60], sessionsUntilLong:[2,8],
  };

  document.querySelectorAll('.pomo-spin-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const dir = parseInt(btn.dataset.dir);
      const s   = pomoSettings();
      const [mn, mx] = limits[key] || [1,99];
      s[key] = Math.max(mn, Math.min(mx, s[key] + dir));
      saveJSON('pomo-settings', s);
      const el = document.getElementById(`sv-${key}`);
      if (el) el.textContent = s[key];
      if (!pomoState.running) {
        pomoState.secondsLeft = pomoTotalSecs();
        updatePomoDisplay(); syncPomoWidget();
      }
    });
  });

}

/* ── Ayarlar paneli için dışa açık fonksiyonlar ── */
function getPomoSettingsHTML() { return ''; } // Ayarlar modülü eklenince doldurulacak
function bindPomoSettingsEvents() {}