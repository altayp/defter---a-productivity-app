/* ═══════════════════════════════════════
   dashboard.js — Tema + Karşılama + Düzen
   ═══════════════════════════════════════ */

/* ── Tema (DOM hazır olmadan önce uygula) ── */
const savedColor = loadJSON('color', 'green');
document.documentElement.dataset.theme = loadJSON('theme', 'dark');
document.documentElement.dataset.color = savedColor;

/* ── Özel (custom) renk ── */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function shadeHex(hex, percent) {
  // percent < 0 koyulaştırır
  const { r, g, b } = hexToRgb(hex);
  const adj = c => Math.max(0, Math.min(255, Math.round(c + (c * percent / 100))));
  return '#' + [adj(r), adj(g), adj(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function applyCustomColor(hex) {
  const root = document.documentElement;
  const { r, g, b } = hexToRgb(hex);
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-hover', shadeHex(hex, -22));
  root.style.setProperty('--accent-subtle', `rgba(${r},${g},${b},0.15)`);
}
function clearCustomColor() {
  const root = document.documentElement;
  root.style.removeProperty('--accent');
  root.style.removeProperty('--accent-hover');
  root.style.removeProperty('--accent-subtle');
}
function getCustomColor() { return loadJSON('color-custom', '#e08a4c'); }

// Sayfa açılışında custom seçiliyse uygula
if (savedColor === 'custom') applyCustomColor(getCustomColor());

/* ── Font büyüklüğü (zoom ölçeği) ── */
function applyFontScale(scale) {
  // scale: 0.85 – 1.3 arası; tüm arayüzü orantılı ölçekler
  if (document.body) document.body.style.zoom = scale;
}

/* ── Widget görünürlüğü + Developer modu ── */
const DEV_PASSWORD = 'defter2026';

function isDevMode() { return loadJSON('dev-mode', false) === true; }
function loadHiddenWidgets() {
  try { return JSON.parse(localStorage.getItem('hidden-widgets') || '[]'); }
  catch { return []; }
}
function saveHiddenWidgets(arr) { localStorage.setItem('hidden-widgets', JSON.stringify(arr)); }

function applyWidgetVisibility() {
  const hidden = loadHiddenWidgets();
  const dev = isDevMode();
  document.querySelectorAll('.widget').forEach(w => {
    const isDevWidget = w.dataset.dev === 'true';
    // Dev widget'ı sadece dev modunda görünebilir
    if (isDevWidget && !dev) { w.style.display = 'none'; return; }
    // Kullanıcının gizlediği widget'lar
    w.style.display = hidden.includes(w.id) ? 'none' : '';
  });
}

/* ── Tema Toggle ── */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  saveJSON('theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? getIcon('sun', 15) : getIcon('moon', 15);
}

/* ── Karşılama Ekranı ── */
const QUOTES = [
  { text: 'Bugün yapabileceğini yarına bırakma.', author: 'Benjamin Franklin' },
  { text: 'Odaklanmak, hayır demesini bilmektir.', author: 'Steve Jobs' },
  { text: 'Başarı, her gün tekrarlanan küçük çabaların toplamıdır.', author: 'Robert Collier' },
  { text: 'Hayal kurmak güzel; fakat harekete geçmek daha güzel.', author: 'Atatürk' },
  { text: 'Derin çalışma, sığ dünyadaki süper güçtür.', author: 'Cal Newport' },
];

let clockInterval = null;

function renderWelcome() {
  const center = document.getElementById('col-center');
  if (!center) return;
  const hour = new Date().getHours();
  const q    = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  let icon, greeting, sub;
  if      (hour >= 5  && hour < 12) { icon = getIcon('sunrise', 48); greeting = 'Günaydın';     sub = 'Bugünü harika bir güne dönüştüreceksin.'; }
  else if (hour >= 12 && hour < 17) { icon = getIcon('sun', 48);     greeting = 'İyi Günler';   sub = 'Odaklanmış ve üretken bir öğleden sonra diliyorum.'; }
  else if (hour >= 17 && hour < 21) { icon = getIcon('sunset', 48);  greeting = 'İyi Akşamlar'; sub = 'Bugün başardıklarına bir bak — gurur duyabilirsin.'; }
  else                               { icon = getIcon('moon', 48);    greeting = 'İyi Geceler';  sub = 'Yarın için kendini hazırla, iyi dinlenmeler.'; }

  const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  center.innerHTML = `
    <div id="welcome">
      <div class="welcome-icon">${icon}</div>
      <h1 class="welcome-greeting">${greeting}</h1>
      <div class="welcome-time" id="welcome-clock">${timeStr}</div>
      <p class="welcome-subtext">${sub}</p>
      <div class="welcome-quote">
        <p>"${escapeHtml(q.text)}"</p>
        <p class="welcome-quote-author">— ${escapeHtml(q.author)}</p>
      </div>
    </div>
  `;

  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    const el = document.getElementById('welcome-clock');
    if (!el) { clearInterval(clockInterval); return; }
    el.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }, 1000);
}

/* ═══════════════════════════════════════
   DÜZEN KİLİDİ & WIDGET SÜRÜKLEME
   ═══════════════════════════════════════ */

let layoutLocked = loadJSON('layout-locked', true);

function applyLayoutLock() {
  const btn  = document.getElementById('layout-lock-btn');
  const body = document.body;

  if (layoutLocked) {
    body.classList.remove('layout-unlocked');
    if (btn) {
      btn.innerHTML = getIcon('lock', 15);
      btn.title     = 'Düzeni Kilitle (açmak için tıkla)';
      btn.classList.remove('active');
    }
  } else {
    body.classList.add('layout-unlocked');
    if (btn) {
      btn.innerHTML = getIcon('unlock', 15);
      btn.title     = 'Düzen Açık (kilitlemek için tıkla)';
      btn.classList.add('active');
    }
  }
  saveJSON('layout-locked', layoutLocked);
}

/* ── Widget yerleşimini kaydet / yükle ── */
function saveWidgetLayout() {
  const layout = {};
  ['col-left', 'col-right'].forEach(colId => {
    const col = document.getElementById(colId);
    if (!col) return;
    col.querySelectorAll('.widget[id]').forEach((w, i) => {
      layout[w.id] = { col: colId, order: i };
    });
  });
  saveJSON('widget-layout', layout);
}

function loadWidgetLayout() {
  const layout = loadJSON('widget-layout', null);
  if (!layout) return;

  // Sütunlara göre grupla ve sırala
  const byCol = { 'col-left': [], 'col-right': [] };
  Object.entries(layout).forEach(([id, data]) => {
    const colId = typeof data === 'string' ? data : data.col;
    const order = typeof data === 'object' ? (data.order ?? 99) : 99;
    if (byCol[colId]) byCol[colId].push({ id, order });
  });

  ['col-left', 'col-right'].forEach(colId => {
    const col = document.getElementById(colId);
    if (!col) return;
    byCol[colId]
      .sort((a, b) => a.order - b.order)
      .forEach(({ id }) => {
        const w = document.getElementById(id);
        if (w) col.appendChild(w);
      });
  });
}

/* ── Sürükleme sistemi ── */
let dragWidget   = null;
let dragGhost    = null;
let dropColId    = null;   // hedef sütun id
let dropBeforeEl = null;   // bu widget'ın önüne ekle (null = sona ekle)
let dragStartCol = null;
let dragPlaceholder = null;

function initWidgetDrag() {
  document.querySelectorAll('.widget[id]').forEach(widget => {
    const handle = widget.querySelector('.widget-drag-handle');
    if (!handle) return;
    handle.removeEventListener('mousedown', onDragStart);
    handle.addEventListener('mousedown', onDragStart);
  });
}

function onDragStart(e) {
  if (layoutLocked) return;
  e.preventDefault();
  e.stopPropagation();

  dragWidget   = e.currentTarget.closest('.widget');
  dragStartCol = dragWidget.parentElement.id;

  // Placeholder — boş alan bırakır
  dragPlaceholder = document.createElement('div');
  dragPlaceholder.className = 'widget-placeholder';
  dragPlaceholder.style.height = dragWidget.offsetHeight + 'px';
  dragWidget.parentElement.insertBefore(dragPlaceholder, dragWidget);

  // Ghost
  dragGhost = dragWidget.cloneNode(true);
  dragGhost.id = '';
  dragGhost.classList.add('widget-drag-ghost');
  dragGhost.style.width = dragWidget.offsetWidth + 'px';
  dragGhost.style.left  = dragWidget.getBoundingClientRect().left + 'px';
  dragGhost.style.top   = dragWidget.getBoundingClientRect().top  + 'px';
  document.body.appendChild(dragGhost);

  dragWidget.classList.add('widget-dragging');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup',   onDragEnd);
}

function onDragMove(e) {
  if (!dragGhost) return;

  dragGhost.style.left = (e.clientX - dragGhost.offsetWidth / 2) + 'px';
  dragGhost.style.top  = (e.clientY - 20) + 'px';

  // Hangi sütunun üzerinde?
  const cols = ['col-left', 'col-right'].map(id => document.getElementById(id));
  let foundCol = null;
  cols.forEach(col => {
    const r = col.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right) foundCol = col;
    col.classList.remove('col-drop-target');
  });

  if (!foundCol) { dropColId = null; dropBeforeEl = null; return; }

  foundCol.classList.add('col-drop-target');
  dropColId = foundCol.id;

  // Placeholder'ı doğru konuma taşı
  const widgets = [...foundCol.querySelectorAll('.widget:not(.widget-dragging):not(.widget-placeholder)')];
  let before = null;
  for (const w of widgets) {
    const r   = w.getBoundingClientRect();
    const mid = r.top + r.height / 2;
    if (e.clientY < mid) { before = w; break; }
  }
  dropBeforeEl = before;

  if (before) {
    foundCol.insertBefore(dragPlaceholder, before);
  } else {
    foundCol.appendChild(dragPlaceholder);
  }
}

function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup',   onDragEnd);

  ['col-left','col-right'].forEach(id =>
    document.getElementById(id)?.classList.remove('col-drop-target')
  );

  if (dragGhost) { dragGhost.remove(); dragGhost = null; }

  if (dragWidget && dropColId) {
    const targetCol = document.getElementById(dropColId);
    if (dropBeforeEl) {
      targetCol.insertBefore(dragWidget, dropBeforeEl);
    } else {
      targetCol.appendChild(dragWidget);
    }
    dragWidget.dataset.col = dropColId;
    saveWidgetLayout();
    rebindWidgetHandlers(dragWidget);
  }

  if (dragPlaceholder) { dragPlaceholder.remove(); dragPlaceholder = null; }
  if (dragWidget) dragWidget.classList.remove('widget-dragging');

  dragWidget   = null;
  dropColId    = null;
  dropBeforeEl = null;
  dragStartCol = null;
}

function rebindWidgetHandlers(widget) {
  const id = widget.id;
  if (id === 'widget-today') {
    widget.onclick = openTodayModule;
    widget.querySelector('#today-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openTodayModule();
    });
  }
  if (id === 'widget-todo') {
    widget.onclick = openTodoModule;
    widget.querySelector('#todo-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openTodoModule();
    });
  }
  if (id === 'widget-notes') {
    widget.onclick = openNotesModule;
    widget.querySelector('#notes-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openNotesModule();
    });
  }
  if (id === 'widget-habits') {
    widget.onclick = openHabitsModule;
    widget.querySelector('#habits-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openHabitsModule();
    });
  }
  if (id === 'widget-projects') {
    widget.onclick = openProjectsModule;
    widget.querySelector('#projects-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openProjectsModule();
    });
  }
  if (id === 'widget-calendar') {
    widget.onclick = openCalendarModule;
    widget.querySelector('#calendar-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openCalendarModule();
    });
  }
  if (id === 'widget-focus') {
    widget.onclick = openFocusModule;
    widget.querySelector('#focus-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openFocusModule();
    });
  }
  if (id === 'widget-pomodoro') {
    widget.onclick = openPomoModule;
    widget.querySelector('#pomo-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openPomoModule();
    });
  }
  if (id === 'widget-test') {
    widget.onclick = openTestModule;
    widget.querySelector('#test-expand-btn')?.addEventListener('click', openTestModule);
  }
}

/* ═══════════════════════════════════════
   DOMContentLoaded
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* Renk noktaları */
  const customDot = document.getElementById('color-dot-custom');
  if (customDot) customDot.style.background = getCustomColor();

  document.querySelectorAll('.color-dot').forEach(dot => {
    if (dot.dataset.color === savedColor) dot.classList.add('active');
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const color = dot.dataset.color;
      document.documentElement.dataset.color = color;
      saveJSON('color', color);
      if (color === 'custom') applyCustomColor(getCustomColor());
      else clearCustomColor();
    });
  });

  /* Tema toggle */
  applyTheme(loadJSON('theme', 'dark'));
  applyFontScale(loadJSON('font-scale', 1));
  applyWidgetVisibility();
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  /* Pencere kontrolleri */
  document.getElementById('btn-min')  ?.addEventListener('click', () => window.electronAPI?.windowControl('minimize'));
  document.getElementById('btn-max')  ?.addEventListener('click', () => window.electronAPI?.windowControl('maximize'));
  document.getElementById('btn-close')?.addEventListener('click', () => window.electronAPI?.windowControl('close'));

  /* Ayarlar */
  document.getElementById('settings-btn')?.addEventListener('click', openSettings);

  /* Düzen kilidi */
  document.getElementById('layout-lock-btn')?.addEventListener('click', () => {
    layoutLocked = !layoutLocked;
    applyLayoutLock();
    initWidgetDrag();
  });
  applyLayoutLock();

  /* Odaklanma modu — sol/sağ sütunları gizle */
  const focusBtn = document.getElementById('focus-mode-btn');
  if (focusBtn) focusBtn.innerHTML = getIcon('eye', 15);
  focusBtn?.addEventListener('click', () => {
    const on = document.body.classList.toggle('focus-mode');
    focusBtn.innerHTML = getIcon(on ? 'eye_off' : 'eye', 15);
    focusBtn.title = on ? 'Odak modundan çık' : 'Odaklan (sütunları gizle)';
    focusBtn.classList.toggle('active', on);
  });

  /* Widget yerleşimini yükle */
  loadWidgetLayout();

  /* Sürükleme handle ikonlarını doldur */
  document.querySelectorAll('.widget-drag-handle').forEach(h => {
    h.innerHTML = getIcon('grip', 14);
  });

  /* Sürüklemeyi başlat */
  initWidgetDrag();

  /* Bugün widget */
  renderTodayWidget();
  document.getElementById('today-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openTodayModule(); });
  document.getElementById('widget-today')?.addEventListener('click', openTodayModule);

  /* Todo widget */
  renderTodoWidget();
  document.getElementById('todo-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openTodoModule(); });
  document.getElementById('widget-todo')?.addEventListener('click', openTodoModule);

  /* Notlar widget */
  renderNotesWidget();
  document.getElementById('notes-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openNotesModule(); });
  document.getElementById('widget-notes')?.addEventListener('click', openNotesModule);

  /* Alışkanlıklar widget */
  renderHabitsWidget();
  document.getElementById('habits-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openHabitsModule(); });
  document.getElementById('widget-habits')?.addEventListener('click', openHabitsModule);

  /* Projeler widget */
  renderProjectsWidget();
  document.getElementById('projects-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openProjectsModule(); });
  document.getElementById('widget-projects')?.addEventListener('click', openProjectsModule);

  /* Takvim widget */
  renderCalendarWidget();
  document.getElementById('calendar-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openCalendarModule(); });
  document.getElementById('widget-calendar')?.addEventListener('click', openCalendarModule);

  /* Odak Sesi widget */
  renderFocusWidget();
  document.getElementById('focus-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openFocusModule(); });
  document.getElementById('widget-focus')?.addEventListener('click', openFocusModule);

  /* Pomodoro widget */
  renderPomoWidget();
  document.getElementById('pomo-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openPomoModule(); });
  document.getElementById('widget-pomodoro')?.addEventListener('click', openPomoModule);

  /* Test widget */
  const testBody = document.getElementById('test-widget-body');
  if (testBody) testBody.innerHTML = renderTestWidget();
  document.getElementById('test-expand-btn')?.addEventListener('click', openTestModule);
  document.getElementById('widget-test')?.addEventListener('click', openTestModule);

  /* Karşılama */
  renderWelcome();

});