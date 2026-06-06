/* ══════════════════════════════════════════════════════
   datepicker.js — Özel Tarih & Saat Seçici
   ══════════════════════════════════════════════════════ */

'use strict';

const MONTHS_DP = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS_DP   = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

/* ─────────────────────────────────────────────────
   showDatePicker(options) → Promise<Date|null>
   
   options:
     title       — başlık (string)
     withTime    — saat seçimi de göster (bool, default false)
     defaultDate — başlangıç tarihi (Date|timestamp|null)
     minDate     — minimum tarih (Date|null)
     optional    — iptal butonuyla null dönebilir (bool)
   ───────────────────────────────────────────────── */

function showDatePicker({ title = 'Tarih Seç', withTime = false, defaultDate = null, minDate = null, optional = true } = {}) {
  return new Promise(resolve => {
    document.querySelector('.dp-overlay')?.remove();

    const initial = defaultDate ? new Date(defaultDate) : new Date();
    let viewYear  = initial.getFullYear();
    let viewMonth = initial.getMonth();
    let selYear   = initial.getFullYear();
    let selMonth  = initial.getMonth();
    let selDay    = defaultDate ? initial.getDate() : null;
    let selHour   = defaultDate ? initial.getHours()   : 9;
    let selMin    = defaultDate ? initial.getMinutes() : 0;

    const overlay = document.createElement('div');
    overlay.className = 'dp-overlay';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);

    function renderPicker() {
      const today       = new Date();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
      const startOffset = (firstDay + 6) % 7;
      const prevDays    = new Date(viewYear, viewMonth, 0).getDate();

      const isSelected = (d) => selDay !== null && d === selDay && viewMonth === selMonth && viewYear === selYear;
      const isToday    = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
      const isPast     = (d) => {
        if (!minDate) return false;
        const min = new Date(minDate); min.setHours(0,0,0,0);
        const date = new Date(viewYear, viewMonth, d);
        return date < min;
      };

      let calHTML = '';
      DAYS_DP.forEach(d => { calHTML += `<div class="dp-day-name">${d}</div>`; });
      for (let i = startOffset - 1; i >= 0; i--)
        calHTML += `<div class="dp-day other-month">${prevDays - i}</div>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const past  = isPast(d);
        const sel   = isSelected(d);
        const tdy   = isToday(d);
        calHTML += `<button class="dp-day${sel?' selected':''}${tdy&&!sel?' today':''}${past?' disabled':''}"
          data-day="${d}" ${past?'disabled':''}>${d}</button>`;
      }
      const total = startOffset + daysInMonth;
      const rem   = total % 7 === 0 ? 0 : 7 - (total % 7);
      for (let i = 1; i <= rem; i++)
        calHTML += `<div class="dp-day other-month">${i}</div>`;

      const selLabel = selDay !== null
        ? `${selDay} ${MONTHS_DP[selMonth]} ${selYear}`
        : 'Gün seçilmedi';

      overlay.innerHTML = `
        <div class="dp-modal">
          <div class="dp-header">
            <span class="dp-title">${title}</span>
            <button class="dp-close">✕</button>
          </div>

          <div class="dp-body">
            <!-- Ay navigasyon -->
            <div class="dp-nav">
              <button class="dp-nav-btn" id="dp-prev-year"  title="Önceki yıl">«</button>
              <button class="dp-nav-btn" id="dp-prev-month" title="Önceki ay">‹</button>
              <span class="dp-nav-label">${MONTHS_DP[viewMonth]} ${viewYear}</span>
              <button class="dp-nav-btn" id="dp-next-month" title="Sonraki ay">›</button>
              <button class="dp-nav-btn" id="dp-next-year"  title="Sonraki yıl">»</button>
            </div>

            <!-- Takvim grid -->
            <div class="dp-grid">${calHTML}</div>

            <!-- Seçili tarih göstergesi -->
            <div class="dp-selected-label" id="dp-sel-label">${selLabel}</div>

            <!-- Saat seçici (withTime=true ise) -->
            ${withTime ? `
              <div class="dp-time-row">
                <span class="dp-time-label">${getIcon('clock',13)} Saat</span>
                <div class="dp-time-controls">
                  <button class="dp-time-btn" data-unit="hour" data-dir="-1">−</button>
                  <span class="dp-time-val" id="dp-hour">${String(selHour).padStart(2,'0')}</span>
                  <button class="dp-time-btn" data-unit="hour" data-dir="1">+</button>
                  <span class="dp-time-sep">:</span>
                  <button class="dp-time-btn" data-unit="min" data-dir="-1">−</button>
                  <span class="dp-time-val" id="dp-min">${String(selMin).padStart(2,'0')}</span>
                  <button class="dp-time-btn" data-unit="min" data-dir="1">+</button>
                </div>
              </div>

              <div class="dp-preset-row">
                <span class="dp-preset-label">Hızlı:</span>
                <button class="dp-preset-btn" data-offset="30">30 dk</button>
                <button class="dp-preset-btn" data-offset="60">1 saat</button>
                <button class="dp-preset-btn" data-offset="120">2 saat</button>
                <button class="dp-preset-btn" data-offset="480">Yarın sabah</button>
              </div>
            ` : `
              <div class="dp-preset-row">
                <span class="dp-preset-label">Hızlı:</span>
                <button class="dp-quick-btn" data-quick="today">Bugün</button>
                <button class="dp-quick-btn" data-quick="tomorrow">Yarın</button>
                <button class="dp-quick-btn" data-quick="nextweek">Gelecek hafta</button>
              </div>
            `}
          </div>

          <div class="dp-footer">
            ${optional ? '<button class="dp-cancel-btn">İptal</button>' : ''}
            ${selDay !== null ? `<button class="dp-clear-btn">${getIcon('trash',13)} Temizle</button>` : ''}
            <button class="dp-confirm-btn" ${selDay === null ? 'disabled' : ''}>✓ Seç</button>
          </div>
        </div>
      `;

      bindPickerEvents();
    }

    function bindPickerEvents() {
      /* Kapat */
      overlay.querySelector('.dp-close')?.addEventListener('click', () => close(null));
      overlay.querySelector('.dp-cancel-btn')?.addEventListener('click', () => close(null));
      overlay.querySelector('.dp-clear-btn')?.addEventListener('click', () => { selDay = null; close(null); });
      overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });

      /* Navigasyon */
      overlay.querySelector('#dp-prev-month')?.addEventListener('click', () => { viewMonth--; if (viewMonth<0){viewMonth=11;viewYear--;} renderPicker(); });
      overlay.querySelector('#dp-next-month')?.addEventListener('click', () => { viewMonth++; if (viewMonth>11){viewMonth=0;viewYear++;} renderPicker(); });
      overlay.querySelector('#dp-prev-year') ?.addEventListener('click', () => { viewYear--; renderPicker(); });
      overlay.querySelector('#dp-next-year') ?.addEventListener('click', () => { viewYear++; renderPicker(); });

      /* Gün seçimi */
      overlay.querySelectorAll('.dp-day[data-day]').forEach(btn => {
        btn.addEventListener('click', () => {
          selDay   = parseInt(btn.dataset.day);
          selMonth = viewMonth;
          selYear  = viewYear;
          renderPicker();
        });
      });

      /* Saat butonları */
      overlay.querySelectorAll('.dp-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const unit = btn.dataset.unit, dir = parseInt(btn.dataset.dir);
          if (unit === 'hour') { selHour = (selHour + dir + 24) % 24; }
          if (unit === 'min')  { selMin  = (selMin  + dir + 60) % 60; }
          const hEl = overlay.querySelector('#dp-hour');
          const mEl = overlay.querySelector('#dp-min');
          if (hEl) hEl.textContent = String(selHour).padStart(2,'0');
          if (mEl) mEl.textContent = String(selMin ).padStart(2,'0');
        });
      });

      /* Hızlı seçenekler (saat modunda) */
      overlay.querySelectorAll('.dp-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const future = new Date(Date.now() + parseInt(btn.dataset.offset) * 60000);
          selDay   = future.getDate();
          selMonth = future.getMonth();
          selYear  = future.getFullYear();
          selHour  = future.getHours();
          selMin   = future.getMinutes();
          viewMonth = selMonth; viewYear = selYear;
          renderPicker();
        });
      });

      /* Hızlı seçenekler (tarih modunda) */
      overlay.querySelectorAll('.dp-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const d = new Date();
          if (btn.dataset.quick === 'today')    { /* bugün */ }
          if (btn.dataset.quick === 'tomorrow') { d.setDate(d.getDate() + 1); }
          if (btn.dataset.quick === 'nextweek') { d.setDate(d.getDate() + 7); }
          selDay   = d.getDate();
          selMonth = d.getMonth();
          selYear  = d.getFullYear();
          viewMonth = selMonth; viewYear = selYear;
          renderPicker();
        });
      });

      /* Onayla */
      overlay.querySelector('.dp-confirm-btn')?.addEventListener('click', () => {
        if (selDay === null) return;
        const result = new Date(selYear, selMonth, selDay, selHour, selMin, 0, 0);
        close(result);
      });
    }

    let closed = false;
    function close(result) {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(result);
    }

    function onKey(e) {
      if (e.key === 'Escape') close(null);
    }
    document.addEventListener('keydown', onKey);

    renderPicker();
  });
}

/* ─────────────────────────────────────────────────
   TAKVİM SENKRONİZASYONU
   Seçilen tarih takvim modülüne de yansır
   ───────────────────────────────────────────────── */

function syncDateToCalendar(dateObj) {
  if (!dateObj) return;
  /* calState global değişkeni calendar.js'de tanımlı */
  if (typeof calState !== 'undefined') {
    calState.year  = dateObj.getFullYear();
    calState.month = dateObj.getMonth();
    /* Mini takvimi güncelle */
    if (typeof initMiniCalendar === 'function') initMiniCalendar();
  }
}