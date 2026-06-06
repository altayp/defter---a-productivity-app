/* ═══════════════════════════════════════
   dashboard.js — Tema + Karşılama + Düzen
   ═══════════════════════════════════════ */

/* ── Tema (DOM hazır olmadan önce uygula) ── */
const savedColor = loadJSON('color', 'green');
document.documentElement.dataset.theme = loadJSON('theme', 'dark');
document.documentElement.dataset.color = savedColor;

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
  if (id === 'widget-todo') {
    widget.onclick = openTodoModule;
    widget.querySelector('#todo-expand-btn')?.addEventListener('click', e => {
      e.stopPropagation(); openTodoModule();
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
  document.querySelectorAll('.color-dot').forEach(dot => {
    if (dot.dataset.color === savedColor) dot.classList.add('active');
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      document.documentElement.dataset.color = dot.dataset.color;
      saveJSON('color', dot.dataset.color);
    });
  });

  /* Tema toggle */
  applyTheme(loadJSON('theme', 'dark'));
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

  /* Widget yerleşimini yükle */
  loadWidgetLayout();

  /* Sürükleme handle ikonlarını doldur */
  document.querySelectorAll('.widget-drag-handle').forEach(h => {
    h.innerHTML = getIcon('grip', 14);
  });

  /* Sürüklemeyi başlat */
  initWidgetDrag();

  /* Todo widget */
  renderTodoWidget();
  document.getElementById('todo-expand-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openTodoModule(); });
  document.getElementById('widget-todo')?.addEventListener('click', openTodoModule);

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