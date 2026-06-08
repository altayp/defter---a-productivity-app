/* ═══════════════════════════════════════
   habits.js — Alışkanlık Takibi
   ═══════════════════════════════════════ */

/* Veri modeli:
   habit: { id, name, color, createdAt, log: { 'YYYY-MM-DD': true } }
*/
function loadHabits() {
  try { return JSON.parse(localStorage.getItem('habits-v3') || '[]'); }
  catch { return []; }
}
function saveHabits(h) { localStorage.setItem('habits-v3', JSON.stringify(h)); }
function newHabitId() { return 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

const HABIT_COLORS = ['#5a9e6f', '#4a90c4', '#c45a5a', '#9a70c4', '#c8902a', '#e0853a', '#3aa8a0'];

/* Tarih anahtarı (yerel, YYYY-MM-DD) */
function dateKey(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
}
function todayKey() { return dateKey(new Date()); }

/* Streak: bugünden geriye kesintisiz işaretli gün sayısı */
function habitStreak(habit) {
  let streak = 0;
  const d = new Date();
  // Bugün işaretli değilse dünden başla (streak bozulmamış sayılır)
  if (!habit.log[dateKey(d)]) d.setDate(d.getDate() - 1);
  while (habit.log[dateKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* Toplam işaretli gün */
function habitTotal(habit) {
  return Object.values(habit.log).filter(Boolean).length;
}

/* Son 30 günde tamamlanma yüzdesi */
function habitRate(habit) {
  let done = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    if (habit.log[dateKey(d)]) done++;
    d.setDate(d.getDate() - 1);
  }
  return Math.round((done / 30) * 100);
}

function toggleHabitDay(id, key) {
  const habits = loadHabits();
  const h = habits.find(x => x.id === id);
  if (!h) return;
  if (h.log[key]) delete h.log[key];
  else h.log[key] = true;
  saveHabits(habits);
}

/* ════════════════════════════════════════
   WİDGET
   ════════════════════════════════════════ */
function renderHabitsWidget() {
  const body = document.getElementById('habits-widget-body');
  if (!body) return;

  const habits = loadHabits();
  if (!habits.length) {
    body.innerHTML = `<div class="habits-widget-empty">Henüz alışkanlık yok.</div>`;
    return;
  }

  const tk = todayKey();
  body.innerHTML = `
    <div class="habits-widget-list">
      ${habits.map(h => {
        const done = !!h.log[tk];
        const streak = habitStreak(h);
        return `
          <div class="habits-widget-item">
            <span class="habits-widget-check${done ? ' done' : ''}" data-id="${h.id}">${getIcon('check', 13)}</span>
            <span class="habits-widget-name${done ? ' done' : ''}">${escapeHtml(h.name)}</span>
            ${streak > 0 ? `<span class="habits-widget-streak">${getIcon('flame', 11)} ${streak}</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  body.querySelectorAll('.habits-widget-check').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      toggleHabitDay(el.dataset.id, tk);
      renderHabitsWidget();
      // Açık modül varsa sadece o kartı güncelle
      if (document.querySelector(`.habit-card[data-id="${el.dataset.id}"]`)) updateHabitCard(el.dataset.id);
    });
  });
}

/* ════════════════════════════════════════
   ORTA PANEL
   ════════════════════════════════════════ */
function openHabitsModule() {
  renderHabitsModule();
}

function renderHabitsModule() {
  const center = document.getElementById('col-center');
  if (!center) return;

  const habits = loadHabits();

  center.innerHTML = `
    <div id="module-habits">
      <div class="habits-topbar">
        <span style="color:var(--accent);display:flex">${getIcon('habit', 20)}</span>
        <span class="habits-topbar-title">Alışkanlıklar</span>
        <button class="habits-add-btn" id="habits-add">${getIcon('plus', 13)} Yeni Alışkanlık</button>
      </div>
      <div class="habits-body" id="habits-body">
        ${habits.length
          ? habits.map(h => habitCardHTML(h)).join('')
          : `<div class="habits-empty-state">Henüz alışkanlık eklemedin.<br>Yeni bir tane ekleyerek başla.</div>`}
      </div>
    </div>
  `;

  center.querySelector('#habits-add').addEventListener('click', () => openHabitForm());
  bindHabitCards(center);
}

function habitCardHTML(h) {
  const tk = todayKey();
  const doneToday = !!h.log[tk];
  const streak = habitStreak(h);

  // Son 30 gün (eski → yeni)
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 29);
  for (let i = 0; i < 30; i++) {
    const k = dateKey(d);
    days.push({ key: k, done: !!h.log[k], today: k === tk });
    d.setDate(d.getDate() + 1);
  }

  return `
    <div class="habit-card" data-id="${h.id}">
      <div class="habit-card-head">
        <span class="habit-color-dot" style="background:${h.color}"></span>
        <span class="habit-card-name">${escapeHtml(h.name)}</span>
        ${streak > 0 ? `<span class="habit-card-streak">${getIcon('flame', 14)} ${streak} gün</span>` : ''}
        <button class="habit-card-menu" data-id="${h.id}" title="Seçenekler">${getIcon('dots', 16)}</button>
      </div>

      <div class="habit-today-row">
        <span class="habit-today-check${doneToday ? ' done' : ''}" data-id="${h.id}" data-key="${tk}">${getIcon('check', 16)}</span>
        <span class="habit-today-label">${doneToday ? 'Bugün tamamlandı' : 'Bugün için işaretle'}</span>
      </div>

      <div class="habit-heatmap">
        ${days.map(day => `
          <span class="habit-day${day.done ? ' done' : ''}${day.today ? ' today' : ''}"
            data-id="${h.id}" data-key="${day.key}"
            style="${day.done ? `background:${h.color};` : ''}"
            title="${day.key}"></span>
        `).join('')}
      </div>

      <div class="habit-stats">
        <span class="habit-stat"><b>${habitTotal(h)}</b>gün toplam</span>
        <span class="habit-stat"><b>${streak}</b>gün seri</span>
        <span class="habit-stat"><b>%${habitRate(h)}</b>son 30 gün</span>
      </div>
    </div>
  `;
}

function bindHabitCards(center) {
  // Bugün işaretle — kısmi güncelleme
  center.querySelectorAll('.habit-today-check').forEach(el => {
    el.addEventListener('click', () => {
      toggleHabitDay(el.dataset.id, el.dataset.key);
      updateHabitCard(el.dataset.id);
      renderHabitsWidget();
    });
  });

  // Isı haritası günleri — kısmi güncelleme
  center.querySelectorAll('.habit-day:not(.future)').forEach(el => {
    el.addEventListener('click', () => {
      toggleHabitDay(el.dataset.id, el.dataset.key);
      updateHabitCard(el.dataset.id);
      renderHabitsWidget();
    });
  });

  // Kart menüsü
  center.querySelectorAll('.habit-card-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showHabitMenu(e.clientX, e.clientY, btn.dataset.id);
    });
  });
}

/* Tek bir kartı yeniden çiz (tam render yapmadan) */
function updateHabitCard(id) {
  const h = loadHabits().find(x => x.id === id);
  const oldCard = document.querySelector(`.habit-card[data-id="${id}"]`);
  if (!h || !oldCard) return;
  const temp = document.createElement('div');
  temp.innerHTML = habitCardHTML(h);
  const newCard = temp.firstElementChild;
  oldCard.replaceWith(newCard);
  // Yeni karta event'leri bağla
  bindSingleHabitCard(newCard, h);
}

function bindSingleHabitCard(card, h) {
  card.querySelector('.habit-today-check')?.addEventListener('click', function() {
    toggleHabitDay(this.dataset.id, this.dataset.key);
    updateHabitCard(this.dataset.id);
    renderHabitsWidget();
  });
  card.querySelectorAll('.habit-day:not(.future)').forEach(el => {
    el.addEventListener('click', () => {
      toggleHabitDay(el.dataset.id, el.dataset.key);
      updateHabitCard(el.dataset.id);
      renderHabitsWidget();
    });
  });
  card.querySelector('.habit-card-menu')?.addEventListener('click', e => {
    e.stopPropagation();
    showHabitMenu(e.clientX, e.clientY, h.id);
  });
}

function showHabitMenu(x, y, id) {
  document.getElementById('habit-ctx')?.remove();
  const menu = document.createElement('div');
  menu.className = 'notes-ctx-menu';
  menu.id = 'habit-ctx';
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.innerHTML = `
    <button class="notes-ctx-item" id="hm-edit">${getIcon('edit', 14)} Düzenle</button>
    <div class="notes-ctx-sep"></div>
    <button class="notes-ctx-item" id="hm-del">${getIcon('trash', 14)} Sil</button>
  `;
  document.body.appendChild(menu);

  menu.querySelector('#hm-edit').addEventListener('click', () => {
    menu.remove();
    const h = loadHabits().find(x => x.id === id);
    if (h) openHabitForm(h);
  });
  menu.querySelector('#hm-del').addEventListener('click', async () => {
    menu.remove();
    const ok = await showDialog({
      icon: getIcon('trash', 28), title: 'Alışkanlığı Sil',
      message: 'Bu alışkanlık ve tüm geçmişi silinecek.',
      confirmText: 'Sil', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    saveHabits(loadHabits().filter(x => x.id !== id));
    renderHabitsModule();
    renderHabitsWidget();
  });

  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
}

/* ── Form (yeni / düzenle) ── */
function openHabitForm(existing) {
  let selectedColor = existing ? existing.color : HABIT_COLORS[0];

  const overlay = document.createElement('div');
  overlay.className = 'habits-form-overlay';
  overlay.id = 'habits-form-overlay';
  overlay.innerHTML = `
    <div class="habits-form-panel">
      <div class="habits-form-title">${getIcon('habit', 20)} ${existing ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}</div>
      <div class="notes-form-label">Alışkanlık adı</div>
      <input class="notes-form-input" id="hf-name" placeholder="Örn. Su iç, Kitap oku, Spor yap…" maxlength="40" value="${existing ? escapeHtml(existing.name) : ''}"/>
      <div class="notes-form-label">Renk</div>
      <div class="habits-color-row" id="hf-colors">
        ${HABIT_COLORS.map(c => `<span class="habits-color-opt${c===selectedColor?' active':''}" data-color="${c}" style="background:${c}"></span>`).join('')}
      </div>
      <div class="notes-form-actions">
        <button class="notes-tool-btn" id="hf-cancel">İptal</button>
        <button class="notes-tool-btn" id="hf-save" style="background:var(--accent);color:#fff;border-color:var(--accent)">${existing ? 'Kaydet' : 'Ekle'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#hf-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  setTimeout(() => overlay.querySelector('#hf-name').focus(), 50);

  overlay.querySelectorAll('.habits-color-opt').forEach(c => {
    c.addEventListener('click', () => {
      overlay.querySelectorAll('.habits-color-opt').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      selectedColor = c.dataset.color;
    });
  });

  overlay.querySelector('#hf-save').addEventListener('click', () => {
    const name = overlay.querySelector('#hf-name').value.trim();
    if (!name) { overlay.querySelector('#hf-name').focus(); return; }
    const habits = loadHabits();
    if (existing) {
      const h = habits.find(x => x.id === existing.id);
      if (h) { h.name = name; h.color = selectedColor; }
    } else {
      habits.push({
        id: newHabitId(), name, color: selectedColor,
        createdAt: new Date().toISOString(), log: {},
      });
    }
    saveHabits(habits);
    close();
    renderHabitsModule();
    renderHabitsWidget();
  });
}