/* ═══════════════════════════════════════
   todo.js
   ═══════════════════════════════════════ */

/* ── Veri ── */
function loadTodos() {
  try { return JSON.parse(localStorage.getItem('todos-v3') || '[]'); }
  catch { return []; }
}
function saveTodos(todos) {
  localStorage.setItem('todos-v3', JSON.stringify(todos));
}
function newTodoId() {
  return 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

/* ── Periyodik sıfırlama ── */
function applyTodoResets() {
  let todos = loadTodos();
  let changed = false;
  const now   = new Date();
  const today = now.toDateString();
  const mon   = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return d.toDateString();
  })();
  const month = `${now.getFullYear()}-${now.getMonth()}`;

  const lastDay   = localStorage.getItem('todo-reset-day')   || '';
  const lastWeek  = localStorage.getItem('todo-reset-week')  || '';
  const lastMonth = localStorage.getItem('todo-reset-month') || '';

  todos = todos.map(t => {
    if (t.recurrence === 'daily'   && lastDay   !== today && t.done) { changed = true; return { ...t, done: false, hidden: false }; }
    if (t.recurrence === 'weekly'  && lastWeek  !== mon   && t.done) { changed = true; return { ...t, done: false, hidden: false }; }
    if (t.recurrence === 'monthly' && lastMonth !== month && t.done) { changed = true; return { ...t, done: false, hidden: false }; }
    return t;
  });

  if (lastDay   !== today) localStorage.setItem('todo-reset-day',   today);
  if (lastWeek  !== mon)   localStorage.setItem('todo-reset-week',  mon);
  if (lastMonth !== month) localStorage.setItem('todo-reset-month', month);

  if (changed) saveTodos(todos);
}

applyTodoResets();

/* ── Hatırlatıcı kontrol ── */
function checkTodoReminders() {
  const todos   = loadTodos();
  const now     = Date.now();
  let changed   = false;
  todos.forEach(t => {
    if (!t.reminder || t.done || t.reminderFired) return;
    if (now >= new Date(t.reminder).getTime()) {
      t.reminderFired = true;
      changed = true;
      showToast(`Hatırlatıcı: ${t.text}`, 'default', 8000);
    }
  });
  if (changed) saveTodos(todos);
}
// Sayfa açılışında hemen + her dakika
checkTodoReminders();
setInterval(checkTodoReminders, 60000);

/* ── Etiketler ── */
const RECURRENCE_LABEL = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık', once:'Tek Seferlik' };
const RECURRENCE_CLASS = { daily:'daily', weekly:'weekly', monthly:'monthly', once:'' };

function formatReminderShort(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' })
    + ' ' + d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
}

/* ════════════════════════════════════════
   SOL SÜTUN WİDGET
   ════════════════════════════════════════ */
function renderTodoWidget() {
  const body = document.getElementById('todo-widget-body');
  if (!body) return;

  const todos    = loadTodos();
  const highPrio = todos.filter(t => t.priority === 'high' && !t.done && !t.hidden);

  if (highPrio.length === 0) {
    body.innerHTML = `<div class="todo-widget-empty">Yüksek öncelikli görev yok.</div>`;
  } else {
    body.innerHTML = `
      <ul class="todo-widget-list">
        ${highPrio.slice(0, 5).map(t => `
          <li class="todo-widget-item${t.done ? ' done' : ''}" data-id="${t.id}">
            <button class="todo-widget-check${t.done ? ' done' : ''}" data-id="${t.id}">
              ${t.done ? getIcon('check', 9) : ''}
            </button>
            <span class="todo-widget-flag">${getIcon('flag', 11)}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.text)}</span>
          </li>
        `).join('')}
      </ul>
      <div class="todo-widget-footer">${highPrio.length} yüksek öncelikli görev</div>
    `;
  }

  body.querySelectorAll('.todo-widget-check').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const todos = loadTodos();
      const t = todos.find(x => x.id === btn.dataset.id);
      if (t) { t.done = !t.done; saveTodos(todos); }
      renderTodoWidget();
      renderTodoList();
    });
  });
}

/* ════════════════════════════════════════
   ORTA PANEL
   ════════════════════════════════════════ */
let todoActiveTab    = 'all';
let todoActiveFilter = 'all';
let todoFormMode     = null;   // null | 'add' | 'edit'
let todoEditId       = null;

function openTodoModule() {
  const center = document.getElementById('col-center');
  if (!center) return;
  center.innerHTML = `<div id="module-todo"></div>`;
  renderTodoModule();
}

function renderTodoModule() {
  const wrap = document.getElementById('module-todo');
  if (!wrap) return;

  const tabs = [
    { id:'all',     label:'Tümü' },
    { id:'daily',   label:'Günlük' },
    { id:'weekly',  label:'Haftalık' },
    { id:'monthly', label:'Aylık' },
    { id:'once',    label:'Tek Seferlik' },
  ];

  wrap.innerHTML = `
    <div class="todo-topbar">
      <span style="color:var(--accent);display:flex">${getIcon('check', 20)}</span>
      <span class="todo-topbar-title">Yapılacaklar</span>
      <button class="todo-add-btn" id="todo-open-form-btn" title="Görev Ekle">
        ${getIcon('plus', 16)}
      </button>
    </div>

    <div class="todo-tab-bar">
      ${tabs.map(t => `
        <button class="todo-tab${todoActiveTab === t.id ? ' active' : ''}" data-tab="${t.id}">
          ${t.label}
        </button>
      `).join('')}
    </div>

    <div id="todo-form-wrap"></div>

    <div class="todo-filter-bar">
      <span style="color:var(--ink-faint);display:flex;align-items:center">${getIcon('filter', 13)}</span>
      <button class="todo-filter-btn${todoActiveFilter==='all'    ?' active':''}" data-filter="all">Hepsi</button>
      <button class="todo-filter-btn${todoActiveFilter==='active' ?' active':''}" data-filter="active">Aktif</button>
      <button class="todo-filter-btn${todoActiveFilter==='done'   ?' active':''}" data-filter="done">Tamamlanan</button>
      <button class="todo-filter-btn${todoActiveFilter==='high'   ?' active':''}" data-filter="high">
        ${getIcon('flag', 11)} Yüksek
      </button>
    </div>

    <div class="todo-main">
      <div class="todo-list-wrap">
        <ul class="todo-list" id="todo-list"></ul>
      </div>
      <div class="todo-bottom-bar">
<button class="todo-clear-done-btn" id="todo-clear-done">
          ${getIcon('trash', 13)} Tamamlananları Sil
        </button>
      </div>
    </div>
  `;

  renderTodoList();
  bindTodoModuleEvents(wrap);
  if (todoFormMode === 'add') openTodoForm();
  if (todoFormMode === 'edit' && todoEditId) openTodoForm(todoEditId);
}

function bindTodoModuleEvents(wrap) {
  wrap.querySelectorAll('.todo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      todoActiveTab  = tab.dataset.tab;
      todoFormMode   = null;
      todoEditId     = null;
      renderTodoModule();
    });
  });

  wrap.querySelectorAll('.todo-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      todoActiveFilter = btn.dataset.filter;
      renderTodoList();
      wrap.querySelectorAll('.todo-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  wrap.querySelector('#todo-open-form-btn')?.addEventListener('click', () => {
    if (todoFormMode === 'add') {
      todoFormMode = null;
      closeTodoForm();
    } else {
      todoFormMode = 'add';
      todoEditId   = null;
      openTodoForm();
    }
  });

  wrap.querySelector('#todo-clear-done')?.addEventListener('click', async () => {
    const todos = loadTodos();
    const done  = todos.filter(t => t.done);
    if (!done.length) { showToast('Tamamlanan görev yok.'); return; }

    const ok = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Tamamlananları Sil / Gizle',
      message: 'Tek seferlik görevler silinir. Günlük/haftalık/aylık görevler bir sonraki döneme kadar gizlenir.',
      confirmText: 'Devam Et',
      cancelText: 'Vazgeç',
      danger: false,
    });
    if (!ok) return;

    const updated = todos.map(t => {
      if (!t.done) return t;
      if (t.recurrence === 'once') return null; // sil
      return { ...t, hidden: true };            // gizle
    }).filter(Boolean);

    saveTodos(updated);
    renderTodoList();
    renderTodoWidget();
  });
}

/* ── Liste ── */
function renderTodoList() {
  const listEl = document.getElementById('todo-list');
  if (!listEl) return;

  let todos = loadTodos();

  // Gizli görevleri çıkar (filtre 'done' değilse)
  if (todoActiveFilter !== 'done') {
    todos = todos.filter(t => !t.hidden);
  }

  // Sekme filtresi
  if (todoActiveTab !== 'all') {
    todos = todos.filter(t => t.recurrence === todoActiveTab);
  }

  // Durum filtresi
  if (todoActiveFilter === 'active') todos = todos.filter(t => !t.done);
  if (todoActiveFilter === 'done')   todos = todos.filter(t =>  t.done);
  if (todoActiveFilter === 'high')   todos = todos.filter(t => t.priority === 'high');

  // Sıralama
  todos.sort((a, b) => {
    if (a.done !== b.done)         return a.done ? 1 : -1;
    if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
    return b.createdAt - a.createdAt;
  });

  if (todos.length === 0) {
    listEl.innerHTML = `<li class="todo-empty">Görev yok.</li>`;
    return;
  }

  listEl.innerHTML = todos.map(t => `
    <li class="todo-item${t.priority==='high'?' high':''}${t.done?' done':''}" data-id="${t.id}">
      <button class="todo-item-check${t.done?' done':''}" data-id="${t.id}">
        ${t.done ? getIcon('check', 11) : ''}
      </button>
      <div class="todo-item-body">
        <div class="todo-item-text">${escapeHtml(t.text)}</div>
        <div class="todo-item-meta">
          ${t.priority==='high' ? `<span class="todo-meta-badge high">${getIcon('flag',10)} Yüksek</span>` : ''}
          ${t.recurrence!=='once' ? `<span class="todo-meta-badge ${RECURRENCE_CLASS[t.recurrence]}">${getIcon('repeat',10)} ${RECURRENCE_LABEL[t.recurrence]}</span>` : ''}
          ${t.reminder ? `<span class="todo-meta-tag">${getIcon('bell',11)} ${formatReminderShort(t.reminder)}</span>` : ''}
        </div>
      </div>
      <div class="todo-item-actions">
        <button class="todo-item-action-btn reminder" data-id="${t.id}" title="${t.reminder ? 'Hatırlatıcıyı düzenle' : 'Hatırlatıcı ekle'}">
          ${getIcon('bell', 12)}
        </button>
        <button class="todo-item-action-btn edit" data-id="${t.id}" title="Düzenle">
          ${getIcon('edit', 12)}
        </button>
        <button class="todo-item-action-btn del" data-id="${t.id}" title="Sil">
          ${getIcon('trash', 12)}
        </button>
      </div>
    </li>
  `).join('');

  listEl.querySelectorAll('.todo-item-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const todos = loadTodos();
      const t = todos.find(x => x.id === btn.dataset.id);
      if (!t) return;
      t.done = !t.done;
      if (t.done && t.reminder) t.reminderFired = true;
      saveTodos(todos);
      renderTodoList();
      renderTodoWidget();
    });
  });

  listEl.querySelectorAll('.todo-item-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      todoFormMode = 'edit';
      todoEditId   = btn.dataset.id;
      openTodoForm(btn.dataset.id);
    });
  });

  listEl.querySelectorAll('.todo-item-action-btn.reminder').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showTodoReminderPicker(btn.dataset.id);
    });
  });

  listEl.querySelectorAll('.todo-item-action-btn.del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await showDialog({
        icon: getIcon('trash', 28),
        title: 'Görevi Sil',
        message: 'Bu görevi silmek istediğinden emin misin?',
        confirmText: 'Sil', cancelText: 'Vazgeç', danger: true,
      });
      if (!ok) return;
      saveTodos(loadTodos().filter(x => x.id !== btn.dataset.id));
      renderTodoList();
      renderTodoWidget();
    });
  });
}

/* ── Form (ekleme + düzenleme) ── */
function openTodoForm(editId) {
  // Önce eski formu temizle
  document.getElementById('todo-form-wrap')?.querySelectorAll('*') && null;
  const wrap = document.getElementById('todo-form-wrap');
  if (!wrap) { console.warn('todo-form-wrap bulunamadı'); return; }

  const isEdit   = !!editId;
  const existing = isEdit ? loadTodos().find(t => t.id === editId) : null;

  const defRecurrence = existing?.recurrence || (todoActiveTab !== 'all' ? todoActiveTab : 'once');
  const defPriority   = existing?.priority   || 'normal';
  const defText       = existing?.text       || '';
  const defReminder   = existing?.reminder   || null;

  wrap.innerHTML = `
    <div class="todo-form">

      <div class="todo-form-row">
        <span class="todo-form-label">${getIcon('check', 13)} Görev</span>
        <input class="todo-add-input" id="tf-text"
          placeholder="Görev adını gir…" maxlength="200"
          value="${escapeHtml(defText)}" style="flex:1"/>
      </div>

      <div class="todo-form-row">
        <span class="todo-form-label">${getIcon('repeat', 13)} Tür</span>
        <select class="todo-form-select" id="tf-recurrence">
          <option value="once"    ${defRecurrence==='once'    ?'selected':''}>Tek Seferlik</option>
          <option value="daily"   ${defRecurrence==='daily'   ?'selected':''}>Günlük</option>
          <option value="weekly"  ${defRecurrence==='weekly'  ?'selected':''}>Haftalık</option>
          <option value="monthly" ${defRecurrence==='monthly' ?'selected':''}>Aylık</option>
        </select>
      </div>

      <div class="todo-form-row">
        <span class="todo-form-label">${getIcon('flag', 13)} Öncelik</span>
        <select class="todo-form-select" id="tf-priority">
          <option value="normal" ${defPriority==='normal'?'selected':''}>Normal</option>
          <option value="high"   ${defPriority==='high'  ?'selected':''}>Yüksek</option>
        </select>
      </div>


      <div class="todo-form-actions">
        <button type="button" class="todo-form-cancel" id="tf-cancel">${getIcon('x', 13)} İptal</button>
        <button type="button" class="todo-form-submit" id="tf-submit">
          ${isEdit ? getIcon('check', 14) + ' Kaydet' : getIcon('plus', 14) + ' Ekle'}
        </button>
      </div>

    </div>
  `;

  // Basit event binding
  wrap.querySelector('#tf-cancel').addEventListener('click', closeTodoForm);

  wrap.querySelector('#tf-text').addEventListener('keydown', e => {
    if (e.key === 'Enter')  wrap.querySelector('#tf-submit').click();
    if (e.key === 'Escape') closeTodoForm();
  });

  wrap.querySelector('#tf-submit').addEventListener('click', () => {
    const text = wrap.querySelector('#tf-text').value.trim();
    if (!text) { wrap.querySelector('#tf-text').focus(); return; }
    const recurrence = wrap.querySelector('#tf-recurrence').value;
    const priority   = wrap.querySelector('#tf-priority').value;
    const todos = loadTodos();
    if (isEdit) {
      const t = todos.find(x => x.id === editId);
      if (t) { t.text = text; t.recurrence = recurrence; t.priority = priority; }
    } else {
      todos.unshift({
        id: newTodoId(), text, recurrence, priority,
        done: false, hidden: false, reminder: null, reminderFired: false,
        createdAt: Date.now(),
      });
    }
    saveTodos(todos);
    todoFormMode = null; todoEditId = null;
    closeTodoForm();
    renderTodoList();
    renderTodoWidget();
  });

  setTimeout(() => wrap.querySelector('#tf-text')?.focus(), 30);
}

async function showTodoReminderPicker(todoId) {
  const todos = loadTodos();
  const todo  = todos.find(t => t.id === todoId);
  if (!todo) return;

  const result = await showDatePicker({
    title:       'Hatırlatıcı — ' + (todo.text.length > 40 ? todo.text.slice(0,37)+'…' : todo.text),
    withTime:    true,
    defaultDate: todo.reminder ? new Date(todo.reminder) : null,
    minDate:     new Date(),
    optional:    true,
  });

  if (result === undefined) return;

  todo.reminder      = result ? result.toISOString() : null;
  todo.reminderFired = false;
  saveTodos(todos);
  renderTodoList();

  if (result) showToast('Hatırlatıcı ayarlandı: ' + formatReminderShort(todo.reminder), 'success');
  else        showToast('Hatırlatıcı kaldırıldı.');
}

function closeTodoForm() {
  todoFormMode = null;
  todoEditId   = null;
  const wrap = document.getElementById('todo-form-wrap');
  if (wrap) wrap.innerHTML = '';
}