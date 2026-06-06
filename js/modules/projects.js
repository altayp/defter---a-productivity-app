/* ═══════════════════════════════════════
   projects.js
   ═══════════════════════════════════════ */

/* ── Veri ──
   proje: { id, name, deadline(iso|null), columns: [{id,title,cards:[{id,title,note,done}]}] }
*/
function loadProjects() {
  try { return JSON.parse(localStorage.getItem('projects-v3') || '[]'); }
  catch { return []; }
}
function saveProjects(p) { localStorage.setItem('projects-v3', JSON.stringify(p)); }
function newProjId()  { return 'pr_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }
function newColId()   { return 'col_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }
function newCardId()  { return 'cd_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

let draggedCard = null;

/* ── Seçilebilir proje ikonları ── */
const PROJECT_ICONS = ['proj_folder', 'proj_work', 'proj_code', 'proj_web', 'proj_pen', 'proj_graph', 'proj_person', 'proj_scissors'];

/* ── İlerleme hesabı ── */
function projectProgress(proj) {
  let total = 0, done = 0;
  (proj.columns || []).forEach(col => {
    (col.cards || []).forEach(card => {
      total++;
      if (card.done) done++;
    });
  });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/* ── Deadline formatı ── */
function formatDeadline(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' });
}
function daysUntil(iso) {
  if (!iso) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const d   = new Date(iso); d.setHours(0,0,0,0);
  return Math.round((d - now) / 86400000);
}

/* ════════════════════════════════════════
   SAĞ SÜTUN WİDGET
   ════════════════════════════════════════ */
let widgetSelectedProj = null;

function renderProjectsWidget() {
  const body = document.getElementById('projects-widget-body');
  if (!body) return;

  const projects = loadProjects();
  if (projects.length === 0) {
    body.innerHTML = `<div class="proj-widget-empty">Henüz proje yok.</div>`;
    return;
  }

  // En yakın deadline'lı projeyi varsayılan seç
  if (!widgetSelectedProj || !projects.find(p => p.id === widgetSelectedProj)) {
    const withDeadline = projects.filter(p => p.deadline).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
    widgetSelectedProj = withDeadline.length ? withDeadline[0].id : projects[0].id;
  }

  const proj = projects.find(p => p.id === widgetSelectedProj);
  const prog = projectProgress(proj);
  const dleft = daysUntil(proj.deadline);

  body.innerHTML = `
    <select class="proj-widget-select" id="proj-widget-select">
      ${projects.map(p => `<option value="${p.id}"${p.id === widgetSelectedProj ? ' selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
    </select>
    <div class="proj-widget-name">${escapeHtml(proj.name)}</div>
    ${proj.deadline ? `
      <div class="proj-widget-deadline${dleft !== null && dleft <= 3 ? ' urgent' : ''}">
        ${getIcon('calendar', 12)} ${formatDeadline(proj.deadline)}
        ${dleft !== null ? `· ${dleft < 0 ? 'geçti' : dleft + ' gün kaldı'}` : ''}
      </div>
    ` : '<div class="proj-widget-deadline">Deadline yok</div>'}
    <div class="proj-widget-progress-label">
      <span>İlerleme</span><span>%${prog}</span>
    </div>
    <div class="proj-widget-progress">
      <div class="proj-widget-progress-fill" style="width:${prog}%"></div>
    </div>
  `;

  body.querySelector('#proj-widget-select').addEventListener('click', e => e.stopPropagation());
  body.querySelector('#proj-widget-select').addEventListener('change', function() {
    widgetSelectedProj = this.value;
    renderProjectsWidget();
  });
}

/* ════════════════════════════════════════
   ORTA PANEL — Klasör Listesi
   ════════════════════════════════════════ */
let openProjectId = null;

function openProjectsModule() {
  openProjectId = null;
  renderProjectsList();
}

function projectIcon(proj, size) {
  const name = proj.icon && PROJECT_ICONS.includes(proj.icon) ? proj.icon : 'proj_folder';
  return getIcon(name, size || 48);
}

function renderProjectsList() {
  const center = document.getElementById('col-center');
  if (!center) return;

  const projects = loadProjects();

  center.innerHTML = `
    <div id="module-projects">
      <div class="proj-topbar">
        <span style="color:var(--accent);display:flex">${getIcon('folder', 20)}</span>
        <span class="proj-topbar-title">Projeler</span>
        <button class="proj-add-btn" id="proj-add-btn">${getIcon('plus', 14)} Yeni Proje</button>
      </div>

      <div class="proj-folder-grid" id="proj-folder-grid">
        ${projects.length === 0
          ? `<div class="proj-empty">Henüz proje yok. Yeni bir proje oluştur.</div>`
          : projects.map(p => {
              const prog  = projectProgress(p);
              const dleft = daysUntil(p.deadline);
              return `
                <div class="proj-folder" data-id="${p.id}">
                  <div class="proj-folder-icon">${projectIcon(p, 52)}</div>
                  <div class="proj-folder-name">${escapeHtml(p.name)}</div>
                  ${p.deadline ? `
                    <div class="proj-folder-deadline${dleft !== null && dleft <= 3 ? ' urgent' : ''}">
                      ${getIcon('calendar', 11)} ${dleft < 0 ? 'Süresi geçti' : dleft + ' gün'}
                    </div>` : `<div class="proj-folder-meta">Deadline yok</div>`}
                  <div class="proj-folder-progress">
                    <div class="proj-folder-progress-fill" style="width:${prog}%"></div>
                  </div>
                  <div class="proj-folder-meta">%${prog} tamamlandı</div>
                </div>
              `;
            }).join('')}
      </div>
    </div>
  `;

  center.querySelector('#proj-add-btn').addEventListener('click', addNewProject);
  center.querySelectorAll('.proj-folder').forEach(f => {
    f.addEventListener('click', () => openProjectBoard(f.dataset.id));
  });
}

async function addNewProject() {
  const name = await showDialog({
    icon: getIcon('folder', 28),
    title: 'Yeni Proje',
    message: 'Proje adını gir:',
    input: true,
    inputPlaceholder: 'Proje adı…',
    confirmText: 'Oluştur',
    cancelText: 'İptal',
  });
  if (!name) return;

  const deadline = await showDatePicker({
    title: 'Bitiş Tarihi (opsiyonel)',
    withTime: false,
    minDate: new Date(),
    optional: true,
  });

  const projects = loadProjects();
  projects.push({
    id: newProjId(),
    name: name.trim(),
    deadline: deadline ? deadline.toISOString() : null,
    icon: 'proj_folder',
    columns: [],
  });
  saveProjects(projects);
  renderProjectsList();
  renderProjectsWidget();
}

/* ════════════════════════════════════════
   PROJE DETAY — Trello Board
   ════════════════════════════════════════ */
function openProjectBoard(projId) {
  openProjectId = projId;
  renderProjectBoard();
}

function renderProjectBoard() {
  const center = document.getElementById('col-center');
  if (!center) return;

  const projects = loadProjects();
  const proj = projects.find(p => p.id === openProjectId);
  if (!proj) { renderProjectsList(); return; }

  const dleft = daysUntil(proj.deadline);

  center.innerHTML = `
    <div id="module-projects">
      <div class="proj-board-topbar">
        <button class="proj-board-back" id="proj-back-btn">${getIcon('chevronup', 14)} Projeler</button>
        <span class="proj-board-title" id="proj-board-title" contenteditable="true">${escapeHtml(proj.name)}</span>
        ${proj.deadline ? `
          <span class="proj-board-deadline${dleft !== null && dleft <= 3 ? ' urgent' : ''}" style="${dleft !== null && dleft <= 3 ? 'color:#e05a4e' : ''}">
            ${getIcon('calendar', 13)} ${formatDeadline(proj.deadline)}
          </span>` : ''}
        <button class="proj-board-action" id="proj-icon-btn" title="İkon değiştir">${projectIcon(proj, 16)}</button>
        <button class="proj-board-action" id="proj-deadline-btn" title="Bitiş tarihi">${getIcon('calendar', 15)}</button>
        <button class="proj-board-action del" id="proj-del-btn" title="Projeyi sil">${getIcon('trash', 15)}</button>
      </div>

      <div class="proj-board" id="proj-board">
        ${(proj.columns || []).map(col => renderColumn(col)).join('')}
        <button class="proj-add-column" id="proj-add-column">${getIcon('plus', 16)} Sütun Ekle</button>
      </div>
    </div>
  `;

  bindBoardEvents(proj);
}

function renderColumn(col) {
  const cardCount = (col.cards || []).length;
  const doneCount = (col.cards || []).filter(c => c.done).length;
  return `
    <div class="proj-column" data-col="${col.id}">
      <div class="proj-column-header">
        <span class="proj-column-title" contenteditable="true" data-col="${col.id}">${escapeHtml(col.title)}</span>
        <span class="proj-column-count">${doneCount}/${cardCount}</span>
        <button class="proj-column-del" data-col="${col.id}" title="Sütunu sil">${getIcon('x', 13)}</button>
      </div>
      <div class="proj-cards" data-col="${col.id}">
        ${(col.cards || []).map(card => renderCard(card, col.id)).join('')}
      </div>
      <button class="proj-card-add" data-col="${col.id}">${getIcon('plus', 13)} Kart Ekle</button>
    </div>
  `;
}

function renderCard(card, colId) {
  const items   = card.items || [];
  const checked = items.filter(i => i.checked).length;
  const pct     = items.length ? Math.round(checked / items.length * 100) : 0;

  return `
    <div class="proj-card${card.done ? ' done' : ''}" draggable="true" data-card="${card.id}" data-col="${colId}">
      <div class="proj-card-top">
        <button class="proj-card-check" data-card="${card.id}" data-col="${colId}">
          ${card.done ? getIcon('check', 10) : ''}
        </button>
        <span class="proj-card-title" contenteditable="true" data-card="${card.id}" data-col="${colId}">${escapeHtml(card.title)}</span>
        <button class="proj-card-del" data-card="${card.id}" data-col="${colId}" title="Sil">${getIcon('trash', 12)}</button>
      </div>
      ${card.note ? `<div class="proj-card-note-preview">${escapeHtml(card.note)}</div>` : ''}
      ${items.length ? `
        <div class="proj-card-checklist-mini">
          ${getIcon('check', 11)}
          <span>${checked}/${items.length}</span>
          <div class="proj-card-mini-bar"><div class="proj-card-mini-fill" style="width:${pct}%"></div></div>
        </div>
      ` : ''}
    </div>
  `;
}

/* ── İkon seçici ── */
function openIconPicker(projId) {
  const overlay = document.createElement('div');
  overlay.className = 'proj-card-detail-overlay';
  overlay.id = 'proj-icon-picker';

  const projects = loadProjects();
  const proj = projects.find(p => p.id === projId);
  const current = proj.icon || 'proj_folder';

  overlay.innerHTML = `
    <div class="proj-detail-panel" style="width:360px">
      <div class="proj-detail-header">
        <span class="proj-detail-title" style="font-size:20px">İkon Seç</span>
        <button class="proj-board-action" id="ip-close">${getIcon('x', 15)}</button>
      </div>
      <div class="proj-icon-grid">
        ${PROJECT_ICONS.map(name => `
          <button class="proj-icon-option${name === current ? ' active' : ''}" data-icon="${name}">
            ${getIcon(name, 30)}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#ip-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelectorAll('.proj-icon-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const projects = loadProjects();
      const p = projects.find(x => x.id === projId);
      p.icon = btn.dataset.icon;
      saveProjects(projects);
      close();
      renderProjectBoard();
      renderProjectsWidget();
    });
  });
}

/* ── Kart detay paneli (overlay) ── */
function openCardDetail(colId, cardId) {
  const projects = loadProjects();
  const p   = projects.find(x => x.id === openProjectId);
  const col = p.columns.find(c => c.id === colId);
  const card = col.cards.find(c => c.id === cardId);
  if (!card) return;
  card.items = card.items || [];

  const overlay = document.createElement('div');
  overlay.className = 'proj-card-detail-overlay';
  overlay.id = 'proj-card-detail';

  const renderDetailBody = () => {
    const items   = card.items || [];
    const checked = items.filter(i => i.checked).length;
    const pct     = items.length ? Math.round(checked / items.length * 100) : 0;

    overlay.querySelector('.proj-detail-panel').innerHTML = `
      <div class="proj-detail-header">
        <button class="proj-card-check big${card.done ? ' done' : ''}" id="pd-done">
          ${card.done ? getIcon('check', 13) : ''}
        </button>
        <span class="proj-detail-title" id="pd-title" contenteditable="true">${escapeHtml(card.title)}</span>
        <button class="proj-board-action" id="pd-close">${getIcon('x', 15)}</button>
      </div>

      <div class="proj-detail-section">
        <div class="proj-detail-label">${getIcon('note', 13)} Not</div>
        <div class="proj-detail-note" id="pd-note" contenteditable="true" data-empty="Not ekle…">${escapeHtml(card.note || '')}</div>
      </div>

      <div class="proj-detail-section">
        <div class="proj-detail-label">
          ${getIcon('check', 13)} Kontrol Listesi
          ${items.length ? `<span class="proj-detail-pct">%${pct}</span>` : ''}
        </div>
        ${items.length ? `<div class="proj-detail-checkbar"><div class="proj-detail-checkfill" style="width:${pct}%"></div></div>` : ''}
        <div class="proj-detail-items" id="pd-items">
          ${items.map(item => `
            <div class="proj-detail-item${item.checked ? ' checked' : ''}" data-item="${item.id}">
              <button class="proj-detail-item-check" data-item="${item.id}">${item.checked ? getIcon('check', 10) : ''}</button>
              <span class="proj-detail-item-text" contenteditable="true" data-item="${item.id}">${escapeHtml(item.text)}</span>
              <button class="proj-detail-item-del" data-item="${item.id}">${getIcon('x', 11)}</button>
            </div>
          `).join('')}
        </div>
        <button class="proj-detail-add-item" id="pd-add-item">${getIcon('plus', 12)} Madde ekle</button>
      </div>
    `;
    bindDetailEvents();
  };

  const bindDetailEvents = () => {
    const save = () => { saveProjects(projects); };

    overlay.querySelector('#pd-close').addEventListener('click', closeCardDetail);

    overlay.querySelector('#pd-done').addEventListener('click', () => {
      card.done = !card.done; save(); renderDetailBody();
      updateCardInDOM(colId, card); updateColumnCount(colId); renderProjectsWidget();
    });

    overlay.querySelector('#pd-title').addEventListener('blur', function() {
      card.title = this.textContent.trim() || card.title; save();
      updateCardInDOM(colId, card);
    });

    overlay.querySelector('#pd-note').addEventListener('blur', function() {
      card.note = this.textContent.trim(); save();
      updateCardInDOM(colId, card);
    });

    overlay.querySelector('#pd-add-item').addEventListener('click', () => {
      card.items.push({ id: newCardId(), text: 'Yeni madde', checked: false });
      save(); renderDetailBody();
      setTimeout(() => {
        const texts = overlay.querySelectorAll('.proj-detail-item-text');
        const last = texts[texts.length - 1];
        if (last) { last.focus(); document.execCommand('selectAll', false, null); }
      }, 40);
    });

    overlay.querySelectorAll('.proj-detail-item-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const it = card.items.find(i => i.id === btn.dataset.item);
        if (it) { it.checked = !it.checked; save(); renderDetailBody(); updateCardInDOM(colId, card); renderProjectsWidget(); }
      });
    });

    overlay.querySelectorAll('.proj-detail-item-text').forEach(el => {
      el.addEventListener('blur', () => {
        const it = card.items.find(i => i.id === el.dataset.item);
        if (it) { it.text = el.textContent.trim() || it.text; save(); }
      });
    });

    overlay.querySelectorAll('.proj-detail-item-del').forEach(btn => {
      btn.addEventListener('click', () => {
        card.items = card.items.filter(i => i.id !== btn.dataset.item);
        save(); renderDetailBody(); updateCardInDOM(colId, card); renderProjectsWidget();
      });
    });
  };

  overlay.innerHTML = `<div class="proj-detail-panel"></div>`;
  document.body.appendChild(overlay);
  renderDetailBody();
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCardDetail(); });
  setTimeout(() => overlay.classList.add('show'), 10);
}

function closeCardDetail() {
  const o = document.getElementById('proj-card-detail');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 150); }
}

/* ── Kısmi DOM güncelleme (tam render yok) ── */
function updateCardInDOM(colId, card) {
  const center = document.getElementById('col-center');
  const cardEl = center?.querySelector(`.proj-card[data-card="${card.id}"]`);
  if (cardEl) {
    cardEl.outerHTML = renderCard(card, colId);
    // Yeni elemana event bağla
    const newEl = center.querySelector(`.proj-card[data-card="${card.id}"]`);
    if (newEl) bindSingleCard(newEl);
  }
}

function updateColumnCount(colId) {
  const projects = loadProjects();
  const p   = projects.find(x => x.id === openProjectId);
  const col = p?.columns.find(c => c.id === colId);
  if (!col) return;
  const center = document.getElementById('col-center');
  const countEl = center?.querySelector(`.proj-column[data-col="${colId}"] .proj-column-count`);
  if (countEl) {
    const done = col.cards.filter(c => c.done).length;
    countEl.textContent = `${done}/${col.cards.length}`;
  }
}

function bindSingleCard(cardEl) {
  const colId  = cardEl.dataset.col;
  const cardId = cardEl.dataset.card;

  cardEl.querySelector('.proj-card-check')?.addEventListener('click', e => {
    e.stopPropagation();
    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    const col = p.columns.find(c => c.id === colId);
    const card = col.cards.find(c => c.id === cardId);
    if (card) {
      card.done = !card.done; saveProjects(projects);
      updateCardInDOM(colId, card); updateColumnCount(colId); renderProjectsWidget();
    }
  });

  cardEl.querySelector('.proj-card-title')?.addEventListener('blur', function() {
    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    const col = p.columns.find(c => c.id === colId);
    const card = col.cards.find(c => c.id === cardId);
    if (card) { card.title = this.textContent.trim() || card.title; saveProjects(projects); }
  });

  cardEl.querySelector('.proj-card-del')?.addEventListener('click', e => {
    e.stopPropagation();
    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    const col = p.columns.find(c => c.id === colId);
    col.cards = col.cards.filter(c => c.id !== cardId);
    saveProjects(projects);
    cardEl.remove();
    updateColumnCount(colId);
    renderProjectsWidget();
  });

  // Karta tıklayınca detay aç (checkbox, başlık, sil hariç)
  cardEl.addEventListener('click', e => {
    if (e.target.closest('.proj-card-check, .proj-card-title, .proj-card-del')) return;
    openCardDetail(colId, cardId);
  });

  // Sürükleme
  cardEl.addEventListener('dragstart', e => {
    draggedCard = { cardId, fromCol: colId };
    cardEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  cardEl.addEventListener('dragend', () => {
    cardEl.classList.remove('dragging');
    document.querySelectorAll('.proj-cards').forEach(c => c.classList.remove('drag-over'));
  });
}

/* ── Board event bağlama ── */
function bindBoardEvents(proj) {
  const center = document.getElementById('col-center');

  // Geri
  center.querySelector('#proj-back-btn').addEventListener('click', () => {
    openProjectId = null;
    renderProjectsList();
    renderProjectsWidget();
  });

  // Proje adı düzenle
  const titleEl = center.querySelector('#proj-board-title');
  titleEl.addEventListener('blur', () => {
    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    if (p) { p.name = titleEl.textContent.trim() || p.name; saveProjects(projects); renderProjectsWidget(); }
  });

  // İkon değiştir
  center.querySelector('#proj-icon-btn').addEventListener('click', () => {
    openIconPicker(openProjectId);
  });

  // Deadline değiştir
  center.querySelector('#proj-deadline-btn').addEventListener('click', async () => {
    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    const result = await showDatePicker({
      title: 'Bitiş Tarihi',
      withTime: false,
      defaultDate: p.deadline ? new Date(p.deadline) : null,
      minDate: new Date(),
      optional: true,
    });
    if (result === undefined) return;
    p.deadline = result ? result.toISOString() : null;
    saveProjects(projects);
    renderProjectBoard();
    renderProjectsWidget();
  });

  // Proje sil
  center.querySelector('#proj-del-btn').addEventListener('click', async () => {
    const ok = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Projeyi Sil',
      message: 'Bu proje ve tüm sütunları/kartları silinecek. Geri alınamaz.',
      confirmText: 'Sil', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    saveProjects(loadProjects().filter(p => p.id !== openProjectId));
    openProjectId = null;
    renderProjectsList();
    renderProjectsWidget();
  });

  // Sütun ekle
  center.querySelector('#proj-add-column').addEventListener('click', async () => {
    const title = await showDialog({
      icon: getIcon('plus', 28),
      title: 'Yeni Sütun',
      message: 'Sütun adını gir:',
      input: true,
      inputPlaceholder: 'Örn. Yapılacak, Devam Eden, Bitti…',
      confirmText: 'Ekle', cancelText: 'İptal',
    });
    if (!title) return;
    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    p.columns = p.columns || [];
    p.columns.push({ id: newColId(), title: title.trim(), cards: [] });
    saveProjects(projects);
    renderProjectBoard();
  });

  // Sütun başlığı düzenle
  center.querySelectorAll('.proj-column-title').forEach(el => {
    el.addEventListener('blur', () => {
      const projects = loadProjects();
      const p = projects.find(x => x.id === openProjectId);
      const col = p.columns.find(c => c.id === el.dataset.col);
      if (col) { col.title = el.textContent.trim() || col.title; saveProjects(projects); }
    });
  });

  // Sütun sil
  center.querySelectorAll('.proj-column-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await showDialog({
        icon: getIcon('trash', 28),
        title: 'Sütunu Sil',
        message: 'Bu sütun ve içindeki tüm kartlar silinecek.',
        confirmText: 'Sil', cancelText: 'Vazgeç', danger: true,
      });
      if (!ok) return;
      const projects = loadProjects();
      const p = projects.find(x => x.id === openProjectId);
      p.columns = p.columns.filter(c => c.id !== btn.dataset.col);
      saveProjects(projects);
      renderProjectBoard();
    });
  });

  // Kart ekle — tam render yapmadan DOM'a ekle
  center.querySelectorAll('.proj-card-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const projects = loadProjects();
      const p = projects.find(x => x.id === openProjectId);
      const col = p.columns.find(c => c.id === btn.dataset.col);
      col.cards = col.cards || [];
      const card = { id: newCardId(), title: 'Yeni kart', note: '', done: false, items: [] };
      col.cards.push(card);
      saveProjects(projects);

      // DOM'a yeni kartı ekle
      const cardsZone = center.querySelector(`.proj-cards[data-col="${btn.dataset.col}"]`);
      if (cardsZone) {
        cardsZone.insertAdjacentHTML('beforeend', renderCard(card, btn.dataset.col));
        const newEl = cardsZone.querySelector(`.proj-card[data-card="${card.id}"]`);
        if (newEl) {
          bindSingleCard(newEl);
          bindDropZone(cardsZone);
          const titleEl = newEl.querySelector('.proj-card-title');
          if (titleEl) { titleEl.focus(); document.execCommand('selectAll', false, null); }
        }
      }
      updateColumnCount(btn.dataset.col);
    });
  });

  // Mevcut kartlara event bağla
  center.querySelectorAll('.proj-card').forEach(bindSingleCard);

  // Sürükle-bırak hedef alanları
  center.querySelectorAll('.proj-cards').forEach(bindDropZone);
}

/* ── Tek bir bırakma alanına event bağla ── */
function bindDropZone(zone) {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (!draggedCard) return;
    const toCol = zone.dataset.col;

    const projects = loadProjects();
    const p = projects.find(x => x.id === openProjectId);
    const fromColumn = p.columns.find(c => c.id === draggedCard.fromCol);
    const toColumn   = p.columns.find(c => c.id === toCol);
    const cardIdx = fromColumn.cards.findIndex(c => c.id === draggedCard.cardId);
    if (cardIdx === -1) return;

    const [card] = fromColumn.cards.splice(cardIdx, 1);
    const afterEl = [...zone.querySelectorAll('.proj-card:not(.dragging)')].find(el => {
      const rect = el.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    if (afterEl) {
      const idx = toColumn.cards.findIndex(c => c.id === afterEl.dataset.card);
      toColumn.cards.splice(idx, 0, card);
    } else {
      toColumn.cards.push(card);
    }

    saveProjects(projects);
    const fromCol = draggedCard.fromCol;
    draggedCard = null;
    // Sürüklemede yeniden render kaçınılmaz ama sadece board içeriğini güncelle
    refreshBoardCards(fromCol, toCol);
    renderProjectsWidget();
  });
}

/* ── Sürükleme sonrası sadece iki sütunu yenile ── */
function refreshBoardCards(colA, colB) {
  const projects = loadProjects();
  const p = projects.find(x => x.id === openProjectId);
  const center = document.getElementById('col-center');
  [colA, colB].forEach(colId => {
    const col = p.columns.find(c => c.id === colId);
    const zone = center?.querySelector(`.proj-cards[data-col="${colId}"]`);
    if (col && zone) {
      zone.innerHTML = (col.cards || []).map(c => renderCard(c, colId)).join('');
      zone.querySelectorAll('.proj-card').forEach(bindSingleCard);
      bindDropZone(zone);
      updateColumnCount(colId);
    }
  });
}

/* ── Dış giriş noktası ── */
function openProjectsModuleEntry() {
  openProjectId ? renderProjectBoard() : renderProjectsList();
}