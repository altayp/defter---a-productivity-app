/* ═══════════════════════════════════════
   notes.js — Notlar (Soruşturma Panosu)
   ═══════════════════════════════════════ */

/* ── Veri modeli ──
   note: {
     id, type:'note'|'photo', shape:'postit'|'paper'|'news'|'card',
     text, color, x, y, pinned,
     img(base64), frame, caption,    // photo için
     portalId(null=ana canvas)
   }
   connection: { id, from(noteId), to(noteId), portalId }
   portal: { id, name, x, y, passwordHash(null|string) }
*/
function loadNotesData() {
  try {
    const d = JSON.parse(localStorage.getItem('notes-v3') || '{}');
    return {
      notes: d.notes || [],
      connections: d.connections || [],
      portals: d.portals || [],
      drawings: d.drawings || [],
    };
  } catch {
    return { notes: [], connections: [], portals: [], drawings: [] };
  }
}
function saveNotesData(d) { localStorage.setItem('notes-v3', JSON.stringify(d)); }
function newDrawId() { return 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }
function newNoteId()  { return 'n_'  + Date.now() + '_' + Math.random().toString(36).slice(2,6); }
function newConnId()  { return 'c_'  + Date.now() + '_' + Math.random().toString(36).slice(2,6); }
function newPortalId(){ return 'p_'  + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

const NOTE_COLORS = {
  yellow: '#f5e08c', green: '#bfe3c0', blue: '#b8d8f0',
  pink: '#f8c0d0', purple: '#d8c0f0', orange: '#f8d0a0',
};

/* Basit şifre hash (gerçek güvenlik değil, sadece engel) */
function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h + pw.charCodeAt(i)) | 0; }
  return String(h);
}

/* HTML'den düz metin çıkar (widget gösterimi için) */
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim() || 'Boş not';
}

/* ════════════════════════════════════════
   WİDGET — Pinli notlar
   ════════════════════════════════════════ */
function renderNotesWidget() {
  const body = document.getElementById('notes-widget-body');
  if (!body) return;

  const data = loadNotesData();
  const pinned = data.notes.filter(n => n.pinned);

  if (!pinned.length) {
    body.innerHTML = `<div class="notes-widget-empty">Pinlenmiş not yok.</div>`;
    return;
  }

  body.innerHTML = `
    <div class="notes-widget-list">
      ${pinned.map(n => `
        <div class="notes-widget-item" data-id="${n.id}">
          <span class="notes-widget-pin-icon">${getIcon('pin', 12)}</span>
          <span class="notes-widget-text">${escapeHtml(stripHtml(n.type === 'photo' ? (n.caption || 'Fotoğraf') : (n.text || 'Boş not')))}</span>
        </div>
      `).join('')}
    </div>
  `;

  body.querySelectorAll('.notes-widget-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      openNotesModule();
    });
  });
}

/* ════════════════════════════════════════
   CANVAS DURUM
   ════════════════════════════════════════ */
const notesView = {
  offsetX: 0, offsetY: 0, scale: 1,
  currentPortal: null,   // null = ana canvas, yoksa portal id
  linkingFrom: null,     // bağlantı kurma modu
  selectedNote: null,
  drawTool: null,        // null | 'pen' | 'rect' | 'ellipse' | 'arrow' | 'line' | 'eraser'
  drawColor: '#d8443a',
  drawWidth: 3,
};

function openNotesModule() {
  notesView.currentPortal = null;
  notesView.linkingFrom = null;
  renderNotesModule();
}

function renderNotesModule() {
  const center = document.getElementById('col-center');
  if (!center) return;

  const data = loadNotesData();
  const portal = notesView.currentPortal
    ? data.portals.find(p => p.id === notesView.currentPortal)
    : null;

  center.innerHTML = `
    <div id="module-notes">
      <div class="notes-topbar">
        <span class="notes-topbar-title">${getIcon('note', 18)} Notlar</span>
        ${portal ? `
          <span class="notes-breadcrumb">${getIcon('portal', 12)} ${escapeHtml(portal.name)}</span>
          <button class="notes-tool-btn back" id="notes-exit-portal">${getIcon('chevronup', 13)} Ana Pano</button>
        ` : ''}
        <span class="notes-topbar-spacer"></span>
        <button class="notes-tool-btn" id="notes-add-note">${getIcon('plus', 13)} Not</button>
        <button class="notes-tool-btn" id="notes-add-photo">${getIcon('image', 13)} Fotoğraf</button>
        ${!portal ? `<button class="notes-tool-btn" id="notes-add-portal">${getIcon('portal', 13)} Portal</button>` : ''}
        <button class="notes-tool-btn" id="notes-draw-btn">${getIcon('shapes', 13)} Çizim</button>
      </div>
      <div class="notes-canvas-wrap" id="notes-canvas-wrap">
        <svg class="notes-connections" id="notes-connections"></svg>
        <svg class="notes-drawings" id="notes-drawings"></svg>
        <div class="notes-canvas" id="notes-canvas"></div>
      </div>
    </div>
  `;

  // Üst bar butonları
  center.querySelector('#notes-add-note').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    showShapePickerMenu(r.left, r.bottom + 4);
  });
  center.querySelector('#notes-add-photo').addEventListener('click', openImageForm);
  center.querySelector('#notes-add-portal')?.addEventListener('click', openPortalForm);
  center.querySelector('#notes-draw-btn').addEventListener('click', toggleDrawToolbar);
  center.querySelector('#notes-exit-portal')?.addEventListener('click', () => {
    notesView.currentPortal = null;
    renderNotesModule();
  });

  initCanvasPan();
  renderCanvas();
}

/* ── Pan & Zoom ── */
function initCanvasPan() {
  const wrap = document.getElementById('notes-canvas-wrap');
  if (!wrap) return;

  let panning = false, sx = 0, sy = 0, ox = 0, oy = 0;

  wrap.addEventListener('mousedown', e => {
    // Çizim modu aktifse çizime başla
    if (notesView.drawTool && e.button === 0) {
      const onCanvas = e.target === wrap || e.target.classList.contains('notes-canvas') ||
                       e.target.id === 'notes-drawings' || e.target.closest('#notes-drawings');
      if (onCanvas || e.target.tagName === 'svg' || e.target.tagName === 'path' || e.target.tagName === 'rect' || e.target.tagName === 'ellipse' || e.target.tagName === 'line') {
        e.preventDefault();
        startDrawing(e);
        return;
      }
    }
    if (e.target !== wrap && !e.target.classList.contains('notes-canvas') && e.target.id !== 'notes-drawings') return;
    if (notesView.linkingFrom) { notesView.linkingFrom = null; wrap.classList.remove('linking'); return; }
    panning = true;
    wrap.classList.add('panning');
    sx = e.clientX; sy = e.clientY;
    ox = notesView.offsetX; oy = notesView.offsetY;
  });
  window.addEventListener('mousemove', e => {
    if (!panning) return;
    notesView.offsetX = ox + (e.clientX - sx);
    notesView.offsetY = oy + (e.clientY - sy);
    applyCanvasTransform();
  });
  window.addEventListener('mouseup', () => {
    panning = false;
    wrap.classList.remove('panning');
  });

  // Zoom
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    notesView.scale = Math.max(0.4, Math.min(2.5, notesView.scale * delta));
    applyCanvasTransform();
  }, { passive: false });

  // Sağ tık → menü
  wrap.addEventListener('contextmenu', e => {
    if (e.target.closest('.note-item, .note-portal')) return;
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const cx = (e.clientX - rect.left - notesView.offsetX) / notesView.scale;
    const cy = (e.clientY - rect.top  - notesView.offsetY) / notesView.scale;
    showCanvasContextMenu(e.clientX, e.clientY, cx, cy);
  });
}

function applyCanvasTransform() {
  const canvas = document.getElementById('notes-canvas');
  const svg    = document.getElementById('notes-connections');
  const dsvg   = document.getElementById('notes-drawings');
  const wrap   = document.getElementById('notes-canvas-wrap');
  const t = `translate(${notesView.offsetX}px, ${notesView.offsetY}px) scale(${notesView.scale})`;
  if (canvas) canvas.style.transform = t;
  if (svg) svg.style.transform = t;
  if (dsvg) dsvg.style.transform = t;
  // Nokta deseni pan ve zoom ile birlikte hareket etsin (sonsuz pano hissi)
  if (wrap) {
    const gap = 22 * notesView.scale;
    wrap.style.backgroundSize = `${gap}px ${gap}px`;
    wrap.style.backgroundPosition = `${notesView.offsetX}px ${notesView.offsetY}px`;
  }
}

/* ── Canvas render ── */
function renderCanvas() {
  const canvas = document.getElementById('notes-canvas');
  if (!canvas) return;
  canvas.innerHTML = '';

  const data = loadNotesData();
  const pid  = notesView.currentPortal;

  // Bu canvas'a ait notlar
  const notes = data.notes.filter(n => (n.portalId || null) === pid);

  // Portallar sadece ana canvas'ta
  if (!pid) {
    data.portals.forEach(portal => renderPortalEl(portal, canvas, data));
  }

  notes.forEach(note => renderNoteEl(note, canvas));

  applyCanvasTransform();
  drawConnections();
  drawDrawings();
}

function renderNoteEl(note, canvas) {
  const el = document.createElement('div');
  el.className = `note-item${notesView.selectedNote === note.id ? ' selected' : ''}`;
  el.dataset.id = note.id;
  el.style.left = (note.x || 100) + 'px';
  el.style.top  = (note.y || 100) + 'px';

  if (note.type === 'photo') {
    el.innerHTML = `
      ${note.pinned ? '<span class="note-pin"></span>' : ''}
      <div class="note-shape-photo frame-${note.frame || 'classic'}">
        <img src="${note.img}" alt="" draggable="false"/>
        <div class="note-photo-caption">${note.caption || ''}</div>
      </div>
      ${noteToolsHTML()}
    `;
  } else {
    const shape = note.shape || 'postit';
    const bg = NOTE_COLORS[note.color || 'yellow'];
    el.innerHTML = `
      ${note.pinned ? '<span class="note-pin"></span>' : ''}
      <div class="note-shape-${shape}" style="${shape==='postit'?`--note-bg:${bg}`:''}">
        <div class="note-text">${note.text || ''}</div>
      </div>
      ${noteToolsHTML()}
    `;
  }

  canvas.appendChild(el);
  bindNoteEl(el, note);
}

function noteToolsHTML() {
  return '';
}

function bindNoteEl(el, note) {
  // İçindeki bağlantılar tıklanabilir (yeni sekmede/dış tarayıcıda aç)
  el.querySelectorAll('a').forEach(a => {
    a.style.pointerEvents = 'auto';
    a.addEventListener('mousedown', e => { e.stopPropagation(); });
    a.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      let href = a.getAttribute('href');
      if (!href) return;
      if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:')) href = 'https://' + href;
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(href);
      } else {
        window.open(href, '_blank');
      }
    });
  });

  // Sağ tık menüsü
  el.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();
    showNoteContextMenu(e.clientX, e.clientY, note);
  });

  // Sürükleme
  makeNoteDraggable(el, note);
}

/* ── Nota sağ tık menüsü ── */
function showNoteContextMenu(x, y, note) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'notes-ctx-menu';
  menu.id = 'notes-ctx-menu';
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';

  const isNote  = note.type === 'note';
  const isPostit = isNote && note.shape === 'postit';

  const shapeLabels = { postit:'Post-it', paper:'Defter Yaprağı', news:'Gazete', card:'Kart' };
  const frameLabels = { classic:'Klasik', gold:'Altın', wood:'Ahşap', vintage:'Vintage', none:'Çerçevesiz' };

  menu.innerHTML = `
    <button class="notes-ctx-item" id="nctx-detail">${getIcon('expand',14)} Detaylı Gör</button>
    <button class="notes-ctx-item" id="nctx-pin">${getIcon('pin',14)} ${note.pinned ? 'Pini Kaldır' : 'Pinle'}</button>
    <button class="notes-ctx-item" id="nctx-link">${getIcon('link',14)} Bağla</button>
    <div class="notes-ctx-sep"></div>
    ${isNote ? `
      <div class="notes-ctx-label">Stil</div>
      ${Object.entries(shapeLabels).map(([s,l]) =>
        `<button class="notes-ctx-item notes-ctx-sub${note.shape===s?' active':''}" data-shape="${s}">${l}</button>`
      ).join('')}
    ` : `
      <div class="notes-ctx-label">Çerçeve</div>
      ${Object.entries(frameLabels).map(([f,l]) =>
        `<button class="notes-ctx-item notes-ctx-sub${(note.frame||'classic')===f?' active':''}" data-frame="${f}">${l}</button>`
      ).join('')}
    `}
    ${isPostit ? `
      <div class="notes-ctx-label">Renk</div>
      <div class="notes-ctx-colors">
        ${Object.entries(NOTE_COLORS).map(([name,hex]) =>
          `<span class="notes-ctx-color" data-color="${name}" style="background:${hex}${note.color===name?';border-color:var(--ink)':''}"></span>`
        ).join('')}
      </div>
    ` : ''}
    <div class="notes-ctx-sep"></div>
    <button class="notes-ctx-item" id="nctx-del">${getIcon('trash',14)} Sil</button>
  `;
  document.body.appendChild(menu);

  // Stil değiştir (not)
  menu.querySelectorAll('.notes-ctx-sub[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeContextMenu();
      const data = loadNotesData();
      const n = data.notes.find(x => x.id === note.id);
      if (n) { n.shape = btn.dataset.shape; saveNotesData(data); renderCanvas(); }
    });
  });

  // Çerçeve değiştir (foto)
  menu.querySelectorAll('.notes-ctx-sub[data-frame]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeContextMenu();
      const data = loadNotesData();
      const n = data.notes.find(x => x.id === note.id);
      if (n) { n.frame = btn.dataset.frame; saveNotesData(data); renderCanvas(); }
    });
  });

  menu.querySelector('#nctx-detail').addEventListener('click', () => {
    closeContextMenu();
    openNoteDetail(note.id);
  });

  menu.querySelector('#nctx-pin').addEventListener('click', () => {
    closeContextMenu();
    const data = loadNotesData();
    const n = data.notes.find(x => x.id === note.id);
    if (n) { n.pinned = !n.pinned; saveNotesData(data); renderCanvas(); renderNotesWidget(); }
  });

  menu.querySelector('#nctx-link').addEventListener('click', () => {
    closeContextMenu();
    startLinking(note.id);
  });

  menu.querySelectorAll('.notes-ctx-color').forEach(c => {
    c.addEventListener('click', () => {
      closeContextMenu();
      const data = loadNotesData();
      const n = data.notes.find(x => x.id === note.id);
      if (n) { n.color = c.dataset.color; saveNotesData(data); renderCanvas(); }
    });
  });

  menu.querySelector('#nctx-del').addEventListener('click', async () => {
    closeContextMenu();
    const ok = await showDialog({
      icon: getIcon('trash', 28), title: 'Notu Sil',
      message: 'Bu not ve bağlantıları silinecek.',
      confirmText: 'Sil', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    const data = loadNotesData();
    data.notes = data.notes.filter(x => x.id !== note.id);
    data.connections = data.connections.filter(c => c.from !== note.id && c.to !== note.id);
    saveNotesData(data);
    renderCanvas();
    renderNotesWidget();
  });

  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}

/* ── Not detay sayfası (zengin metin) ── */
function openNoteDetail(noteId) {
  const data = loadNotesData();
  const note = data.notes.find(n => n.id === noteId);
  if (!note) return;

  const overlay = document.createElement('div');
  overlay.className = 'notes-img-overlay';
  overlay.id = 'note-detail-overlay';

  const shapeLabels = { postit:'Post-it', paper:'Defter Yaprağı', news:'Gazete', card:'Kart' };
  const connCount = data.connections.filter(c => c.from===note.id || c.to===note.id).length;

  const toolbar = `
    <div class="notes-rt-toolbar">
      <button class="notes-rt-btn" data-cmd="bold" title="Kalın"><b>B</b></button>
      <button class="notes-rt-btn" data-cmd="italic" title="İtalik"><i>I</i></button>
      <button class="notes-rt-btn" data-cmd="underline" title="Altı çizili"><u>U</u></button>
      <span class="notes-rt-sep"></span>
      <button class="notes-rt-btn" data-cmd="insertUnorderedList" title="Madde işaretli liste">${getIcon('list_bullet', 14)}</button>
      <button class="notes-rt-btn" data-cmd="insertOrderedList" title="Numaralı liste">${getIcon('list_ordered', 14)}</button>
      <span class="notes-rt-sep"></span>
      <button class="notes-rt-btn" data-cmd="link" title="Bağlantı ekle">${getIcon('link', 13)}</button>
    </div>
  `;

  overlay.innerHTML = `
    <div class="notes-img-panel" style="width:500px">
      <div class="notes-img-title">${getIcon('note', 20)} Not Detayı</div>
      ${note.type === 'photo' ? `
        <div style="display:flex;justify-content:center;margin-bottom:14px">
          <div class="note-shape-photo frame-${note.frame||'classic'}" style="position:relative">
            <img src="${note.img}" draggable="false"/>
          </div>
        </div>
        <div class="notes-form-label">Açıklama</div>
        ${toolbar}
        <div class="notes-rt-editor" id="nd-caption" contenteditable="true">${note.caption || ''}</div>
      ` : `
        <div class="notes-form-label">İçerik · ${shapeLabels[note.shape]||'Kart'}</div>
        ${toolbar}
        <div class="notes-rt-editor" id="nd-text" contenteditable="true" style="min-height:140px">${note.text || ''}</div>
      `}
      <div style="font-family:'Crimson Pro',serif;font-size:12px;color:var(--ink-faint);font-style:italic;margin-top:8px">
        ${note.pinned ? 'Pinlenmiş · ' : ''}${connCount} bağlantı
      </div>
      <div class="notes-form-actions">
        <button class="notes-tool-btn" id="nd-close">Kapat</button>
        <button class="notes-tool-btn" id="nd-save" style="background:var(--accent);color:#fff;border-color:var(--accent)">Kaydet</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const editor = overlay.querySelector('#nd-text') || overlay.querySelector('#nd-caption');

  // Biçimlendirme butonları
  overlay.querySelectorAll('.notes-rt-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault()); // seçimi koru
    btn.addEventListener('click', async () => {
      const cmd = btn.dataset.cmd;
      if (cmd === 'link') {
        // Seçimi kaydet (dialog açılınca kaybolur)
        const sel = window.getSelection();
        const hasText = sel && sel.toString().trim();
        const savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;

        let url = await showDialog({
          icon: getIcon('link', 28), title: 'Bağlantı Ekle',
          message: 'Bağlantı adresini gir:', input: true, inputPlaceholder: 'https://…',
          confirmText: 'Ekle', cancelText: 'İptal',
        });
        if (!url) return;
        url = url.trim();
        if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) url = 'https://' + url;

        // Kaydedilen seçimi geri yükle
        editor.focus();
        if (savedRange) {
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(savedRange);
        }

        if (hasText) {
          document.execCommand('createLink', false, url);
        } else {
          document.execCommand('insertHTML', false, `<a href="${url}">${url}</a>&nbsp;`);
        }
      } else {
        document.execCommand(cmd, false, null);
        editor.focus();
      }
    });
  });

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#nd-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelector('#nd-save').addEventListener('click', () => {
    const d = loadNotesData();
    const n = d.notes.find(x => x.id === noteId);
    if (n) {
      if (n.type === 'photo') n.caption = editor.innerHTML;
      else n.text = editor.innerHTML;
      saveNotesData(d);
      renderCanvas();
      renderNotesWidget();
    }
    close();
  });

  setTimeout(() => editor.focus(), 50);
}

/* ── ORTAK SÜRÜKLEME — not, foto, portal hepsi bunu kullanır ── */
function makeDraggable(el, obj, opts) {
  // obj: x,y olan herhangi bir nesne (note veya portal)
  // opts: { onMove, onEnd, onClick, skipSelector }
  opts = opts || {};
  let sx, sy, ox, oy, moved;

  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (opts.skipSelector && e.target.closest(opts.skipSelector)) return;
    // Bağlama modunda: tıklanan öğede onClick'i çalıştır (bağlamayı tamamla), sürükleme başlatma
    if (notesView.linkingFrom) {
      e.preventDefault();
      e.stopPropagation();
      if (opts.onClick) opts.onClick(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    sx = e.clientX;
    sy = e.clientY;
    ox = Number(obj.x) || 0;
    oy = Number(obj.y) || 0;
    moved = false;

    const onMove = ev => {
      const scale = notesView.scale || 1;
      const dx = (ev.clientX - sx) / scale;
      const dy = (ev.clientY - sy) / scale;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      obj.x = ox + dx;
      obj.y = oy + dy;
      el.style.left = obj.x + 'px';
      el.style.top  = obj.y + 'px';
      if (opts.onMove) opts.onMove();
    };

    const onUp = ev => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (moved) {
        if (opts.onEnd) opts.onEnd(obj.x, obj.y);
      } else {
        if (opts.onClick) opts.onClick(ev);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

/* Geriye dönük uyumluluk — eski çağrılar için */
function makeNoteDraggable(el, note) {
  makeDraggable(el, note, {
    skipSelector: 'a',
    onMove: () => drawConnections(),
    onEnd: (x, y) => {
      const data = loadNotesData();
      const n = data.notes.find(z => z.id === note.id);
      if (n) { n.x = x; n.y = y; saveNotesData(data); }
    },
    onClick: () => {
      // Bağlama modundaysa detay açma (bağlamayı tamamla)
      if (notesView.linkingFrom && notesView.linkingFrom !== note.id) {
        finishLinking(note.id);
        return;
      }
      openNoteDetail(note.id);
    },
  });
}

/* ── Portal kartı ── */
const PORTAL_ICONS = ['portal', 'proj_folder', 'proj_work', 'proj_code', 'proj_web', 'proj_graph', 'proj_person'];

function renderPortalEl(portal, canvas, data) {
  const count = data.notes.filter(n => n.portalId === portal.id).length;
  const el = document.createElement('div');
  el.className = 'note-portal';
  el.dataset.pid = portal.id;
  el.style.left = (portal.x || 100) + 'px';
  el.style.top  = (portal.y || 100) + 'px';
  const iconName = portal.icon && PORTAL_ICONS.includes(portal.icon) ? portal.icon : 'portal';
  el.innerHTML = `
    ${portal.passwordHash ? `<span class="note-portal-lock">${getIcon('lock', 14)}</span>` : ''}
    <div class="note-portal-icon">${getIcon(iconName, 36)}</div>
    <div class="note-portal-name">${escapeHtml(portal.name)}</div>
    <div class="note-portal-meta">${count} not</div>
  `;

  // Sağ tık → portal menüsü
  el.addEventListener('contextmenu', e => {
    e.preventDefault(); e.stopPropagation();
    showPortalContextMenu(e.clientX, e.clientY, portal);
  });

  // Sürükleme (notlarla AYNI fonksiyon) + tek tık ile girme
  makeDraggable(el, portal, {
    onEnd: (x, y) => {
      const d = loadNotesData();
      const p = d.portals.find(z => z.id === portal.id);
      if (p) { p.x = x; p.y = y; saveNotesData(d); }
    },
    onClick: () => enterPortal(portal),
  });

  canvas.appendChild(el);
}

async function enterPortal(portal) {
  if (portal.passwordHash) {
    const pw = await showDialog({
      icon: getIcon('lock', 28), title: 'Kilitli Portal',
      message: 'Şifreyi gir:', input: true, inputPlaceholder: 'Şifre…',
      confirmText: 'Aç', cancelText: 'İptal',
    });
    if (pw === null) return;
    if (hashPassword(pw) !== portal.passwordHash) {
      showToast('Yanlış şifre.', 'error');
      return;
    }
  }
  notesView.currentPortal = portal.id;
  notesView.offsetX = 0; notesView.offsetY = 0; notesView.scale = 1;
  renderNotesModule();
}

/* ── Bağlantılar (ip) ── */
/* ════════════════════════════════════════
   ÇİZİM KATMANI
   ════════════════════════════════════════ */
const SVGNS = 'http://www.w3.org/2000/svg';

function toggleDrawToolbar() {
  const existing = document.getElementById('notes-draw-toolbar');
  if (existing) { closeDrawToolbar(); return; }

  const bar = document.createElement('div');
  bar.className = 'notes-draw-toolbar';
  bar.id = 'notes-draw-toolbar';
  const tools = [
    { id: 'pen',     icon: 'draw_pen',     name: 'Kalem' },
    { id: 'line',    icon: 'draw_line',    name: 'Çizgi' },
    { id: 'arrow',   icon: 'draw_arrow',   name: 'Ok' },
    { id: 'rect',    icon: 'draw_rect',    name: 'Dikdörtgen' },
    { id: 'ellipse', icon: 'draw_ellipse', name: 'Elips' },
    { id: 'eraser',  icon: 'draw_eraser',  name: 'Silgi' },
  ];
  const colors = ['#d8443a', '#2a6cc0', '#3a9e5a', '#e0a020', '#9050c0', '#2c2416', '#f5f0e8'];

  bar.innerHTML = `
    <div class="ndt-tools">
      ${tools.map(t => `
        <button class="ndt-tool${notesView.drawTool===t.id?' active':''}" data-tool="${t.id}" title="${t.name}">${getIcon(t.icon, 18)}</button>
      `).join('')}
    </div>
    <div class="ndt-sep"></div>
    <div class="ndt-colors">
      ${colors.map(c => `<span class="ndt-color${notesView.drawColor===c?' active':''}" data-color="${c}" style="background:${c}"></span>`).join('')}
    </div>
    <div class="ndt-sep"></div>
    <div class="ndt-width">
      <input type="range" id="ndt-width" min="1" max="12" value="${notesView.drawWidth}"/>
    </div>
    <div class="ndt-sep"></div>
    <button class="ndt-clear" id="ndt-clear" title="Tümünü temizle">${getIcon('trash', 15)}</button>
    <button class="ndt-close" id="ndt-close" title="Kapat">${getIcon('x', 15)}</button>
  `;
  document.getElementById('module-notes').appendChild(bar);

  bar.querySelectorAll('.ndt-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      notesView.drawTool = notesView.drawTool === tool ? null : tool;
      bar.querySelectorAll('.ndt-tool').forEach(b => b.classList.toggle('active', b.dataset.tool === notesView.drawTool));
      updateDrawCursor();
    });
  });
  bar.querySelectorAll('.ndt-color').forEach(c => {
    c.addEventListener('click', () => {
      notesView.drawColor = c.dataset.color;
      bar.querySelectorAll('.ndt-color').forEach(x => x.classList.toggle('active', x.dataset.color === notesView.drawColor));
    });
  });
  bar.querySelector('#ndt-width').addEventListener('input', function() {
    notesView.drawWidth = parseInt(this.value);
  });
  bar.querySelector('#ndt-clear').addEventListener('click', async () => {
    const ok = await showDialog({
      icon: getIcon('trash', 28), title: 'Çizimleri Temizle',
      message: 'Bu panodaki tüm çizimler silinecek.',
      confirmText: 'Temizle', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    const data = loadNotesData();
    data.drawings = data.drawings.filter(d => (d.portalId||null) !== notesView.currentPortal);
    saveNotesData(data);
    drawDrawings();
  });
  bar.querySelector('#ndt-close').addEventListener('click', closeDrawToolbar);
}

function closeDrawToolbar() {
  notesView.drawTool = null;
  document.getElementById('notes-draw-toolbar')?.remove();
  updateDrawCursor();
}

function updateDrawCursor() {
  const wrap = document.getElementById('notes-canvas-wrap');
  if (!wrap) return;
  wrap.classList.toggle('drawing', !!notesView.drawTool);
  drawDrawings(); // silgi modunda pointer-events güncellensin
}

/* Ekran koordinatını canvas koordinatına çevir */
function screenToCanvas(clientX, clientY) {
  const wrap = document.getElementById('notes-canvas-wrap');
  const rect = wrap.getBoundingClientRect();
  return {
    x: (clientX - rect.left - notesView.offsetX) / notesView.scale,
    y: (clientY - rect.top  - notesView.offsetY) / notesView.scale,
  };
}

function startDrawing(e) {
  const tool = notesView.drawTool;
  const start = screenToCanvas(e.clientX, e.clientY);

  // Silgi: tıklanan çizimi sil
  if (tool === 'eraser') {
    eraseAt(e.target);
    const onMove = ev => { eraseAt(ev.target); };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return;
  }

  const svg = document.getElementById('notes-drawings');
  let el, points = [start];

  if (tool === 'pen') {
    el = document.createElementNS(SVGNS, 'path');
    el.setAttribute('d', `M ${start.x} ${start.y}`);
    el.setAttribute('fill', 'none');
  } else if (tool === 'line' || tool === 'arrow') {
    el = document.createElementNS(SVGNS, 'line');
    el.setAttribute('x1', start.x); el.setAttribute('y1', start.y);
    el.setAttribute('x2', start.x); el.setAttribute('y2', start.y);
    if (tool === 'arrow') {
      // Canlı önizleme için marker garantile
      const svgEl = document.getElementById('notes-drawings');
      const safe = notesView.drawColor.replace('#','');
      if (!svgEl.querySelector(`#ndt-arrow-${safe}`)) {
        let defs = svgEl.querySelector('defs');
        if (!defs) { defs = document.createElementNS(SVGNS, 'defs'); svgEl.insertBefore(defs, svgEl.firstChild); }
        const m = document.createElementNS(SVGNS, 'marker');
        m.id = `ndt-arrow-${safe}`;
        m.setAttribute('markerWidth','8'); m.setAttribute('markerHeight','8');
        m.setAttribute('refX','6'); m.setAttribute('refY','3'); m.setAttribute('orient','auto');
        const ap = document.createElementNS(SVGNS, 'path');
        ap.setAttribute('d','M0,0 L6,3 L0,6 Z'); ap.setAttribute('fill', notesView.drawColor);
        m.appendChild(ap); defs.appendChild(m);
      }
      el.setAttribute('marker-end', `url(#ndt-arrow-${safe})`);
    }
  } else if (tool === 'rect') {
    el = document.createElementNS(SVGNS, 'rect');
    el.setAttribute('x', start.x); el.setAttribute('y', start.y);
    el.setAttribute('width', 0); el.setAttribute('height', 0);
    el.setAttribute('fill', 'none');
  } else if (tool === 'ellipse') {
    el = document.createElementNS(SVGNS, 'ellipse');
    el.setAttribute('cx', start.x); el.setAttribute('cy', start.y);
    el.setAttribute('rx', 0); el.setAttribute('ry', 0);
    el.setAttribute('fill', 'none');
  }
  el.setAttribute('stroke', notesView.drawColor);
  el.setAttribute('stroke-width', notesView.drawWidth);
  el.setAttribute('stroke-linecap', 'round');
  el.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(el);

  const onMove = ev => {
    const p = screenToCanvas(ev.clientX, ev.clientY);
    if (tool === 'pen') {
      points.push(p);
      el.setAttribute('d', el.getAttribute('d') + ` L ${p.x} ${p.y}`);
    } else if (tool === 'line' || tool === 'arrow') {
      el.setAttribute('x2', p.x); el.setAttribute('y2', p.y);
    } else if (tool === 'rect') {
      el.setAttribute('x', Math.min(start.x, p.x));
      el.setAttribute('y', Math.min(start.y, p.y));
      el.setAttribute('width', Math.abs(p.x - start.x));
      el.setAttribute('height', Math.abs(p.y - start.y));
    } else if (tool === 'ellipse') {
      el.setAttribute('cx', (start.x + p.x) / 2);
      el.setAttribute('cy', (start.y + p.y) / 2);
      el.setAttribute('rx', Math.abs(p.x - start.x) / 2);
      el.setAttribute('ry', Math.abs(p.y - start.y) / 2);
    }
  };
  const onUp = ev => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    const end = screenToCanvas(ev.clientX, ev.clientY);

    // Kaydet
    const data = loadNotesData();
    const draw = {
      id: newDrawId(), type: tool, color: notesView.drawColor,
      width: notesView.drawWidth, portalId: notesView.currentPortal,
    };
    if (tool === 'pen') {
      draw.d = el.getAttribute('d');
    } else if (tool === 'line' || tool === 'arrow') {
      draw.x1 = start.x; draw.y1 = start.y; draw.x2 = end.x; draw.y2 = end.y;
    } else if (tool === 'rect') {
      draw.x = Math.min(start.x, end.x); draw.y = Math.min(start.y, end.y);
      draw.w = Math.abs(end.x - start.x); draw.h = Math.abs(end.y - start.y);
    } else if (tool === 'ellipse') {
      draw.cx = (start.x + end.x) / 2; draw.cy = (start.y + end.y) / 2;
      draw.rx = Math.abs(end.x - start.x) / 2; draw.ry = Math.abs(end.y - start.y) / 2;
    }
    // Çok küçük/boş çizimleri atla
    const tiny = (tool==='rect' && draw.w<3 && draw.h<3) ||
                 (tool==='ellipse' && draw.rx<3 && draw.ry<3) ||
                 ((tool==='line'||tool==='arrow') && Math.abs(draw.x2-draw.x1)<3 && Math.abs(draw.y2-draw.y1)<3);
    if (!tiny) {
      data.drawings.push(draw);
      saveNotesData(data);
    }
    drawDrawings();
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function eraseAt(target) {
  if (!target || !target.dataset || !target.dataset.drawId) return;
  const data = loadNotesData();
  data.drawings = data.drawings.filter(d => d.id !== target.dataset.drawId);
  saveNotesData(data);
  target.remove();
}

function drawDrawings() {
  const svg = document.getElementById('notes-drawings');
  if (!svg) return;
  const data = loadNotesData();
  const pid = notesView.currentPortal;
  const draws = data.drawings.filter(d => (d.portalId||null) === pid);

  // Ok renkleri için benzersiz marker'lar oluştur
  const arrowColors = [...new Set(draws.filter(d => d.type === 'arrow').map(d => d.color))];
  const defs = `
    <defs>
      ${arrowColors.map(col => {
        const safe = col.replace('#','');
        return `<marker id="ndt-arrow-${safe}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="${col}"/>
        </marker>`;
      }).join('')}
    </defs>
  `;
  svg.innerHTML = defs;

  draws.forEach(d => {
    let el;
    if (d.type === 'pen') {
      el = document.createElementNS(SVGNS, 'path');
      el.setAttribute('d', d.d);
      el.setAttribute('fill', 'none');
    } else if (d.type === 'line' || d.type === 'arrow') {
      el = document.createElementNS(SVGNS, 'line');
      el.setAttribute('x1', d.x1); el.setAttribute('y1', d.y1);
      el.setAttribute('x2', d.x2); el.setAttribute('y2', d.y2);
      if (d.type === 'arrow') {
        el.setAttribute('marker-end', `url(#ndt-arrow-${d.color.replace('#','')})`);
      }
    } else if (d.type === 'rect') {
      el = document.createElementNS(SVGNS, 'rect');
      el.setAttribute('x', d.x); el.setAttribute('y', d.y);
      el.setAttribute('width', d.w); el.setAttribute('height', d.h);
      el.setAttribute('fill', 'none');
    } else if (d.type === 'ellipse') {
      el = document.createElementNS(SVGNS, 'ellipse');
      el.setAttribute('cx', d.cx); el.setAttribute('cy', d.cy);
      el.setAttribute('rx', d.rx); el.setAttribute('ry', d.ry);
      el.setAttribute('fill', 'none');
    }
    if (!el) return;
    el.setAttribute('stroke', d.color);
    el.setAttribute('stroke-width', d.width);
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    el.dataset.drawId = d.id;
    el.style.pointerEvents = notesView.drawTool === 'eraser' ? 'stroke' : 'none';
    svg.appendChild(el);
  });
}

function drawConnections() {
  const svg = document.getElementById('notes-connections');
  const canvas = document.getElementById('notes-canvas');
  if (!svg || !canvas) return;

  const data = loadNotesData();
  const pid = notesView.currentPortal;
  const conns = data.connections.filter(c => (c.portalId || null) === pid);

  svg.innerHTML = '';

  conns.forEach(conn => {
    const fromEl = canvas.querySelector(`.note-item[data-id="${conn.from}"]`);
    const toEl   = canvas.querySelector(`.note-item[data-id="${conn.to}"]`);
    if (!fromEl || !toEl) return;

    // Pin noktası = kartın üst-orta (raptiyenin olduğu yer)
    const fx = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const fy = fromEl.offsetTop - 2;
    const tx = toEl.offsetLeft + toEl.offsetWidth / 2;
    const ty = toEl.offsetTop - 2;

    // İp sarkması
    const midX = (fx + tx) / 2;
    const midY = (fy + ty) / 2 + Math.abs(tx - fx) * 0.12 + 25;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${fx} ${fy} Q ${midX} ${midY} ${tx} ${ty}`);
    path.setAttribute('class', 'note-connection');
    svg.appendChild(path);
  });
}

function startLinking(noteId) {
  notesView.linkingFrom = noteId;
  document.getElementById('notes-canvas-wrap')?.classList.add('linking');
  showToast('Bağlamak istediğin nota tıkla.', 'default', 3000);
}

function finishLinking(toId) {
  const fromId = notesView.linkingFrom;
  notesView.linkingFrom = null;
  document.getElementById('notes-canvas-wrap')?.classList.remove('linking');
  if (!fromId || fromId === toId) return;

  const data = loadNotesData();
  // Zaten varsa kaldır (toggle)
  const existing = data.connections.find(c =>
    (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  );
  if (existing) {
    data.connections = data.connections.filter(c => c.id !== existing.id);
  } else {
    data.connections.push({ id: newConnId(), from: fromId, to: toId, portalId: notesView.currentPortal });
  }
  saveNotesData(data);
  drawConnections();
}

/* ── Not ekleme ── */
function addNote(shape, x, y) {
  const data = loadNotesData();
  const wrap = document.getElementById('notes-canvas-wrap');
  const cx = x ?? (-notesView.offsetX + (wrap?.offsetWidth||600)/2) / notesView.scale - 90;
  const cy = y ?? (-notesView.offsetY + (wrap?.offsetHeight||400)/2) / notesView.scale - 60;

  data.notes.push({
    id: newNoteId(), type: 'note', shape: shape || 'postit',
    text: '', color: 'yellow', x: cx, y: cy,
    pinned: false, portalId: notesView.currentPortal,
  });
  saveNotesData(data);
  renderCanvas();
}

/* ── Şekil seçim menüsü (üst bar Not butonu) ── */
function showShapePickerMenu(x, y) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'notes-ctx-menu';
  menu.id = 'notes-ctx-menu';
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.innerHTML = `
    <button class="notes-ctx-item" data-shape="postit">${getIcon('note',14)} Post-it</button>
    <button class="notes-ctx-item" data-shape="paper">${getIcon('note',14)} Defter Yaprağı</button>
    <button class="notes-ctx-item" data-shape="news">${getIcon('note',14)} Gazete</button>
    <button class="notes-ctx-item" data-shape="card">${getIcon('note',14)} Kart</button>
  `;
  document.body.appendChild(menu);

  menu.querySelectorAll('.notes-ctx-item[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      addNote(btn.dataset.shape);
      closeContextMenu();
    });
  });

  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}

/* ── Canvas sağ tık menüsü ── */
function showCanvasContextMenu(screenX, screenY, canvasX, canvasY) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'notes-ctx-menu';
  menu.id = 'notes-ctx-menu';
  menu.style.left = screenX + 'px';
  menu.style.top  = screenY + 'px';
  menu.innerHTML = `
    <button class="notes-ctx-item" data-shape="postit">${getIcon('note',14)} Post-it</button>
    <button class="notes-ctx-item" data-shape="paper">${getIcon('note',14)} Defter Yaprağı</button>
    <button class="notes-ctx-item" data-shape="news">${getIcon('note',14)} Gazete</button>
    <button class="notes-ctx-item" data-shape="card">${getIcon('note',14)} Kart</button>
    <div class="notes-ctx-sep"></div>
    <button class="notes-ctx-item" id="ctx-photo">${getIcon('image',14)} Fotoğraf</button>
    ${!notesView.currentPortal ? `<button class="notes-ctx-item" id="ctx-portal">${getIcon('portal',14)} Portal</button>` : ''}
  `;
  document.body.appendChild(menu);

  menu.querySelectorAll('.notes-ctx-item[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      addNote(btn.dataset.shape, canvasX, canvasY);
      closeContextMenu();
    });
  });
  menu.querySelector('#ctx-photo').addEventListener('click', () => { closeContextMenu(); openImageForm(canvasX, canvasY); });
  menu.querySelector('#ctx-portal')?.addEventListener('click', () => { closeContextMenu(); openPortalForm(canvasX, canvasY); });

  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}

function showPortalContextMenu(x, y, portal) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'notes-ctx-menu';
  menu.id = 'notes-ctx-menu';
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.innerHTML = `
    <button class="notes-ctx-item" id="pctx-open">${getIcon('portal',14)} Aç</button>
    <button class="notes-ctx-item" id="pctx-rename">${getIcon('edit',14)} Yeniden Adlandır</button>
    <button class="notes-ctx-item" id="pctx-icon">${getIcon('image',14)} İkon Değiştir</button>
    <button class="notes-ctx-item" id="pctx-lock">
      ${getIcon(portal.passwordHash ? 'unlock' : 'lock', 14)}
      ${portal.passwordHash ? 'Kilidi Kaldır' : 'Şifre Koy'}
    </button>
    <div class="notes-ctx-sep"></div>
    <button class="notes-ctx-item" id="pctx-del">${getIcon('trash',14)} Portalı Sil</button>
  `;
  document.body.appendChild(menu);

  menu.querySelector('#pctx-open').addEventListener('click', () => {
    closeContextMenu();
    enterPortal(portal);
  });

  menu.querySelector('#pctx-rename').addEventListener('click', async () => {
    closeContextMenu();
    const name = await showDialog({
      icon: getIcon('edit', 28), title: 'Portalı Yeniden Adlandır',
      message: 'Yeni ad:', input: true, inputPlaceholder: portal.name,
      confirmText: 'Kaydet', cancelText: 'İptal',
    });
    if (!name) return;
    const data = loadNotesData();
    const p = data.portals.find(x => x.id === portal.id);
    if (p) { p.name = name.trim(); saveNotesData(data); renderCanvas(); }
  });

  menu.querySelector('#pctx-icon').addEventListener('click', () => {
    closeContextMenu();
    openPortalIconPicker(portal);
  });

  menu.querySelector('#pctx-lock').addEventListener('click', async () => {
    closeContextMenu();
    const data = loadNotesData();
    const p = data.portals.find(x => x.id === portal.id);
    if (p.passwordHash) {
      // Kilidi kaldır — mevcut şifreyi sor
      const pw = await showDialog({ icon:getIcon('unlock',28), title:'Kilidi Kaldır', message:'Mevcut şifreyi gir:', input:true, inputPlaceholder:'Şifre…', confirmText:'Kaldır', cancelText:'İptal' });
      if (pw === null) return;
      if (hashPassword(pw) !== p.passwordHash) { showToast('Yanlış şifre.', 'error'); return; }
      p.passwordHash = null;
      saveNotesData(data);
      showToast('Kilit kaldırıldı.', 'success');
    } else {
      const pw = await showDialog({ icon:getIcon('lock',28), title:'Şifre Koy', message:'Yeni şifre belirle:', input:true, inputPlaceholder:'Şifre…', confirmText:'Kilitle', cancelText:'İptal' });
      if (!pw) return;
      p.passwordHash = hashPassword(pw);
      saveNotesData(data);
      showToast('Portal kilitlendi.', 'success');
    }
    renderCanvas();
  });

  menu.querySelector('#pctx-del').addEventListener('click', async () => {
    closeContextMenu();
    const ok = await showDialog({ icon:getIcon('trash',28), title:'Portalı Sil', message:'Portal ve içindeki tüm notlar silinecek.', confirmText:'Sil', cancelText:'Vazgeç', danger:true });
    if (!ok) return;
    const data = loadNotesData();
    data.notes = data.notes.filter(n => n.portalId !== portal.id);
    data.connections = data.connections.filter(c => c.portalId !== portal.id);
    data.portals = data.portals.filter(p => p.id !== portal.id);
    saveNotesData(data);
    renderCanvas();
  });

  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}

function closeContextMenu() {
  document.getElementById('notes-ctx-menu')?.remove();
}

/* ── Portal ikon seçici ── */
function openPortalIconPicker(portal) {
  const overlay = document.createElement('div');
  overlay.className = 'notes-portal-overlay';
  overlay.id = 'notes-portal-overlay';
  const current = portal.icon || 'portal';
  overlay.innerHTML = `
    <div class="notes-portal-panel" style="width:360px">
      <div class="notes-portal-title">${getIcon('image', 20)} Portal İkonu</div>
      <div class="proj-icon-grid">
        ${PORTAL_ICONS.map(name => `
          <button class="proj-icon-option${name === current ? ' active' : ''}" data-icon="${name}">
            ${getIcon(name, 30)}
          </button>
        `).join('')}
      </div>
      <div class="notes-form-actions">
        <button class="notes-tool-btn" id="pic-close">Kapat</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#pic-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelectorAll('.proj-icon-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = loadNotesData();
      const p = data.portals.find(x => x.id === portal.id);
      if (p) { p.icon = btn.dataset.icon; saveNotesData(data); renderCanvas(); }
      close();
    });
  });
}

/* ── Portal oluşturma formu ── */
function openPortalForm(x, y) {
  const overlay = document.createElement('div');
  overlay.className = 'notes-portal-overlay';
  overlay.id = 'notes-portal-overlay';
  overlay.innerHTML = `
    <div class="notes-portal-panel">
      <div class="notes-portal-title">${getIcon('portal', 20)} Yeni Portal</div>
      <div class="notes-form-label">Portal adı</div>
      <input class="notes-form-input" id="portal-name" placeholder="Örn. Gizli Notlar, Proje X…" maxlength="40"/>
      <div class="notes-form-label">Şifre (opsiyonel — boş bırakılırsa kilitsiz)</div>
      <input class="notes-form-input" id="portal-pw" type="password" placeholder="Şifre…" maxlength="40"/>
      <div class="notes-form-actions">
        <button class="notes-tool-btn" id="portal-cancel">İptal</button>
        <button class="notes-tool-btn" id="portal-create" style="background:var(--accent);color:#fff;border-color:var(--accent)">Oluştur</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#portal-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  setTimeout(() => overlay.querySelector('#portal-name').focus(), 50);

  overlay.querySelector('#portal-create').addEventListener('click', () => {
    const name = overlay.querySelector('#portal-name').value.trim();
    if (!name) { overlay.querySelector('#portal-name').focus(); return; }
    const pw = overlay.querySelector('#portal-pw').value;

    const data = loadNotesData();
    const wrap = document.getElementById('notes-canvas-wrap');
    const px = x ?? (-notesView.offsetX + (wrap?.offsetWidth||600)/2) / notesView.scale - 70;
    const py = y ?? (-notesView.offsetY + (wrap?.offsetHeight||400)/2) / notesView.scale - 60;

    data.portals.push({
      id: newPortalId(), name, x: px, y: py,
      passwordHash: pw ? hashPassword(pw) : null,
    });
    saveNotesData(data);
    close();
    renderCanvas();
  });
}

/* ── Resim yükleme formu ── */
function openImageForm(x, y) {
  let imgData = null;
  let selectedFrame = 'classic';

  const overlay = document.createElement('div');
  overlay.className = 'notes-img-overlay';
  overlay.id = 'notes-img-overlay';
  overlay.innerHTML = `
    <div class="notes-img-panel">
      <div class="notes-img-title">${getIcon('image', 20)} Fotoğraf Ekle</div>
      <div class="notes-img-drop" id="img-drop">
        Tıkla veya sürükle-bırak ile fotoğraf seç
      </div>
      <input type="file" id="img-file" accept="image/*" style="display:none"/>
      <div id="img-preview-wrap" style="display:none">
        <div style="display:flex;justify-content:center;margin-bottom:8px">
          <div class="note-shape-photo frame-classic" id="img-preview-frame" style="position:relative">
            <img id="img-preview" draggable="false"/>
            <div class="note-photo-caption">Önizleme</div>
          </div>
        </div>
        <div class="notes-form-label" style="margin-top:12px">Çerçeve</div>
        <div class="notes-frame-row" id="frame-row">
          ${['classic','gold','wood','vintage','none'].map(f => `
            <button class="notes-frame-opt${f==='classic'?' active':''}" data-frame="${f}">
              ${ {classic:'Klasik',gold:'Altın',wood:'Ahşap',vintage:'Vintage',none:'Çerçevesiz'}[f] }
            </button>
          `).join('')}
        </div>
      </div>
      <div class="notes-form-actions">
        <button class="notes-tool-btn" id="img-cancel">İptal</button>
        <button class="notes-tool-btn" id="img-add" style="background:var(--accent);color:#fff;border-color:var(--accent);opacity:0.5;pointer-events:none">Ekle</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);

  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#img-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const fileInput = overlay.querySelector('#img-file');
  const drop = overlay.querySelector('#img-drop');
  const addBtn = overlay.querySelector('#img-add');

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadImageFile(fileInput.files[0]);
  });

  function loadImageFile(file) {
    if (!file.type.startsWith('image/')) { showToast('Sadece resim dosyası.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      imgData = reader.result;
      overlay.querySelector('#img-preview').src = imgData;
      overlay.querySelector('#img-preview-wrap').style.display = 'block';
      drop.style.display = 'none';
      addBtn.style.opacity = '1';
      addBtn.style.pointerEvents = 'auto';
    };
    reader.readAsDataURL(file);
  }

  overlay.querySelectorAll('.notes-frame-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.notes-frame-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFrame = btn.dataset.frame;
      const frameEl = overlay.querySelector('#img-preview-frame');
      frameEl.className = 'note-shape-photo frame-' + selectedFrame;
    });
  });

  addBtn.addEventListener('click', () => {
    if (!imgData) return;
    const data = loadNotesData();
    const wrap = document.getElementById('notes-canvas-wrap');
    const px = x ?? (-notesView.offsetX + (wrap?.offsetWidth||600)/2) / notesView.scale - 90;
    const py = y ?? (-notesView.offsetY + (wrap?.offsetHeight||400)/2) / notesView.scale - 90;

    data.notes.push({
      id: newNoteId(), type: 'photo', img: imgData,
      frame: selectedFrame, caption: '', x: px, y: py,
      pinned: false, portalId: notesView.currentPortal,
    });
    saveNotesData(data);
    close();
    renderCanvas();
  });
}