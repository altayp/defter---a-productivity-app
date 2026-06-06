/* ═══════════════════════════════════════
   settings.js — Ayarlar Paneli
   ═══════════════════════════════════════ */

let settingsActiveTab = 'genel';

function openSettings() {
  if (document.getElementById('settings-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.id = 'settings-overlay';

  overlay.innerHTML = `
    <div class="settings-panel" id="settings-panel">

      <div class="settings-header">
        <span class="settings-header-icon">${getIcon('settings', 20)}</span>
        <span class="settings-header-title">Ayarlar</span>
        <button class="settings-close" id="settings-close-btn">✕</button>
      </div>

      <div class="settings-body">
        <div class="settings-layout">

          <div class="settings-tabs" id="settings-tabs">
            <button class="settings-tab ${settingsActiveTab === 'genel' ? 'active' : ''}" data-tab="genel">
              <span class="settings-tab-icon">${getIcon('sun', 14)}</span> Genel
            </button>
            <button class="settings-tab ${settingsActiveTab === 'pomodoro' ? 'active' : ''}" data-tab="pomodoro">
              <span class="settings-tab-icon">${getIcon('clock', 14)}</span> Pomodoro
            </button>
            <button class="settings-tab ${settingsActiveTab === 'todo' ? 'active' : ''}" data-tab="todo">
              <span class="settings-tab-icon">${getIcon('check', 14)}</span> Yapılacaklar
            </button>
          </div>

          <div class="settings-content" id="settings-content"></div>

        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  renderSettingsTab(settingsActiveTab);

  overlay.querySelector('#settings-close-btn').addEventListener('click', closeSettings);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSettings(); });

  overlay.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      settingsActiveTab = tab.dataset.tab;
      overlay.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSettingsTab(settingsActiveTab);
    });
  });
}

function closeSettings() {
  const overlay = document.getElementById('settings-overlay');
  if (!overlay) return;
  overlay.classList.add('closing');
  setTimeout(() => overlay.remove(), 150);
}

function renderSettingsTab(tab) {
  const content = document.getElementById('settings-content');
  if (!content) return;

  if (tab === 'genel')    renderSettingsGenel(content);
  if (tab === 'pomodoro') renderSettingsPomodoro(content);
  if (tab === 'todo')     renderSettingsTodo(content);
}

/* ════════════════════════════════
   GENEL AYARLAR
   ════════════════════════════════ */
function renderSettingsGenel(container) {
  container.innerHTML = `
    <div class="settings-section-title">
      ${getIcon('sun', 15)} Görünüm
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Tema
        <span class="settings-label-sub">Koyu veya açık arka plan</span>
      </label>
      <select class="settings-select" id="sg-theme">
        <option value="dark"  ${document.documentElement.dataset.theme === 'dark'  ? 'selected' : ''}>Koyu</option>
        <option value="light" ${document.documentElement.dataset.theme === 'light' ? 'selected' : ''}>Açık</option>
      </select>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Vurgu Rengi
        <span class="settings-label-sub">Aktif renk seçimi</span>
      </label>
      <div style="display:flex;gap:7px;align-items:center">
        ${['green','blue','red','purple','gold'].map(c => `
          <button class="color-dot-settings ${document.documentElement.dataset.color === c ? 'active' : ''}"
            data-color="${c}" style="
              width:18px;height:18px;border-radius:50%;cursor:pointer;border:2px solid transparent;
              background:${{ green:'#5a9e6f', blue:'#4a90c4', red:'#c45a5a', purple:'#9a70c4', gold:'#c8902a' }[c]};
              transition:transform .15s,border-color .15s;
              ${document.documentElement.dataset.color === c ? 'border-color:var(--ink);transform:scale(1.2)' : ''}
            "></button>
        `).join('')}
      </div>
    </div>

    <div class="settings-section-title" style="margin-top:16px">
      ${getIcon('note', 15)} Veri
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Tüm verileri sıfırla
        <span class="settings-label-sub">Geri alınamaz</span>
      </label>
      <button class="settings-btn danger" id="sg-reset-all">
        ${getIcon('trash', 14)} Sıfırla
      </button>
    </div>
  `;

  container.querySelector('#sg-theme').addEventListener('change', function() {
    applyTheme(this.value);
  });

  container.querySelectorAll('.color-dot-settings').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.color-dot-settings').forEach(b => {
        b.style.borderColor = 'transparent';
        b.style.transform   = '';
      });
      btn.style.borderColor = 'var(--ink)';
      btn.style.transform   = 'scale(1.2)';
      // Titlebar'daki renk noktalarını da güncelle
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      document.querySelector(`.color-dot[data-color="${btn.dataset.color}"]`)?.classList.add('active');
      document.documentElement.dataset.color = btn.dataset.color;
      saveJSON('color', btn.dataset.color);
    });
  });

  container.querySelector('#sg-reset-all').addEventListener('click', async () => {
    const ok = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Tüm Verileri Sıfırla',
      message: 'Tüm notlar, görevler, pomodoro geçmişi ve ayarlar silinecek. Bu işlem geri alınamaz.',
      confirmText: 'Evet, Sıfırla',
      cancelText: 'Vazgeç',
      danger: true,
    });
    if (!ok) return;
    localStorage.clear();
    location.reload();
  });
}

/* ════════════════════════════════
   POMODORO AYARLARI
   ════════════════════════════════ */
function renderSettingsPomodoro(container) {
  const s = pomoSettings();
  const sounds = ['bell','chime','digital','soft','bowl','none'];
  const soundLabels = { bell:'Zil', chime:'Çan', digital:'Dijital', soft:'Yumuşak', bowl:'Tibet Kasesi', none:'Sessiz' };

  container.innerHTML = `
    <div class="settings-section-title">
      ${getIcon('clock', 15)} Süreler
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Odak Süresi
        <span class="settings-label-sub">Her odak seansının uzunluğu</span>
      </label>
      <div class="settings-spin">
        <button class="settings-spin-btn" data-key="focusMins" data-dir="-1">−</button>
        <span id="ss-focusMins">${s.focusMins}</span>
        <span class="settings-spin-unit">dk</span>
        <button class="settings-spin-btn" data-key="focusMins" data-dir="1">+</button>
      </div>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Kısa Mola
        <span class="settings-label-sub">Odak seansları arası mola</span>
      </label>
      <div class="settings-spin">
        <button class="settings-spin-btn" data-key="shortBreakMins" data-dir="-1">−</button>
        <span id="ss-shortBreakMins">${s.shortBreakMins}</span>
        <span class="settings-spin-unit">dk</span>
        <button class="settings-spin-btn" data-key="shortBreakMins" data-dir="1">+</button>
      </div>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Uzun Mola
        <span class="settings-label-sub">Tur sonunda verilen uzun mola</span>
      </label>
      <div class="settings-spin">
        <button class="settings-spin-btn" data-key="longBreakMins" data-dir="-1">−</button>
        <span id="ss-longBreakMins">${s.longBreakMins}</span>
        <span class="settings-spin-unit">dk</span>
        <button class="settings-spin-btn" data-key="longBreakMins" data-dir="1">+</button>
      </div>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Seans Sayısı
        <span class="settings-label-sub">Uzun moladan önceki odak seansı sayısı</span>
      </label>
      <div class="settings-spin">
        <button class="settings-spin-btn" data-key="sessionsUntilLong" data-dir="-1">−</button>
        <span id="ss-sessionsUntilLong">${s.sessionsUntilLong}</span>
        <span class="settings-spin-unit">seans</span>
        <button class="settings-spin-btn" data-key="sessionsUntilLong" data-dir="1">+</button>
      </div>
    </div>

    <div class="settings-section-title" style="margin-top:16px">
      ${getIcon('music', 15)} Alarm
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Alarm Sesi
        <span class="settings-label-sub">Seans bitişinde çalar</span>
      </label>
      <div class="settings-btn-row">
        <select class="settings-select" id="ss-alarmSound">
          ${sounds.map(v => `<option value="${v}"${v === s.alarmSound ? ' selected' : ''}>${soundLabels[v]}</option>`).join('')}
        </select>
        <button class="settings-btn" id="ss-alarm-test">${getIcon('play', 13)} Test</button>
      </div>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Ses Seviyesi
      </label>
      <input type="range" class="settings-range" id="ss-alarmVolume"
        min="0" max="1" step="0.1" value="${s.alarmVolume}"/>
    </div>

    <div class="settings-section-title" style="margin-top:16px">
      ${getIcon('expand', 15)} Davranış
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Otomatik Başlat
        <span class="settings-label-sub">Seans bitince bir sonraki otomatik başlar</span>
      </label>
      <label class="settings-toggle">
        <input type="checkbox" id="ss-autoStart" ${s.autoStart ? 'checked' : ''}/>
        <span class="settings-toggle-slider"></span>
      </label>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Pomodoro Geçmişini Sıfırla
        <span class="settings-label-sub">Bugünkü seans sayacını sıfırlar</span>
      </label>
      <button class="settings-btn danger" id="ss-reset-stats">
        ${getIcon('trash', 13)} Sıfırla
      </button>
    </div>
  `;

  const limits = {
    focusMins:[1,99], shortBreakMins:[1,30],
    longBreakMins:[5,60], sessionsUntilLong:[2,8],
  };

  container.querySelectorAll('.settings-spin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const dir = parseInt(btn.dataset.dir);
      const sv  = pomoSettings();
      const [mn, mx] = limits[key] || [1, 99];
      sv[key] = Math.max(mn, Math.min(mx, sv[key] + dir));
      saveJSON('pomo-settings', sv);
      const el = container.querySelector(`#ss-${key}`);
      if (el) el.textContent = sv[key];
      // Modül açıksa oradaki değerleri de güncelle
      const modEl = document.getElementById(`sv-${key}`);
      if (modEl) modEl.textContent = sv[key];
      if (!pomoState.running) {
        pomoState.secondsLeft = pomoTotalSecs();
        updatePomoDisplay(); syncPomoWidget();
      }
    });
  });

  const alarmSel = container.querySelector('#ss-alarmSound');
  alarmSel?.addEventListener('change', () => {
    const sv = pomoSettings(); sv.alarmSound = alarmSel.value;
    saveJSON('pomo-settings', sv);
  });

  container.querySelector('#ss-alarm-test')?.addEventListener('click', () => {
    playPomoAlarm(alarmSel?.value);
  });

  const volRange = container.querySelector('#ss-alarmVolume');
  volRange?.addEventListener('input', () => {
    const sv = pomoSettings(); sv.alarmVolume = parseFloat(volRange.value);
    saveJSON('pomo-settings', sv);
  });

  const autoCheck = container.querySelector('#ss-autoStart');
  autoCheck?.addEventListener('change', () => {
    const sv = pomoSettings(); sv.autoStart = autoCheck.checked;
    saveJSON('pomo-settings', sv);
    // Modüldeki toggle da güncelle
    const modToggle = document.getElementById('sv-autoStart');
    if (modToggle) modToggle.checked = autoCheck.checked;
  });

  container.querySelector('#ss-reset-stats')?.addEventListener('click', async () => {
    const ok = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Pomodoro Geçmişini Sıfırla',
      message: 'Bugünkü seans sayacı sıfırlanacak.',
      confirmText: 'Sıfırla',
      cancelText: 'Vazgeç',
      danger: true,
    });
    if (!ok) return;
    const today = new Date().toDateString();
    const data  = loadJSON('pomo-day-stats', {});
    data[today] = 0;
    saveJSON('pomo-day-stats', data);
    updatePomoDisplay();
    showToast('Pomodoro geçmişi sıfırlandı.', 'success');
  });
}

/* ════════════════════════════════
   YAPILACAKLAR AYARLARI
   ════════════════════════════════ */
function renderSettingsTodo(container) {
  const s = todoSettings();
  const sounds = ['bell', 'chime', 'soft', 'urgent', 'none'];
  const soundLabels = { bell:'Zil', chime:'Çan', soft:'Yumuşak', urgent:'Acil', none:'Sessiz' };

  container.innerHTML = `
    <div class="settings-section-title">
      ${getIcon('bell', 15)} Hatırlatıcılar
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Bildirim Banner'ı
        <span class="settings-label-sub">Hatırlatıcı zamanı gelince ekranda göster</span>
      </label>
      <label class="settings-toggle">
        <input type="checkbox" id="st-banner" ${s.bannerEnabled !== false ? 'checked' : ''}/>
        <span class="settings-toggle-slider"></span>
      </label>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Bildirim Sesi
        <span class="settings-label-sub">Hatırlatıcı zamanı gelince ses çal</span>
      </label>
      <label class="settings-toggle">
        <input type="checkbox" id="st-sound" ${s.soundEnabled !== false ? 'checked' : ''}/>
        <span class="settings-toggle-slider"></span>
      </label>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Ses Tipi
      </label>
      <div class="settings-btn-row">
        <select class="settings-select" id="st-sound-type">
          ${sounds.map(v => `<option value="${v}"${v === s.soundType ? ' selected' : ''}>${soundLabels[v]}</option>`).join('')}
        </select>
        <button class="settings-btn" id="st-sound-test">${getIcon('play', 13)} Test</button>
      </div>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Bildirim Süresi
        <span class="settings-label-sub">Banner ekranda kaç saniye kalsın</span>
      </label>
      <div class="settings-spin">
        <button class="settings-spin-btn" id="st-dur-minus">−</button>
        <span id="st-dur-val">${s.duration || 8}</span>
        <span class="settings-spin-unit">sn</span>
        <button class="settings-spin-btn" id="st-dur-plus">+</button>
      </div>
    </div>

    <div class="settings-section-title" style="margin-top:16px">
      ${getIcon('trash', 15)} Veri
    </div>

    <div class="settings-row">
      <label class="settings-label">
        Tamamlanan Görevleri Temizle
        <span class="settings-label-sub">Tek seferlikler silinir, tekrarlananlar gizlenir</span>
      </label>
      <button class="settings-btn danger" id="st-clear-done">
        ${getIcon('trash', 13)} Temizle
      </button>
    </div>
  `;

  container.querySelector('#st-banner').addEventListener('change', function() {
    const cfg = todoSettings(); cfg.bannerEnabled = this.checked; saveTodoSettings(cfg);
  });

  container.querySelector('#st-sound').addEventListener('change', function() {
    const cfg = todoSettings(); cfg.soundEnabled = this.checked; saveTodoSettings(cfg);
  });

  const soundSel = container.querySelector('#st-sound-type');
  soundSel.addEventListener('change', () => {
    const cfg = todoSettings(); cfg.soundType = soundSel.value; saveTodoSettings(cfg);
  });

  container.querySelector('#st-sound-test').addEventListener('click', () => {
    playTodoSound(soundSel.value);
  });

  container.querySelector('#st-dur-minus').addEventListener('click', () => {
    const cfg = todoSettings();
    cfg.duration = Math.max(3, (cfg.duration || 8) - 1);
    saveTodoSettings(cfg);
    container.querySelector('#st-dur-val').textContent = cfg.duration;
  });
  container.querySelector('#st-dur-plus').addEventListener('click', () => {
    const cfg = todoSettings();
    cfg.duration = Math.min(30, (cfg.duration || 8) + 1);
    saveTodoSettings(cfg);
    container.querySelector('#st-dur-val').textContent = cfg.duration;
  });

  container.querySelector('#st-clear-done').addEventListener('click', async () => {
    const todos = loadTodos();
    if (!todos.some(t => t.done)) { showToast('Tamamlanan görev yok.'); return; }
    const ok = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Tamamlananları Temizle',
      message: 'Tek seferlik görevler silinir, tekrarlanan görevler bir sonraki döneme kadar gizlenir.',
      confirmText: 'Temizle', cancelText: 'Vazgeç',
    });
    if (!ok) return;
    const updated = todos.map(t => {
      if (!t.done) return t;
      if (t.recurrence === 'once') return null;
      return { ...t, hidden: true };
    }).filter(Boolean);
    saveTodos(updated);
    if (typeof renderTodoList === 'function') renderTodoList();
    if (typeof renderTodoWidget === 'function') renderTodoWidget();
    showToast('Temizlendi.', 'success');
  });
}