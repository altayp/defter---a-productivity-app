/* ═══════════════════════════════════════
   calendar.js
   ═══════════════════════════════════════ */

/* ── Türkiye Özel Günleri & Resmi Tatiller ──
   Sabit tarihler her yıl tekrar eder (ay-gün).
   Dini bayramlar yıla göre değiştiğinden açıkça tarih verilir.
*/
const TR_FIXED_HOLIDAYS = [
  { m: 1,  d: 1,  name: 'Yılbaşı' },
  { m: 4,  d: 23, name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { m: 5,  d: 1,  name: 'Emek ve Dayanışma Günü' },
  { m: 5,  d: 19, name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı' },
  { m: 7,  d: 15, name: 'Demokrasi ve Millî Birlik Günü' },
  { m: 8,  d: 30, name: 'Zafer Bayramı' },
  { m: 10, d: 29, name: 'Cumhuriyet Bayramı' },
];

/* Dini bayramlar (değişken) — yıl bazlı tam tarihler */
const TR_RELIGIOUS_HOLIDAYS = [
  // 2025
  { date: '2025-03-30', name: 'Ramazan Bayramı (1. Gün)' },
  { date: '2025-03-31', name: 'Ramazan Bayramı (2. Gün)' },
  { date: '2025-04-01', name: 'Ramazan Bayramı (3. Gün)' },
  { date: '2025-06-06', name: 'Kurban Bayramı (1. Gün)' },
  { date: '2025-06-07', name: 'Kurban Bayramı (2. Gün)' },
  { date: '2025-06-08', name: 'Kurban Bayramı (3. Gün)' },
  { date: '2025-06-09', name: 'Kurban Bayramı (4. Gün)' },
  // 2026
  { date: '2026-03-20', name: 'Ramazan Bayramı (1. Gün)' },
  { date: '2026-03-21', name: 'Ramazan Bayramı (2. Gün)' },
  { date: '2026-03-22', name: 'Ramazan Bayramı (3. Gün)' },
  { date: '2026-05-27', name: 'Kurban Bayramı (1. Gün)' },
  { date: '2026-05-28', name: 'Kurban Bayramı (2. Gün)' },
  { date: '2026-05-29', name: 'Kurban Bayramı (3. Gün)' },
  { date: '2026-05-30', name: 'Kurban Bayramı (4. Gün)' },
  // 2027
  { date: '2027-03-10', name: 'Ramazan Bayramı (1. Gün)' },
  { date: '2027-03-11', name: 'Ramazan Bayramı (2. Gün)' },
  { date: '2027-03-12', name: 'Ramazan Bayramı (3. Gün)' },
  { date: '2027-05-16', name: 'Kurban Bayramı (1. Gün)' },
  { date: '2027-05-17', name: 'Kurban Bayramı (2. Gün)' },
  { date: '2027-05-18', name: 'Kurban Bayramı (3. Gün)' },
  { date: '2027-05-19', name: 'Kurban Bayramı (4. Gün)' },
];

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYNAMES = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

/* Belirli tarihteki özel günü döndür */
function getSpecialDay(year, month, day) {
  // Sabit
  const fixed = TR_FIXED_HOLIDAYS.find(h => h.m === month + 1 && h.d === day);
  if (fixed) return fixed.name;
  // Dini
  const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const rel = TR_RELIGIOUS_HOLIDAYS.find(h => h.date === iso);
  return rel ? rel.name : null;
}

/* O günde deadline/hatırlatıcı var mı? — todo + projeler */
function getDayTasks(year, month, day) {
  const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const tasks = [];

  // Todo hatırlatıcıları
  try {
    const todos = JSON.parse(localStorage.getItem('todos-v3') || '[]');
    todos.forEach(t => {
      if (t.reminder && t.reminder.slice(0,10) === iso && !t.done) {
        tasks.push({ type: 'todo', label: t.text });
      }
    });
  } catch {}

  // Proje deadline'ları
  try {
    const projects = JSON.parse(localStorage.getItem('projects-v3') || '[]');
    projects.forEach(p => {
      if (p.deadline && p.deadline.slice(0,10) === iso) {
        tasks.push({ type: 'project', label: p.name + ' (deadline)' });
      }
    });
  } catch {}

  return tasks;
}

/* ── Hafta hesabı (Pazartesi başlangıç) ── */
function getWeekDays(refDate) {
  const d = new Date(refDate);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // Pzt=0
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

/* ════════════════════════════════════════
   SAĞ SÜTUN WİDGET
   ════════════════════════════════════════ */
let calWidgetMode = 'week'; // 'week' | 'month'

function renderCalendarWidget() {
  const body = document.getElementById('calendar-widget-body');
  if (!body) return;

  const today = new Date();
  const days  = calWidgetMode === 'week'
    ? getWeekDays(today)
    : getMonthDays(today.getFullYear(), today.getMonth());

  const monthLabel = calWidgetMode === 'week'
    ? `${TR_MONTHS[today.getMonth()]} ${today.getFullYear()}`
    : `${TR_MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  let html = `
    <div class="cal-widget-head">
      <span class="cal-widget-month">${monthLabel}</span>
      <button class="cal-widget-toggle${calWidgetMode === 'month' ? ' open' : ''}" id="cal-widget-toggle" title="${calWidgetMode === 'week' ? 'Ayı göster' : 'Haftayı göster'}">
        ${getIcon('chevrondown', 14)}
      </button>
    </div>
    <div class="cal-widget-grid">
      ${TR_DAYNAMES.map(n => `<span class="cal-widget-dayname">${n[0]}</span>`).join('')}
      ${days.map(d => renderWidgetDay(d, today)).join('')}
    </div>
  `;

  // Hafta modunda özel günler listesi
  if (calWidgetMode === 'week') {
    const specials = [];
    days.forEach(d => {
      const sp = getSpecialDay(d.getFullYear(), d.getMonth(), d.getDate());
      if (sp) specials.push({ date: d, name: sp });
    });
    html += `
      <div class="cal-widget-special">
        <div class="cal-widget-special-title">Bu hafta özel günler</div>
        ${specials.length
          ? specials.map(s => `
              <div class="cal-widget-special-item">
                <span class="cal-widget-special-dot"></span>
                <span class="cal-widget-special-date">${s.date.getDate()} ${TR_MONTHS[s.date.getMonth()].slice(0,3)}</span>
                <span>${escapeHtml(s.name)}</span>
              </div>`).join('')
          : `<div class="cal-widget-special-empty">Özel gün yok.</div>`}
      </div>
    `;
  }

  body.innerHTML = html;

  body.querySelector('#cal-widget-toggle').addEventListener('click', e => {
    e.stopPropagation();
    calWidgetMode = calWidgetMode === 'week' ? 'month' : 'week';
    renderCalendarWidget();
  });

  // Bir güne tıklayınca takvim modülünü o gün seçili olarak aç
  body.querySelectorAll('.cal-widget-day[data-date]').forEach(dayEl => {
    dayEl.addEventListener('click', e => {
      e.stopPropagation();
      const d = new Date(dayEl.dataset.date);
      openCalendarModuleAt(d);
    });
  });
}

function renderWidgetDay(d, today) {
  const isToday = d.toDateString() === today.toDateString();
  const isOther = calWidgetMode === 'month' && d.getMonth() !== today.getMonth();
  const special = getSpecialDay(d.getFullYear(), d.getMonth(), d.getDate());
  const tasks   = getDayTasks(d.getFullYear(), d.getMonth(), d.getDate());

  let cls = 'cal-widget-day';
  if (isToday) cls += ' today';
  if (isOther) cls += ' other';
  if (tasks.length) cls += ' has-task';

  return `
    <span class="${cls}" data-date="${d.toISOString()}">
      ${d.getDate()}
      ${special ? '<span class="cal-dot"></span>' : ''}
    </span>
  `;
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const dow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const start = new Date(first);
  start.setDate(first.getDate() - dow);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
    // 5. haftadan sonra ay bittiyse dur
    if (i >= 34 && d.getMonth() !== month && d.getDay() === 0) break;
  }
  return days;
}

/* ════════════════════════════════════════
   ORTA PANEL
   ════════════════════════════════════════ */
let calViewYear, calViewMonth, calSelectedDate;

function openCalendarModule() {
  const today = new Date();
  if (calViewYear === undefined) {
    calViewYear  = today.getFullYear();
    calViewMonth = today.getMonth();
  }
  calSelectedDate = new Date();
  renderCalendarModule();
}

/* Belirli bir tarih seçili olarak takvim modülünü aç */
function openCalendarModuleAt(date) {
  calViewYear     = date.getFullYear();
  calViewMonth    = date.getMonth();
  calSelectedDate = new Date(date);
  renderCalendarModule();
}

function renderCalendarModule() {
  const center = document.getElementById('col-center');
  if (!center) return;

  center.innerHTML = `
    <div id="module-calendar">
      <div class="cal-topbar">
        <span style="color:var(--accent);display:flex">${getIcon('calendar', 20)}</span>
        <span class="cal-topbar-title">Takvim</span>
      </div>
      <div class="cal-body">
        <div class="cal-main-row">
          <div class="cal-grid-wrap" id="cal-grid-wrap"></div>
          <div class="cal-side" id="cal-side"></div>
        </div>
        <div class="cal-upcoming" id="cal-upcoming"></div>
      </div>
    </div>
  `;

  renderBigCalendar();
  renderTodayInHistory(calSelectedDate);
  renderUpcoming();

  // Görünen ayın günlerini arka planda önden yükle
  prefetchMonthOtd(calViewYear, calViewMonth);
}

function renderBigCalendar() {
  const wrap = document.getElementById('cal-grid-wrap');
  if (!wrap) return;

  const today = new Date();
  const days  = getMonthDays(calViewYear, calViewMonth);

  wrap.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" id="cal-prev">${getIcon('chevronup', 15)}</button>
      <span class="cal-nav-month">${TR_MONTHS[calViewMonth]} ${calViewYear}</span>
      <button class="cal-nav-btn" id="cal-next">${getIcon('chevrondown', 15)}</button>
    </div>
    <div class="cal-grid-names">
      ${TR_DAYNAMES.map(n => `<span class="cal-grid-dayname">${n}</span>`).join('')}
    </div>
    <div class="cal-grid">
      ${days.map(d => renderBigCell(d, today)).join('')}
    </div>
  `;

  // Önceki/sonraki ay okları yatay olmalı — chevron'u döndür
  wrap.querySelector('#cal-prev').style.transform = 'rotate(-90deg)';
  wrap.querySelector('#cal-next').style.transform = 'rotate(-90deg)';

  wrap.querySelector('#cal-prev').addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderBigCalendar();
    prefetchMonthOtd(calViewYear, calViewMonth);
  });
  wrap.querySelector('#cal-next').addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    renderBigCalendar();
    prefetchMonthOtd(calViewYear, calViewMonth);
  });

  wrap.querySelectorAll('.cal-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const ds = cell.dataset.date;
      if (!ds) return;
      calSelectedDate = new Date(ds);
      wrap.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      renderTodayInHistory(calSelectedDate);
    });
  });
}

function renderBigCell(d, today) {
  const isToday = d.toDateString() === today.toDateString();
  const isOther = d.getMonth() !== calViewMonth;
  const isSelected = calSelectedDate && d.toDateString() === calSelectedDate.toDateString();
  const special = getSpecialDay(d.getFullYear(), d.getMonth(), d.getDate());
  const tasks   = getDayTasks(d.getFullYear(), d.getMonth(), d.getDate());

  let cls = 'cal-cell';
  if (isToday)    cls += ' today';
  if (isOther)    cls += ' other';
  if (isSelected) cls += ' selected';

  const dots = [];
  if (special)      dots.push('<span class="cal-cell-dot special"></span>');
  if (tasks.length) dots.push('<span class="cal-cell-dot task"></span>');

  return `
    <div class="${cls}" data-date="${d.toISOString()}">
      <span class="cal-cell-num">${d.getDate()}</span>
      ${special ? `<span class="cal-cell-special" title="${escapeHtml(special)}">${escapeHtml(special)}</span>` : ''}
      ${dots.length ? `<div class="cal-cell-dot-row">${dots.join('')}</div>` : ''}
    </div>
  `;
}

/* ── Tarihte Bugün (Wikipedia API) ── */
/* ── Tarihte Bugün — önbellek + debounce ── */
const otdMemCache = {};         // bellek içi: "5-15" -> events[]
let otdDebounceTimer = null;
let otdRequestSeq = 0;          // son isteği takip et (yarış önleme)

function otdCacheGet(key) {
  if (otdMemCache[key]) return otdMemCache[key];
  // localStorage kalıcı önbellek
  try {
    const stored = JSON.parse(localStorage.getItem('otd-cache') || '{}');
    if (stored[key]) { otdMemCache[key] = stored[key]; return stored[key]; }
  } catch {}
  return null;
}

function otdCacheSet(key, events) {
  otdMemCache[key] = events;
  try {
    const stored = JSON.parse(localStorage.getItem('otd-cache') || '{}');
    stored[key] = events;
    localStorage.setItem('otd-cache', JSON.stringify(stored));
  } catch {}
}

function otdRenderEvents(side, date, events) {
  const day = date.getDate();
  side.innerHTML = `
    <div class="cal-side-title">${getIcon('clock', 16)} Tarihte Bugün</div>
    <div class="cal-side-date">${day} ${TR_MONTHS[date.getMonth()]}</div>
    <div class="cal-otd-list">
      ${events.map(e => `
        <div class="cal-otd-item">
          <span class="cal-otd-year">${e.year}</span>
          <span class="cal-otd-text">${escapeHtml(e.text)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTodayInHistory(date) {
  const side = document.getElementById('cal-side');
  if (!side) return;

  const month = date.getMonth() + 1;
  const day   = date.getDate();
  const key   = `${month}-${day}`;

  // Önbellekte varsa anında göster
  const cached = otdCacheGet(key);
  if (cached) {
    otdRenderEvents(side, date, cached);
    return;
  }

  // Yükleniyor durumu
  side.innerHTML = `
    <div class="cal-side-title">${getIcon('clock', 16)} Tarihte Bugün</div>
    <div class="cal-side-date">${day} ${TR_MONTHS[date.getMonth()]}</div>
    <div class="cal-otd-loading">Yükleniyor…</div>
  `;

  // Debounce — hızlı tıklamalarda sadece son isteği at (kısa tutuldu)
  clearTimeout(otdDebounceTimer);
  const seq = ++otdRequestSeq;
  otdDebounceTimer = setTimeout(() => fetchOtd(key, month, day, date, seq), 120);
}

/* ── Arka planda önden yükleme ──
   Takvim açılınca görünen ayın birkaç gününü sessizce cache'le.
   Böylece kullanıcı tıkladığında çoğu gün zaten hazır olur.
*/
let otdPrefetchToken = 0;
async function prefetchMonthOtd(year, month) {
  const myToken = ++otdPrefetchToken; // yeni çağrı eskiyi iptal eder

  const m = month + 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const startDay = (today.getMonth() === month && today.getFullYear() === year) ? today.getDate() : 1;

  const order = [];
  for (let d = startDay; d <= daysInMonth; d++) order.push(d);
  for (let d = 1; d < startDay; d++) order.push(d);

  for (const d of order) {
    if (myToken !== otdPrefetchToken) return; // başka ay açıldı, durdur
    const key = `${m}-${d}`;
    if (otdCacheGet(key)) continue;
    try {
      const url = `https://tr.wikipedia.org/api/rest_v1/feed/onthisday/events/${m}/${d}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const events = (data.events || [])
          .map(e => ({ year: e.year, text: e.text }))
          .sort((a, b) => b.year - a.year)
          .slice(0, 12);
        if (events.length) otdCacheSet(key, events);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 120));
  }
}

async function fetchOtd(key, month, day, date, seq) {
  try {
    const url = `https://tr.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('API hatası');
    const data = await res.json();

    // En yeniden eskiye sırala, ilk 12'yi al
    const events = (data.events || [])
      .map(e => ({ year: e.year, text: e.text }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 12);

    if (!events.length) throw new Error('Veri yok');

    otdCacheSet(key, events);

    // Bu istek hâlâ güncel mi? (kullanıcı başka güne tıklamadıysa)
    if (seq !== otdRequestSeq) return;
    const side = document.getElementById('cal-side');
    if (side) otdRenderEvents(side, date, events);

  } catch (err) {
    if (seq !== otdRequestSeq) return;
    const side = document.getElementById('cal-side');
    if (side) {
      side.innerHTML = `
        <div class="cal-side-title">${getIcon('clock', 16)} Tarihte Bugün</div>
        <div class="cal-side-date">${day} ${TR_MONTHS[date.getMonth()]}</div>
        <div class="cal-otd-error">Geçmiş olaylar yüklenemedi.<br>İnternet bağlantısını kontrol et.</div>
      `;
    }
  }
}

/* ── Yaklaşan günler ── */
function renderUpcoming() {
  const el = document.getElementById('cal-upcoming');
  if (!el) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const items = [];

  // Önümüzdeki 90 gün içindeki özel günler
  for (let i = 0; i <= 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const sp = getSpecialDay(d.getFullYear(), d.getMonth(), d.getDate());
    if (sp) items.push({ date: new Date(d), type: 'special', label: sp, days: i });
  }

  // Todo hatırlatıcıları + proje deadline'ları
  try {
    const todos = JSON.parse(localStorage.getItem('todos-v3') || '[]');
    todos.forEach(t => {
      if (t.reminder && !t.done) {
        const d = new Date(t.reminder); d.setHours(0,0,0,0);
        const diff = Math.round((d - today) / 86400000);
        if (diff >= 0 && diff <= 90) items.push({ date: d, type: 'task', label: t.text, days: diff });
      }
    });
  } catch {}
  try {
    const projects = JSON.parse(localStorage.getItem('projects-v3') || '[]');
    projects.forEach(p => {
      if (p.deadline) {
        const d = new Date(p.deadline); d.setHours(0,0,0,0);
        const diff = Math.round((d - today) / 86400000);
        if (diff >= 0 && diff <= 90) items.push({ date: d, type: 'task', label: p.name + ' (deadline)', days: diff });
      }
    });
  } catch {}

  items.sort((a, b) => a.date - b.date);
  const top = items.slice(0, 8);

  el.innerHTML = `
    <div class="cal-upcoming-title">${getIcon('bell', 16)} Yaklaşan Günler</div>
    ${top.length
      ? `<div class="cal-upcoming-list">
          ${top.map(it => `
            <div class="cal-upcoming-item">
              <span class="cal-upcoming-dot ${it.type}"></span>
              <span class="cal-upcoming-date">${it.date.getDate()} ${TR_MONTHS[it.date.getMonth()]} ${it.date.getFullYear()}</span>
              <span class="cal-upcoming-label">${escapeHtml(it.label)}</span>
              <span class="cal-upcoming-days">${it.days === 0 ? 'bugün' : it.days + ' gün'}</span>
            </div>
          `).join('')}
        </div>`
      : `<div class="cal-upcoming-empty">Yaklaşan özel gün veya görev yok.</div>`}
  `;
}