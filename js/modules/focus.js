/* ═══════════════════════════════════════
   focus.js — Odak Sesi Modülü
   ═══════════════════════════════════════ */

/* Yerleşik ses dosyaları (sounds/ klasöründen) */
const FOCUS_SOUNDS = [
  { id: 'rain',  icon: 'snd_rain',  name: 'Yağmur',         src: 'sounds/rain.mp3' },
  { id: 'wind',  icon: 'snd_wind',  name: 'Rüzgâr',         src: 'sounds/wind.mp3' },
  { id: 'fire',  icon: 'snd_fire',  name: 'Şömine',         src: 'sounds/fire.mp3' },
  { id: 'bird',  icon: 'snd_birds', name: 'Kuşlar',         src: 'sounds/bird.mp3' },
  { id: 'white', icon: 'snd_white', name: 'Beyaz Gürültü',  src: 'sounds/white-noise.mp3' },
  { id: 'waves', icon: 'snd_waves', name: 'Dalgalar',       src: 'sounds/waves.mp3' },
];

let focusCtx     = null;
let focusMaster  = null;
let focusVolume  = 40;
const focusChannels = {}; // id → { gain, nodes[], audioEl? }

/* Özel sesler (localStorage) */
function loadCustomSounds() {
  try { return JSON.parse(localStorage.getItem('focus-custom') || '[]'); }
  catch { return []; }
}
function saveCustomSounds(s) { localStorage.setItem('focus-custom', JSON.stringify(s)); }

/* Pinlenen sesler (en fazla 6) */
function loadPinnedSounds() {
  try { return JSON.parse(localStorage.getItem('focus-pinned') || '[]'); }
  catch { return []; }
}
function savePinnedSounds(p) { localStorage.setItem('focus-pinned', JSON.stringify(p)); }
function isPinned(id) { return loadPinnedSounds().includes(id); }
function togglePin(id) {
  let pinned = loadPinnedSounds().filter((v, i, a) => a.indexOf(v) === i);
  if (pinned.includes(id)) {
    pinned = pinned.filter(x => x !== id);
  } else {
    pinned.push(id);
  }
  savePinnedSounds(pinned);
  return true;
}

/* Bir ses id'sinden ses nesnesini bul */
function findSound(id) {
  return [...FOCUS_SOUNDS, ...loadCustomSounds()].find(s => s.id === id);
}

function getFocusCtx() {
  if (!focusCtx || focusCtx.state === 'closed') {
    focusCtx = new (window.AudioContext || window.webkitAudioContext)();
    focusMaster = focusCtx.createGain();
    focusMaster.gain.value = focusVolume / 100;
    focusMaster.connect(focusCtx.destination);
  }
  return focusCtx;
}

/* ── Ses dosyası kanalı oluştur ── */
function buildAudioChannel(id, src) {
  const ctx = getFocusCtx();
  const audio = new Audio(src);
  audio.loop = true;
  const track = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  gain.gain.value = 0.7;
  track.connect(gain); gain.connect(focusMaster);
  audio.play().catch(err => {
    showToast('Ses çalınamadı. Dosya sounds/ klasöründe mi?', 'error');
    console.error('Ses hatası:', src, err);
  });
  focusChannels[id] = { gain, nodes: [], audioEl: audio };
}

/* ── Toggle ── */
function toggleFocusChannel(id, src) {
  if (focusChannels[id]) {
    const ch = focusChannels[id];
    if (ch.audioEl) { ch.audioEl.pause(); ch.audioEl.src = ''; }
    delete focusChannels[id];
    if (Object.keys(focusChannels).length === 0 && focusCtx) {
      focusCtx.close(); focusCtx = null; focusMaster = null;
    }
  } else {
    if (!src) { showToast('Ses dosyası bulunamadı.', 'error'); return; }
    buildAudioChannel(id, src);
  }
  updateFocusUI();
  renderFocusWidget();
}

function setChannelVolume(id, vol) {
  const ch = focusChannels[id];
  if (ch) ch.gain.gain.value = vol / 100;
}

function stopAllFocus() {
  Object.keys(focusChannels).forEach(id => {
    const ch = focusChannels[id];
    ch.nodes.forEach(n => { try { n.stop(); } catch {} });
    if (ch.audioEl) { ch.audioEl.pause(); ch.audioEl.src = ''; }
    delete focusChannels[id];
  });
  if (focusCtx) { focusCtx.close(); focusCtx = null; focusMaster = null; }
  updateFocusUI();
  renderFocusWidget();
}

function updateFocusUI() {
  document.querySelectorAll('.focus-sound').forEach(el => {
    el.classList.toggle('active', !!focusChannels[el.dataset.id]);
  });
}

/* ════════════════════════════════════════
   WİDGET
   ════════════════════════════════════════ */
function renderFocusWidget() {
  const body = document.getElementById('focus-widget-body');
  if (!body) return;

  const pinned = loadPinnedSounds();

  body.innerHTML = `
    <div class="focus-widget-master">
      <span class="focus-widget-vol-icon">${getIcon('volume', 13)}</span>
      <input type="range" class="focus-widget-slider" id="focus-widget-slider" min="0" max="100" value="${focusVolume}"/>
      <span class="focus-widget-vol-val" id="focus-widget-vol-val">%${focusVolume}</span>
    </div>
    ${pinned.length
      ? `<div class="focus-widget-pins">
          ${pinned.map(id => {
            const s = findSound(id);
            if (!s) return '';
            const on = !!focusChannels[id];
            return `
              <button class="focus-widget-pin${on ? ' active' : ''}" data-id="${id}" data-src="${s.src || ''}" title="${escapeHtml(s.name)}">
                ${getIcon(s.icon || 'snd_custom', 18)}
                <span>${escapeHtml(s.name)}</span>
              </button>`;
          }).join('')}
        </div>`
      : `<div class="focus-widget-empty">Modülden ses pinleyebilirsin.</div>`}
  `;

  // Ana ses barı
  const slider = body.querySelector('#focus-widget-slider');
  slider.addEventListener('click', e => e.stopPropagation());
  slider.addEventListener('input', function(e) {
    e.stopPropagation();
    focusVolume = parseInt(this.value);
    body.querySelector('#focus-widget-vol-val').textContent = '%' + focusVolume;
    if (focusMaster) focusMaster.gain.value = focusVolume / 100;
    // Açık modülün master slider'ını da güncelle
    const mod = document.getElementById('focus-master-slider');
    if (mod) { mod.value = focusVolume; document.getElementById('focus-master-val').textContent = '%' + focusVolume; }
  });

  // Pin butonları — çal/durdur
  body.querySelectorAll('.focus-widget-pin').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFocusChannel(btn.dataset.id, btn.dataset.src || null);
    });
  });
}

/* ════════════════════════════════════════
   ORTA PANEL
   ════════════════════════════════════════ */
function openFocusModule() {
  renderFocusModule();
}

function renderFocusModule() {
  const center = document.getElementById('col-center');
  if (!center) return;

  const custom = loadCustomSounds();

  center.innerHTML = `
    <div id="module-focus">
      <div class="focus-topbar">
        <span style="color:var(--accent);display:flex">${getIcon('music', 20)}</span>
        <span class="focus-topbar-title">Odak Sesi</span>
      </div>
      <div class="focus-body">
        <div class="focus-master">
          <span class="focus-master-icon">${getIcon('volume', 18)}</span>
          <span class="focus-master-label">Ana Ses</span>
          <input type="range" class="focus-master-slider" id="focus-master-slider" min="0" max="100" value="${focusVolume}"/>
          <span class="focus-master-val" id="focus-master-val">%${focusVolume}</span>
        </div>

        <div class="focus-section-title">${getIcon('music', 15)} Sesler</div>
        <div class="focus-grid" id="focus-grid">
          ${FOCUS_SOUNDS.map(s => focusSoundHTML(s, false)).join('')}
          ${custom.map(s => focusSoundHTML(s, true)).join('')}
          <button class="focus-add" id="focus-add-btn">
            ${getIcon('upload', 22)}
            <span>Ses Ekle</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Master volume
  const masterSlider = center.querySelector('#focus-master-slider');
  masterSlider.addEventListener('input', function() {
    focusVolume = parseInt(this.value);
    center.querySelector('#focus-master-val').textContent = '%' + focusVolume;
    if (focusMaster) focusMaster.gain.value = focusVolume / 100;
    // Widget slider'ını da güncelle
    const w = document.getElementById('focus-widget-slider');
    if (w) { w.value = focusVolume; const wv = document.getElementById('focus-widget-vol-val'); if (wv) wv.textContent = '%' + focusVolume; }
  });

  bindFocusSounds(center);

  center.querySelector('#focus-add-btn').addEventListener('click', openFocusUpload);

  updateFocusUI();
}

function focusSoundHTML(s, isCustom) {
  const active = !!focusChannels[s.id];
  const vol = active ? Math.round(focusChannels[s.id].gain.gain.value * 100) : 70;
  const pinned = isPinned(s.id);
  return `
    <div class="focus-sound${active ? ' active' : ''}" data-id="${s.id}" data-src="${s.src}">
      <button class="focus-sound-pin${pinned ? ' pinned' : ''}" data-id="${s.id}" title="${pinned ? 'Pini kaldır' : 'Pinle'}">${getIcon('pin', 12)}</button>
      ${isCustom ? `<button class="focus-sound-del" data-id="${s.id}" title="Sil">${getIcon('x', 11)}</button>` : ''}
      <span class="focus-sound-icon">${getIcon(s.icon || 'snd_custom', 28)}</span>
      <span class="focus-sound-name">${escapeHtml(s.name)}</span>
      <input type="range" class="focus-sound-vol" min="0" max="100" value="${vol}" data-id="${s.id}"/>
    </div>
  `;
}

function bindFocusSounds(center) {
  center.querySelectorAll('.focus-sound').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.focus-sound-vol, .focus-sound-del, .focus-sound-pin')) return;
      toggleFocusChannel(el.dataset.id, el.dataset.src || null);
    });
  });

  // Pinleme — tam render yapmadan sadece butonu güncelle
  center.querySelectorAll('.focus-sound-pin').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (togglePin(btn.dataset.id)) {
        const nowPinned = isPinned(btn.dataset.id);
        btn.classList.toggle('pinned', nowPinned);
        btn.title = nowPinned ? 'Pini kaldır' : 'Pinle';
        renderFocusWidget();
      }
    });
  });

  // Kanal volume
  center.querySelectorAll('.focus-sound-vol').forEach(slider => {
    slider.addEventListener('click', e => e.stopPropagation());
    slider.addEventListener('input', function(e) {
      e.stopPropagation();
      setChannelVolume(this.dataset.id, parseInt(this.value));
    });
  });

  // Özel ses silme
  center.querySelectorAll('.focus-sound-del').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const ok = await showDialog({
        icon: getIcon('trash', 28), title: 'Sesi Sil',
        message: 'Bu özel ses silinecek.',
        confirmText: 'Sil', cancelText: 'Vazgeç', danger: true,
      });
      if (!ok) return;
      if (focusChannels[id]) toggleFocusChannel(id);
      saveCustomSounds(loadCustomSounds().filter(s => s.id !== id));
      savePinnedSounds(loadPinnedSounds().filter(x => x !== id));
      renderFocusModule();
      renderFocusWidget();
    });
  });
}

/* ── Ses ekleme formu ── */
function openFocusUpload() {
  let audioData = null, fileName = '';
  let selectedIcon = 'snd_custom';
  const iconChoices = ['snd_custom', 'snd_rain', 'snd_wind', 'snd_fire', 'snd_birds', 'snd_white', 'snd_waves', 'snd_forest', 'snd_cafe', 'music'];

  const overlay = document.createElement('div');
  overlay.className = 'focus-upload-overlay';
  overlay.id = 'focus-upload-overlay';
  overlay.innerHTML = `
    <div class="focus-upload-panel">
      <div class="focus-upload-title">${getIcon('upload', 20)} Ses Ekle</div>
      <div class="focus-upload-drop" id="fu-drop">
        Tıkla veya sürükle-bırak ile ses dosyası seç<br>(mp3, wav, ogg…)
      </div>
      <input type="file" id="fu-file" accept="audio/*" style="display:none"/>
      <div class="focus-upload-filename" id="fu-name" style="display:none"></div>
      <div class="notes-form-label" style="margin-top:8px">Ses adı</div>
      <input class="notes-form-input" id="fu-label" placeholder="Örn. Lo-fi, Yağmur 2…" maxlength="30"/>
      <div class="notes-form-label">İkon</div>
      <div class="focus-icon-grid" id="fu-icons">
        ${iconChoices.map((ic, i) => `
          <button class="focus-icon-opt${i===0?' active':''}" data-icon="${ic}">${getIcon(ic, 22)}</button>
        `).join('')}
      </div>
      <div class="notes-form-actions">
        <button class="notes-tool-btn" id="fu-cancel">İptal</button>
        <button class="notes-tool-btn" id="fu-add" style="background:var(--accent);color:#fff;border-color:var(--accent);opacity:0.5;pointer-events:none">Ekle</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#fu-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const fileInput = overlay.querySelector('#fu-file');
  const drop = overlay.querySelector('#fu-drop');
  const addBtn = overlay.querySelector('#fu-add');
  const labelInput = overlay.querySelector('#fu-label');

  // İkon seçimi
  overlay.querySelectorAll('.focus-icon-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.focus-icon-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedIcon = btn.dataset.icon;
    });
  });

  const loadFile = file => {
    if (!file.type.startsWith('audio/')) { showToast('Sadece ses dosyası.', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('Dosya çok büyük (max 10MB).', 'error'); return; }
    fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      audioData = reader.result;
      overlay.querySelector('#fu-name').textContent = fileName;
      overlay.querySelector('#fu-name').style.display = 'block';
      if (!labelInput.value) labelInput.value = fileName.replace(/\.[^.]+$/, '');
      addBtn.style.opacity = '1';
      addBtn.style.pointerEvents = 'auto';
    };
    reader.readAsDataURL(file);
  };

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

  addBtn.addEventListener('click', () => {
    if (!audioData) return;
    const name = labelInput.value.trim() || fileName.replace(/\.[^.]+$/, '') || 'Özel Ses';
    const custom = loadCustomSounds();
    custom.push({
      id: 'custom_' + Date.now(),
      name, src: audioData, icon: selectedIcon,
    });
    saveCustomSounds(custom);
    close();
    renderFocusModule();
    showToast('Ses eklendi.', 'success');
  });

  setTimeout(() => labelInput.focus(), 50);
}