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
            <button class="settings-tab ${settingsActiveTab === 'moduller' ? 'active' : ''}" data-tab="moduller">
              <span class="settings-tab-icon">${getIcon('grip', 14)}</span> Modüller
            </button>
            <button class="settings-tab ${settingsActiveTab === 'veri' ? 'active' : ''}" data-tab="veri">
              <span class="settings-tab-icon">${getIcon('folderopen', 14)}</span> Veri
            </button>
            <button class="settings-tab ${settingsActiveTab === 'geribildirim' ? 'active' : ''}" data-tab="geribildirim">
              <span class="settings-tab-icon">${getIcon('bell', 14)}</span> Geri Bildirim
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
  if (tab === 'moduller') renderSettingsModuller(content);
  if (tab === 'veri')     renderSettingsVeri(content);
  if (tab === 'geribildirim') renderSettingsFeedback(content);
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
        Yazı Boyutu
        <span class="settings-label-sub">Arayüz ölçeği</span>
      </label>
      <div class="settings-fontsize" id="sg-fontsize">
        ${[
          { v: 0.85, l: 'S' },
          { v: 1,    l: 'M' },
          { v: 1.15, l: 'L' },
          { v: 1.3,  l: 'XL' },
        ].map(o => {
          const cur = loadJSON('font-scale', 1);
          return `<button class="settings-fontsize-btn${Math.abs(cur - o.v) < 0.01 ? ' active' : ''}" data-scale="${o.v}">${o.l}</button>`;
        }).join('')}
      </div>
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

    <div class="settings-row">
      <label class="settings-label">
        Özel Renk
        <span class="settings-label-sub">Kendi vurgu rengini seç</span>
      </label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" id="sg-custom-color" value="${getCustomColor()}"
          style="width:34px;height:30px;border:none;border-radius:8px;cursor:pointer;background:none;padding:0"/>
        <button class="settings-btn" id="sg-custom-apply">Uygula</button>
      </div>
    </div>
  `;

  container.querySelector('#sg-theme').addEventListener('change', function() {
    applyTheme(this.value);
  });

  // Yazı boyutu
  container.querySelectorAll('.settings-fontsize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scale = parseFloat(btn.dataset.scale);
      container.querySelectorAll('.settings-fontsize-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveJSON('font-scale', scale);
      applyFontScale(scale);
    });
  });

  // Özel renk
  const customInput = container.querySelector('#sg-custom-color');
  container.querySelector('#sg-custom-apply').addEventListener('click', () => {
    const hex = customInput.value;
    saveJSON('color-custom', hex);
    saveJSON('color', 'custom');
    document.documentElement.dataset.color = 'custom';
    applyCustomColor(hex);
    // Titlebar custom noktasını güncelle + aktif yap
    const cdot = document.getElementById('color-dot-custom');
    if (cdot) cdot.style.background = hex;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    cdot?.classList.add('active');
    // Ayarlardaki preset noktalarının aktifliğini kaldır
    container.querySelectorAll('.color-dot-settings').forEach(b => {
      b.style.borderColor = 'transparent'; b.style.transform = '';
    });
    showToast('Özel renk uygulandı.', 'success');
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
      clearCustomColor();
    });
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
        Emoji Yağmuru
        <span class="settings-label-sub">Seans bitince kutlama animasyonu</span>
      </label>
      <label class="settings-toggle">
        <input type="checkbox" id="ss-emojiRain" ${s.emojiRain !== false ? 'checked' : ''}/>
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

  const emojiCheck = container.querySelector('#ss-emojiRain');
  emojiCheck?.addEventListener('change', () => {
    const sv = pomoSettings(); sv.emojiRain = emojiCheck.checked;
    saveJSON('pomo-settings', sv);
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

/* ════════════════════════════════
   VERİ — Dışa / İçe Aktarma
   ════════════════════════════════ */
// Uygulamanın tüm localStorage anahtarları
const DEFTER_DATA_KEYS = [
  'theme', 'color', 'color-custom', 'font-scale', 'layout-locked', 'widget-layout', 'hidden-widgets', 'dev-mode',
  'todos-v3', 'todo-settings', 'todo-reset-day', 'todo-reset-week', 'todo-reset-month',
  'projects-v3',
  'notes-v3',
  'habits-v3',
  'pomo-settings', 'pomo-day-stats',
  'focus-custom', 'focus-pinned',
  'notif-logs',
];

function exportDefterData() {
  const data = {};
  DEFTER_DATA_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  });
  return {
    app: 'Defter v3',
    version: 3,
    exportedAt: new Date().toISOString(),
    data,
  };
}

function renderSettingsVeri(container) {
  // Veri özeti
  let totalKeys = 0, totalSize = 0;
  DEFTER_DATA_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) { totalKeys++; totalSize += v.length; }
  });
  const sizeKB = (totalSize / 1024).toFixed(1);

  const counts = {
    todos: safeCount('todos-v3'),
    projects: safeCount('projects-v3'),
    notes: (() => { try { return (JSON.parse(localStorage.getItem('notes-v3')||'{}').notes||[]).length; } catch { return 0; } })(),
    habits: safeCount('habits-v3'),
  };

  container.innerHTML = `
    <div class="settings-section-title">${getIcon('folderopen', 15)} Yedekleme</div>

    <div class="settings-data-summary">
      <div class="settings-data-stat"><span>${counts.todos}</span> görev</div>
      <div class="settings-data-stat"><span>${counts.projects}</span> proje</div>
      <div class="settings-data-stat"><span>${counts.notes}</span> not</div>
      <div class="settings-data-stat"><span>${counts.habits}</span> alışkanlık</div>
    </div>
    <div class="settings-data-size">Toplam ${totalKeys} kayıt · ${sizeKB} KB</div>

    <div class="settings-row">
      <label class="settings-label">
        Dışa Aktar
        <span class="settings-label-sub">Tüm verilerini .json dosyası olarak indir</span>
      </label>
      <button class="settings-btn" id="sv-export">${getIcon('folderopen', 13)} Dışa Aktar</button>
    </div>

    <div class="settings-row">
      <label class="settings-label">
        İçe Aktar
        <span class="settings-label-sub">Önceki bir yedeği geri yükle (mevcut veriler değişir)</span>
      </label>
      <button class="settings-btn" id="sv-import">${getIcon('plus', 13)} Dosya Seç</button>
      <input type="file" id="sv-import-file" accept="application/json,.json" style="display:none"/>
    </div>

    <div class="settings-section-title" style="margin-top:18px">${getIcon('trash', 15)} Tehlikeli Bölge</div>
    <div class="settings-row">
      <label class="settings-label">
        Tüm Verileri Sil
        <span class="settings-label-sub">Her şey kalıcı olarak silinir, geri alınamaz</span>
      </label>
      <button class="settings-btn danger" id="sv-wipe">${getIcon('trash', 13)} Sıfırla</button>
    </div>
  `;

  // Dışa aktar
  container.querySelector('#sv-export').addEventListener('click', () => {
    const payload = exportDefterData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `defter-yedek-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Veriler dışa aktarıldı.', 'success');
  });

  // İçe aktar
  const fileInput = container.querySelector('#sv-import-file');
  container.querySelector('#sv-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      let parsed;
      try { parsed = JSON.parse(reader.result); }
      catch { showToast('Geçersiz dosya.', 'error'); return; }

      if (!parsed || !parsed.data || parsed.app !== 'Defter v3') {
        showToast('Bu bir Defter yedek dosyası değil.', 'error');
        return;
      }

      const ok = await showDialog({
        icon: getIcon('folderopen', 28),
        title: 'Veriyi İçe Aktar',
        message: `${parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString('tr-TR') + ' tarihli yedek. ' : ''}Mevcut tüm veriler bu yedekle değiştirilecek. Devam edilsin mi?`,
        confirmText: 'İçe Aktar', cancelText: 'Vazgeç',
      });
      if (!ok) return;

      // Mevcut defter anahtarlarını temizle, yedektekileri yükle
      DEFTER_DATA_KEYS.forEach(k => localStorage.removeItem(k));
      Object.entries(parsed.data).forEach(([k, v]) => {
        if (DEFTER_DATA_KEYS.includes(k)) localStorage.setItem(k, v);
      });

      showToast('Veriler yüklendi. Uygulama yenileniyor…', 'success');
      setTimeout(() => location.reload(), 1200);
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  // Tümünü sil
  container.querySelector('#sv-wipe').addEventListener('click', async () => {
    const ok = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Tüm Verileri Sil',
      message: 'Görevler, projeler, notlar, ayarlar — her şey kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      confirmText: 'Hepsini Sil', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    DEFTER_DATA_KEYS.forEach(k => localStorage.removeItem(k));
    showToast('Tüm veriler silindi. Yenileniyor…', 'success');
    setTimeout(() => location.reload(), 1000);
  });
}

function safeCount(key) {
  try { const a = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(a) ? a.length : 0; }
  catch { return 0; }
}

/* ════════════════════════════════
   MODÜLLER — Görünürlük + Developer
   ════════════════════════════════ */
// Widget id → görünen ad
const WIDGET_LABELS = {
  'widget-today':    'Bugün',
  'widget-todo':     'Yapılacaklar',
  'widget-notes':    'Notlar',
  'widget-habits':   'Alışkanlıklar',
  'widget-pomodoro': 'Pomodoro',
  'widget-calendar': 'Takvim',
  'widget-projects': 'Projeler',
  'widget-focus':    'Odak Sesi',
  'widget-test':     'Test (geliştirici)',
};

function renderSettingsModuller(container) {
  const hidden = loadHiddenWidgets();
  const dev = isDevMode();

  // Sayfadaki gerçek widget'ları topla
  const widgets = [...document.querySelectorAll('.widget')]
    .filter(w => w.dataset.dev !== 'true' || dev)
    .map(w => ({
      id: w.id,
      isDev: w.dataset.dev === 'true',
    }));

  const widgetRow = w => `
    <div class="settings-row">
      <label class="settings-label">
        ${WIDGET_LABELS[w.id] || w.id}
        ${w.isDev ? '<span class="settings-label-sub">Geliştirici modülü</span>' : ''}
      </label>
      <label class="settings-toggle">
        <input type="checkbox" data-widget="${w.id}" ${hidden.includes(w.id) ? '' : 'checked'}/>
        <span class="settings-toggle-slider"></span>
      </label>
    </div>
  `;

  container.innerHTML = `
    <div class="settings-section-title">${getIcon('grip', 15)} Modüller</div>
    ${widgets.map(widgetRow).join('')}

    <div class="settings-section-title" style="margin-top:18px">${getIcon('settings', 15)} Geliştirici</div>
    <div id="sm-dev-area">
      ${dev ? `
        <div class="settings-row">
          <label class="settings-label">
            Geliştirici Modu
            <span class="settings-label-sub">Aktif — test modülü görünür</span>
          </label>
          <button class="settings-btn danger" id="sm-dev-off">Kapat</button>
        </div>
      ` : `
        <div class="settings-row">
          <label class="settings-label">
            Geliştirici Şifresi
            <span class="settings-label-sub">Doğru şifre geliştirici modunu açar</span>
          </label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="password" class="settings-input" id="sm-dev-pw" placeholder="Şifre…" style="width:120px"/>
            <button class="settings-btn" id="sm-dev-on">Aç</button>
          </div>
        </div>
      `}
    </div>
  `;

  // Widget görünürlük toggle'ları
  container.querySelectorAll('input[data-widget]').forEach(cb => {
    cb.addEventListener('change', () => {
      let h = loadHiddenWidgets();
      const id = cb.dataset.widget;
      if (cb.checked) h = h.filter(x => x !== id);   // göster
      else if (!h.includes(id)) h.push(id);          // gizle
      saveHiddenWidgets(h);
      applyWidgetVisibility();
    });
  });

  // Developer modu aç
  container.querySelector('#sm-dev-on')?.addEventListener('click', () => {
    const pw = container.querySelector('#sm-dev-pw').value;
    if (pw === DEV_PASSWORD) {
      saveJSON('dev-mode', true);
      applyWidgetVisibility();
      renderSettingsTab('moduller');
      showToast('Geliştirici modu açıldı.', 'success');
    } else {
      showToast('Yanlış şifre.', 'error');
    }
  });

  // Developer modu kapat
  container.querySelector('#sm-dev-off')?.addEventListener('click', () => {
    saveJSON('dev-mode', false);
    applyWidgetVisibility();
    renderSettingsTab('moduller');
    showToast('Geliştirici modu kapatıldı.', 'default');
  });
}

/* ════════════════════════════════
   GERİ BİLDİRİM
   ════════════════════════════════ */
// Marka için ileride değiştirilebilir
const FEEDBACK_EMAIL = 'altaypala@gmail.com';

function renderSettingsFeedback(container) {
  container.innerHTML = `
    <div class="settings-section-title">${getIcon('bell', 15)} Geri Bildirim</div>
    <p class="settings-feedback-intro">
      Bir hata fark ettiysen, bir isteğin, dileğin ya da şikâyetin varsa
      buradan iletebilirsin. Mesajın varsayılan e-posta uygulamanda açılır.
    </p>

    <div class="settings-row">
      <label class="settings-label">Konu Türü</label>
      <select class="settings-select" id="fb-type">
        <option value="Hata Bildirimi">Hata Bildirimi</option>
        <option value="İstek / Öneri">İstek / Öneri</option>
        <option value="Şikâyet">Şikâyet</option>
        <option value="Diğer">Diğer</option>
      </select>
    </div>

    <div class="settings-feedback-field">
      <label class="settings-form-label">Başlık</label>
      <input class="settings-input" id="fb-subject" placeholder="Kısa bir başlık…" style="width:100%" maxlength="80"/>
    </div>

    <div class="settings-feedback-field">
      <label class="settings-form-label">Mesaj</label>
      <textarea class="settings-input" id="fb-body" rows="6" placeholder="Detayları buraya yazabilirsin…" style="width:100%;resize:vertical"></textarea>
    </div>

    <button class="settings-btn settings-feedback-send" id="fb-send">
      ${getIcon('bell', 14)} E-posta ile Gönder
    </button>

    <p class="settings-feedback-note">
      Gönder'e bastığında ${FEEDBACK_EMAIL} adresine giden bir taslak e-posta açılır.
    </p>
  `;

  container.querySelector('#fb-send').addEventListener('click', () => {
    const type = container.querySelector('#fb-type').value;
    const subjectInput = container.querySelector('#fb-subject').value.trim();
    const body = container.querySelector('#fb-body').value.trim();

    if (!body) {
      showToast('Lütfen bir mesaj yaz.', 'error');
      container.querySelector('#fb-body').focus();
      return;
    }

    const subject = `[Defter · ${type}]${subjectInput ? ' ' + subjectInput : ''}`;
    const mailBody =
      `Tür: ${type}\n` +
      `\n${body}\n`;

    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;

    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.location.href = url;
    }
    showToast('E-posta uygulaman açılıyor…', 'success');
  });
}