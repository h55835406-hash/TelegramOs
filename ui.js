/* ========================
   UI UTILITIES
======================== */

// Avatar color by nick
export function avatarColor(nick) {
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h << 5) - h + nick.charCodeAt(i);
  return `av-${Math.abs(h) % 8}`;
}

// Avatar initials
export function avatarInitials(nick) {
  return nick.slice(0, 2).toUpperCase();
}

// Format timestamp
export function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

// Show error on input with shake
export function showError(errorEl, msgEl, message) {
  msgEl.textContent = message;
  errorEl.classList.remove('hidden');
  errorEl.style.animation = 'none';
  requestAnimationFrame(() => {
    errorEl.style.animation = 'shakeX .4s ease';
  });
}

export function hideError(errorEl) {
  errorEl.classList.add('hidden');
}

// Ripple effect
export function addRipple(btn, e) {
  const container = btn.querySelector('.btn__ripple-container');
  if (!container) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = (e ? e.clientX : rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (e ? e.clientY : rect.top + rect.height / 2) - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// Set loading state on button
export function setLoading(btn, loading) {
  const text   = btn.querySelector('.btn__text');
  const loader = btn.querySelector('.btn__loader');
  btn.disabled = loading;
  if (loading) {
    text?.classList.add('hidden');
    loader?.classList.remove('hidden');
  } else {
    text?.classList.remove('hidden');
    loader?.classList.add('hidden');
  }
}

// Auto-resize textarea
export function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Scroll to bottom smooth
export function scrollToBottom(el, smooth = true) {
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}

// Toast notification
export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position:fixed;top:20px;right:20px;z-index:9999;
      display:flex;flex-direction:column;gap:8px;pointer-events:none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:${type === 'error' ? '#e06c75' : type === 'success' ? '#4dcd5e' : '#5288c1'};
    color:#fff;padding:10px 18px;border-radius:10px;
    font-size:.85rem;font-weight:500;font-family:'Inter',sans-serif;
    box-shadow:0 4px 20px rgba(0,0,0,.4);
    animation:fadeInUp .3s cubic-bezier(.34,1.56,.64,1) both;
    pointer-events:auto;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn .2s ease reverse';
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// Send button fly animation
export function animateSend(btn) {
  const icon = btn.querySelector('.send-icon');
  if (!icon) return;
  icon.style.animation = 'none';
  requestAnimationFrame(() => {
    icon.style.animation = 'planeFly .5s ease forwards';
    setTimeout(() => { icon.style.animation = ''; }, 500);
  });
}

// Tab switch
export function switchTab(tabIndicator, tabs, target) {
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === target);
  });
  if (target === 'register') {
    tabIndicator.classList.add('right');
  } else {
    tabIndicator.classList.remove('right');
  }
}
