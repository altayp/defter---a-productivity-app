/* ═══════════════════════════════════════
   core.js — Veri ve Yardımcı Fonksiyonlar
   ═══════════════════════════════════════ */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date, opts) {
  return new Intl.DateTimeFormat('tr-TR', opts || {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(date instanceof Date ? date : new Date(date));
}

/* ═══════════════════════════════════════
   Toast Bildirimleri — Global
   ═══════════════════════════════════════ */

function showToast(message, type = 'default', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const now = new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
  const labels = { default:'Bildirim', success:'Başarılı', error:'Hata' };

  const toast = document.createElement('div');
  toast.className = `toast${type !== 'default' ? ' ' + type : ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${getIcon('bell', 20)}</span>
    <div class="toast-body">
      <div class="toast-label">${labels[type] || 'Bildirim'}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
      <div class="toast-time">${now}</div>
    </div>
    <button class="toast-close">${getIcon('x', 12)}</button>
    <div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:${duration}ms"></div></div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  if (toast.classList.contains('removing')) return;
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 220);
}