/* ═══════════════════════════════════════
   today.js — Bugün Modülü (toplayıcı)
   ═══════════════════════════════════════ */

/* Bugünün ISO tarihi (yerel) */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ── Bugünün öğelerini topla ── */
function collectTodayItems() {
  const iso = todayISO();
  const todos = [];
  const projects = [];

  // Todo: bugün hatırlatıcısı olanlar VEYA günlük görevler
  try {
    const all = JSON.parse(localStorage.getItem('todos-v3') || '[]');
    all.forEach(t => {
      if (t.hidden) return;
      const isToday = t.reminder && t.reminder.slice(0,10) === iso;
      const isDaily = t.recurrence === 'daily';
      if (isToday || isDaily) {
        todos.push(t);
      }
    });
  } catch {}

  // Proje: bugün deadline'ı olanlar
  try {
    const all = JSON.parse(localStorage.getItem('projects-v3') || '[]');
    all.forEach(p => {
      if (p.deadline && p.deadline.slice(0,10) === iso) {
        projects.push(p);
      }
    });
  } catch {}

  return { todos, projects };
}

/* ════════════════════════════════════════
   SOL SÜTUN WİDGET
   ════════════════════════════════════════ */
function renderTodayWidget() {
  const body = document.getElementById('today-widget-body');
  if (!body) return;

  const { todos, projects } = collectTodayItems();
  const pending = todos.filter(t => !t.done);
  const logs = getNotificationLogs();
  const dateStr = new Date().toLocaleDateString('tr-TR', { day:'numeric', month:'long', weekday:'long' });

  const lastLog = logs[0];
  const nothing = pending.length === 0 && projects.length === 0;

  body.innerHTML = `
    <div class="today-widget-head">
      <span class="today-widget-date">${dateStr}</span>
    </div>

    ${nothing ? `<div class="today-widget-empty">Bugün için bir şey yok.</div>` : ''}

    ${pending.length ? `
      <div class="today-widget-group">
        <div class="today-widget-group-title">${getIcon('check', 11)} Görevler</div>
        <div class="today-widget-list">
          ${pending.slice(0, 4).map(t => `
            <div class="today-widget-item">
              <span class="today-widget-dot todo"></span>
              <span class="today-widget-item-label">${escapeHtml(t.text)}</span>
            </div>`).join('')}
          ${pending.length > 4 ? `<div class="today-widget-more">+${pending.length - 4} daha</div>` : ''}
        </div>
      </div>
    ` : ''}

    ${projects.length ? `
      <div class="today-widget-group">
        <div class="today-widget-group-title">${getIcon('folder', 11)} Projeler</div>
        <div class="today-widget-list">
          ${projects.slice(0, 4).map(p => `
            <div class="today-widget-item">
              <span class="today-widget-dot project"></span>
              <span class="today-widget-item-label">${escapeHtml(p.name)}</span>
            </div>`).join('')}
          ${projects.length > 4 ? `<div class="today-widget-more">+${projects.length - 4} daha</div>` : ''}
        </div>
      </div>
    ` : ''}

    ${lastLog ? `
      <div class="today-widget-lastnotif" id="today-last-notif" title="Bildirim geçmişini gör">
        <span class="today-widget-notif-icon">${getIcon('bell', 12)}</span>
        <div class="today-widget-notif-body">
          <span class="today-widget-notif-msg">${escapeHtml(lastLog.message)}</span>
          <span class="today-widget-notif-time">${formatLogTime(lastLog.time)}</span>
        </div>
      </div>
    ` : ''}
  `;

  body.querySelector('#today-last-notif')?.addEventListener('click', e => {
    e.stopPropagation();
    openNotificationLogs();
  });
}

/* ── Bildirim logları overlay ── */
function openNotificationLogs() {
  if (document.getElementById('notif-log-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'notif-log-overlay';
  overlay.id = 'notif-log-overlay';

  const render = () => {
    const logs = getNotificationLogs();
    overlay.innerHTML = `
      <div class="notif-log-panel">
        <div class="notif-log-header">
          <span style="color:var(--accent);display:flex">${getIcon('bell', 18)}</span>
          <span class="notif-log-title">Bildirim Geçmişi</span>
          ${logs.length ? `<button class="notif-log-clear" id="nl-clear">Temizle</button>` : ''}
          <button class="notif-log-close" id="nl-close">${getIcon('x', 14)}</button>
        </div>
        <div class="notif-log-list">
          ${logs.length
            ? logs.map(l => `
                <div class="notif-log-item ${l.type}">
                  <span class="notif-log-icon">${getIcon('bell', 14)}</span>
                  <div class="notif-log-content">
                    <div class="notif-log-msg">${escapeHtml(l.message)}</div>
                    <div class="notif-log-time">${formatLogTime(l.time)}</div>
                  </div>
                </div>`).join('')
            : `<div class="notif-log-empty">Henüz bildirim yok.</div>`}
        </div>
      </div>
    `;

    overlay.querySelector('#nl-close').addEventListener('click', closeNotificationLogs);
    overlay.querySelector('#nl-clear')?.addEventListener('click', () => {
      clearNotificationLogs();
      render();
      renderTodayWidget();
    });
  };

  document.body.appendChild(overlay);
  render();
  overlay.addEventListener('click', e => { if (e.target === overlay) closeNotificationLogs(); });
  setTimeout(() => overlay.classList.add('show'), 10);
}

function closeNotificationLogs() {
  const o = document.getElementById('notif-log-overlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 150); }
}

function formatLogTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return 'Bugün ' + d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
  }
  return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' })
    + ' ' + d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
}

/* ════════════════════════════════════════
   ORTA PANEL
   ════════════════════════════════════════ */
function openTodayModule() {
  renderTodayModule();
}

function renderTodayModule() {
  const center = document.getElementById('col-center');
  if (!center) return;

  const { todos, projects } = collectTodayItems();
  const dateStr = new Date().toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', weekday:'long' });

  const pendingTodos = todos.filter(t => !t.done);
  const allDone = todos.length > 0 && pendingTodos.length === 0 && projects.length === 0;
  const nothingToday = todos.length === 0 && projects.length === 0;

  center.innerHTML = `
    <div id="module-today">
      <div class="today-topbar">
        <span style="color:var(--accent);display:flex">${getIcon('today', 20)}</span>
        <span class="today-topbar-title">Bugün</span>
        <span class="today-topbar-date">${dateStr}</span>
      </div>
      <div class="today-body">
        ${nothingToday ? `
          <div class="today-all-done">
            Bugün için planın boş
            <div class="today-all-done-sub">Yeni görev veya hatırlatıcı ekleyebilirsin.</div>
          </div>
        ` : ''}

        ${todos.length ? `
          <div>
            <div class="today-section-title">
              ${getIcon('check', 16)} Görevler
              <span class="today-section-count">${pendingTodos.length} bekliyor</span>
            </div>
            <div class="today-list" id="today-todo-list">
              ${todos.map(t => renderTodayTodo(t)).join('')}
            </div>
          </div>
        ` : ''}

        ${projects.length ? `
          <div>
            <div class="today-section-title">
              ${getIcon('folder', 16)} Proje Teslimleri
              <span class="today-section-count">${projects.length} deadline bugün</span>
            </div>
            <div class="today-list">
              ${projects.map(p => renderTodayProject(p)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Görev tamamlama
  center.querySelectorAll('.today-card-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const all = JSON.parse(localStorage.getItem('todos-v3') || '[]');
      const t = all.find(x => x.id === id);
      if (t) {
        t.done = !t.done;
        localStorage.setItem('todos-v3', JSON.stringify(all));
        renderTodayModule();
        renderTodayWidget();
        if (typeof renderTodoWidget === 'function') renderTodoWidget();
      }
    });
  });

  // Proje kartına tıklayınca o projeyi aç
  center.querySelectorAll('.today-card[data-project]').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.dataset.project;
      if (typeof openProjectBoard === 'function') {
        openProjectBoard(pid);
      }
    });
  });
}

function renderTodayTodo(t) {
  return `
    <div class="today-card${t.priority === 'high' ? ' high' : ''}${t.done ? ' done' : ''}">
      <button class="today-card-check${t.done ? ' done' : ''}" data-id="${t.id}">
        ${t.done ? getIcon('check', 11) : ''}
      </button>
      <div class="today-card-body">
        <div class="today-card-title">${escapeHtml(t.text)}</div>
        <div class="today-card-meta">
          ${t.priority === 'high' ? `<span class="today-card-tag">${getIcon('flag', 11)} Yüksek</span>` : ''}
          ${t.recurrence === 'daily' ? `<span class="today-card-tag">${getIcon('repeat', 11)} Günlük</span>` : ''}
          ${t.reminder ? `<span class="today-card-tag">${getIcon('bell', 11)} ${new Date(t.reminder).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderTodayProject(p) {
  let total = 0, done = 0;
  (p.columns || []).forEach(c => (c.cards || []).forEach(card => { total++; if (card.done) done++; }));
  const pct = total ? Math.round(done/total*100) : 0;
  return `
    <div class="today-card" data-project="${p.id}" style="cursor:pointer">
      <span class="today-card-icon">${getIcon('folder', 18)}</span>
      <div class="today-card-body">
        <div class="today-card-title">${escapeHtml(p.name)}</div>
        <div class="today-card-meta">
          <span class="today-card-tag">${getIcon('calendar', 11)} Bugün teslim</span>
          <span class="today-card-tag">%${pct} tamamlandı</span>
        </div>
      </div>
    </div>
  `;
}