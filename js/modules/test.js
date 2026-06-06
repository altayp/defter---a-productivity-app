/* ═══════════════════════════════════════
   test.js — Test Modülü
   ═══════════════════════════════════════ */

/* ── Toast sistemi ── */


/* ── Dialog sistemi ── */
function showDialog({ icon = '', title = '', message = '', input = false, inputPlaceholder = '', confirmText = 'Tamam', cancelText = 'İptal', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-box">
        ${icon ? `<div class="dialog-icon">${icon}</div>` : ''}
        ${title   ? `<div class="dialog-title">${escapeHtml(title)}</div>` : ''}
        ${message ? `<div class="dialog-message">${escapeHtml(message)}</div>` : ''}
        ${input   ? `<input class="dialog-input" id="dialog-input-field" placeholder="${escapeHtml(inputPlaceholder)}" />` : ''}
        <div class="dialog-actions">
          ${cancelText ? `<button class="test-btn" id="dialog-cancel">${cancelText}</button>` : ''}
          <button class="test-btn ${danger ? 'danger' : 'primary'}" id="dialog-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const inputEl = overlay.querySelector('#dialog-input-field');
    if (inputEl) setTimeout(() => inputEl.focus(), 50);

    overlay.querySelector('#dialog-confirm').addEventListener('click', () => {
      const val = inputEl ? inputEl.value : true;
      overlay.remove();
      resolve(val);
    });
    const cancelBtn = overlay.querySelector('#dialog-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { overlay.remove(); resolve(null); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(null); } });
    if (inputEl) inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') { overlay.querySelector('#dialog-confirm').click(); }
      if (e.key === 'Escape') { overlay.remove(); resolve(null); }
    });
  });
}

/* ── Test Modülü Widget Render ── */
function renderTestWidget() {
  return `
    <div class="widget-body" style="padding-top:2px">
      <div style="font-size:12px;color:var(--ink-faint);font-style:italic;line-height:1.5">
        Dialoglar, toast'lar,<br>butonlar ve form ögeleri.
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="test-badge">Aktif</span>
        <span class="test-badge success">Başarılı</span>
        <span class="test-badge error">Hata</span>
      </div>
    </div>
  `;
}

/* ── Test Modülü Ana Render ── */
function openTestModule() {
  const center = document.getElementById('col-center');

  center.innerHTML = `
    <div id="module-test">

      <div class="module-header">
        <span class="module-header-icon" id="test-mod-icon"></span>
        <span class="module-header-title">Test Modülü</span>
        <button class="module-back" id="test-back-btn">
          <span id="test-back-icon"></span>
          Geri
        </button>
      </div>

      <div class="test-sections">

        <!-- 1. Dialoglar -->
        <div class="test-section">
          <div class="test-section-title">
            <span id="icon-dialog"></span> Dialoglar
          </div>

          <div class="test-row">
            <span class="test-label">Hatırlatıcı</span>
            <button class="test-btn primary" id="btn-reminder">
              <span id="icon-reminder"></span> Hatırlatıcı Ekle
            </button>
          </div>

          <div class="test-row">
            <span class="test-label">Onay Kutusu</span>
            <button class="test-btn" id="btn-confirm">Bir Şeyi Onayla</button>
            <span class="test-result" id="result-confirm">—</span>
          </div>

          <div class="test-row">
            <span class="test-label">Metin Girişi</span>
            <button class="test-btn" id="btn-input-dialog">Metin İste</button>
            <span class="test-result" id="result-input">—</span>
          </div>

          <div class="test-row">
            <span class="test-label">Tehlikeli İşlem</span>
            <button class="test-btn danger" id="btn-danger-dialog">Sil</button>
            <span class="test-result" id="result-danger">—</span>
          </div>
        </div>

        <!-- 2. Toast Bildirimleri -->
        <div class="test-section">
          <div class="test-section-title">
            <span id="icon-toast"></span> Toast Bildirimleri
          </div>

          <div class="test-row">
            <span class="test-label">Varsayılan</span>
            <button class="test-btn small" id="btn-toast-default">Göster</button>
          </div>

          <div class="test-row">
            <span class="test-label">Başarı</span>
            <button class="test-btn small" id="btn-toast-success">Göster</button>
          </div>

          <div class="test-row">
            <span class="test-label">Hata</span>
            <button class="test-btn small" id="btn-toast-error">Göster</button>
          </div>
        </div>

        <!-- 3. Form Ögeleri -->
        <div class="test-section">
          <div class="test-section-title">
            <span id="icon-form"></span> Form Ögeleri
          </div>

          <div class="test-row">
            <span class="test-label">Metin girişi</span>
            <input class="test-input" placeholder="Bir şeyler yaz…" id="test-text-input" />
            <span class="test-result" id="result-input-val">—</span>
          </div>

          <div class="test-row">
            <span class="test-label">Onay kutusu</span>
            <input type="checkbox" class="test-checkbox" id="test-check" />
            <label for="test-check" style="font-size:13px;color:var(--ink-light);cursor:pointer">Etkin</label>
            <span class="test-result" id="result-check">kapalı</span>
          </div>

          <div class="test-row">
            <span class="test-label">Toggle</span>
            <label class="test-toggle">
              <input type="checkbox" id="test-toggle" />
              <span class="test-toggle-slider"></span>
            </label>
            <span class="test-result" id="result-toggle">kapalı</span>
          </div>

          <div class="test-row">
            <span class="test-label">İlerleme çubuğu</span>
            <div class="test-progress">
              <div class="test-progress-fill" id="test-progress-fill" style="width:40%"></div>
            </div>
            <button class="test-btn small" id="btn-progress-inc">+10%</button>
            <button class="test-btn small" id="btn-progress-reset">Sıfırla</button>
          </div>
        </div>

        <!-- 4. Renkler ve Badge'ler -->
        <div class="test-section">
          <div class="test-section-title">
            <span id="icon-colors"></span> Renkler & Badge'ler
          </div>

          <div class="test-row">
            <span class="test-label">Badge'ler</span>
            <span class="test-badge">Varsayılan</span>
            <span class="test-badge neutral">Nötr</span>
            <span class="test-badge success">Başarı</span>
            <span class="test-badge error">Hata</span>
          </div>

          <div class="test-row">
            <span class="test-label">Tema rengi</span>
            <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);border:2px solid var(--border-strong)"></div>
            <div style="width:32px;height:32px;border-radius:50%;background:var(--bg-card);border:2px solid var(--border-strong)"></div>
            <div style="width:32px;height:32px;border-radius:50%;background:var(--ink);border:2px solid var(--border-strong)"></div>
          </div>

          <div class="test-row">
            <span class="test-label">Yazı stilleri</span>
            <span style="font-family:'Caveat',cursive;font-size:18px;color:var(--ink)">Caveat</span>
            <span style="font-family:'Crimson Pro',serif;font-size:16px;color:var(--ink)">Crimson Pro</span>
            <span style="font-family:'Crimson Pro',serif;font-style:italic;font-size:16px;color:var(--ink-light)">İtalik</span>
          </div>
        </div>

      </div>
    </div>
  `;

  /* İkonları yerleştir */
  document.getElementById('test-mod-icon').innerHTML  = getIcon('settings', 20);
  document.getElementById('test-back-icon').innerHTML = getIcon('expand',   13);
  document.getElementById('icon-dialog').innerHTML    = getIcon('clock',    14);
  document.getElementById('icon-toast').innerHTML     = getIcon('note',     14);
  document.getElementById('icon-form').innerHTML      = getIcon('check',    14);
  document.getElementById('icon-colors').innerHTML    = getIcon('sun',      14);
  document.getElementById('icon-reminder').innerHTML  = getIcon('clock',    14);

  /* Geri butonu */
  document.getElementById('test-back-btn').addEventListener('click', () => {
    if (typeof renderWelcome === 'function') renderWelcome();
  });

  /* ── Dialog testleri ── */

  // Hatırlatıcı
  document.getElementById('btn-reminder').addEventListener('click', async () => {
    const time = await showDialog({
      icon: getIcon('bell', 28),
      title: 'Hatırlatıcı Ekle',
      message: 'Kaç dakika sonra hatırlatılsın?',
      input: true,
      inputPlaceholder: 'Dakika (örn. 25)',
      confirmText: 'Hatırlat',
      cancelText: 'İptal',
    });
    if (time === null) return;
    const mins = parseInt(time);
    if (!mins || mins <= 0) { showToast('Geçersiz süre.', 'error'); return; }
    showToast(`${mins} dakika sonra hatırlatılacak.`, 'success');
    setTimeout(() => {
      showDialog({
        icon: getIcon('bell', 28),
        title: 'Hatırlatıcı!',
        message: `${mins} dakika geçti. Harekete geç!`,
        confirmText: 'Tamam',
        cancelText: '',
      });
    }, mins * 60 * 1000);
  });

  // Onay
  document.getElementById('btn-confirm').addEventListener('click', async () => {
    const result = await showDialog({
      icon: getIcon('question', 28),
      title: 'Emin misin?',
      message: 'Bu işlemi yapmak istediğinden emin misin?',
      confirmText: 'Evet',
      cancelText: 'Hayır',
    });
    document.getElementById('result-confirm').textContent = result ? 'Onaylandı' : 'İptal';
  });

  // Metin girişi
  document.getElementById('btn-input-dialog').addEventListener('click', async () => {
    const val = await showDialog({
      icon: getIcon('edit', 28),
      title: 'Metin Gir',
      message: 'Aşağıya bir şeyler yaz:',
      input: true,
      inputPlaceholder: 'Buraya yaz…',
      confirmText: 'Kaydet',
      cancelText: 'İptal',
    });
    const el = document.getElementById('result-input');
    el.textContent = val ? `"${val.slice(0,20)}${val.length > 20 ? '…' : ''}"` : 'İptal';
  });

  // Tehlikeli
  document.getElementById('btn-danger-dialog').addEventListener('click', async () => {
    const result = await showDialog({
      icon: getIcon('trash', 28),
      title: 'Silmek istiyor musun?',
      message: 'Bu işlem geri alınamaz. Devam etmek istiyor musun?',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      danger: true,
    });
    document.getElementById('result-danger').textContent = result ? 'Silindi' : 'Vazgeçildi';
  });

  /* ── Toast testleri ── */
  document.getElementById('btn-toast-default').addEventListener('click', () => {
    showToast('Bu bir bilgi mesajı.');
  });
  document.getElementById('btn-toast-success').addEventListener('click', () => {
    showToast('İşlem başarıyla tamamlandı.', 'success');
  });
  document.getElementById('btn-toast-error').addEventListener('click', () => {
    showToast('Bir hata oluştu, tekrar dene.', 'error');
  });

  /* ── Form testleri ── */
  document.getElementById('test-text-input').addEventListener('input', function() {
    document.getElementById('result-input-val').textContent =
      this.value ? `${this.value.length} karakter` : '—';
  });

  document.getElementById('test-check').addEventListener('change', function() {
    document.getElementById('result-check').textContent = this.checked ? 'açık' : 'kapalı';
  });

  document.getElementById('test-toggle').addEventListener('change', function() {
    document.getElementById('result-toggle').textContent = this.checked ? 'açık' : 'kapalı';
  });

  let progress = 40;
  document.getElementById('btn-progress-inc').addEventListener('click', () => {
    progress = Math.min(100, progress + 10);
    document.getElementById('test-progress-fill').style.width = progress + '%';
  });
  document.getElementById('btn-progress-reset').addEventListener('click', () => {
    progress = 0;
    document.getElementById('test-progress-fill').style.width = '0%';
  });
}