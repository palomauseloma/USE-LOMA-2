(function () {
  const listeners = {};
  App.emit = function (evt, data) {
    (listeners[evt] || []).forEach((fn) => {
      try { fn(data); } catch (e) { console.error(e); }
    });
  };
  App.on = function (evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
  };

  App.money = function (v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (isNaN(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  App.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  App.slugify = function (s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  App.formatDate = function (d) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  App.phoneDigits = function (n) {
    let d = String(n || '').replace(/\D/g, '');
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    if (!d.startsWith('55')) d = '55' + d;
    return d;
  };

  App.formatPhone = function (n) {
    let d = String(n || '').replace(/\D/g, '');
    if (d.length === 13 && d.startsWith('55')) d = d.slice(2);
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return n || '';
  };

  App.whatsLink = function (number, message) {
    const digits = App.phoneDigits(number);
    return 'https://wa.me/' + digits + (message ? '?text=' + encodeURIComponent(message) : '');
  };

  App.img = function (url) {
    if (url) return url;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#e6ccb2"/><text x="50%" y="50%" font-family="serif" font-size="40" fill="#a98c70" text-anchor="middle">USE LOMA</text></svg>'
    );
  };

  App.toast = function (msg, type) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.innerHTML = '<span>' + App.esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3800);
  };

  App.modal = function (html, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    if (!root) return { close: function () {} };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-card ' + (opts.size || '') + '">' + html + '</div>';
    const close = function () { overlay.remove(); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    root.appendChild(overlay);
    return { close: close, el: overlay };
  };

  App.confirm = function (msg, onYes) {
    const m = App.modal(
      '<div class="modal-body"><p>' + App.esc(msg) + '</p>' +
      '<div class="modal-actions"><button class="btn btn-outline" data-close>CANCELAR</button>' +
      '<button class="btn btn-primary" data-yes>CONFIRMAR</button></div></div>'
    );
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    m.el.querySelector('[data-yes]').addEventListener('click', function () { m.close(); onYes && onYes(); });
  };

  App.loading = function (show) {
    let el = document.getElementById('global-loader');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'global-loader';
        el.className = 'global-loader';
        el.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(el);
      }
      el.style.display = 'flex';
    } else if (el) {
      el.style.display = 'none';
    }
  };

  App.validateEmail = function (e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''));
  };

  App.validatePhone = function (p) {
    return /\d{10,13}$/.test(String(p || '').replace(/\D/g, ''));
  };

  App.validateCpf = function (cpf) {
    const c = String(cpf || '').replace(/\D/g, '');
    if (c.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(c)) return false;
    let sum = 0, rev, i;
    for (i = 0; i < 9; i++) sum += parseInt(c.charAt(i), 10) * (10 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(c.charAt(9), 10)) return false;
    sum = 0;
    for (i = 0; i < 10; i++) sum += parseInt(c.charAt(i), 10) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(c.charAt(10), 10)) return false;
    return true;
  };

  App.formatCpf = function (cpf) {
    const c = String(cpf || '').replace(/\D/g, '');
    if (c.length !== 11) return cpf || '';
    return c.slice(0, 3) + '.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-' + c.slice(9);
  };

  App.icon = function (name) {
    const icons = {
      bag: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
      whats: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.6.1-.8l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>',
      lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
      google: '<svg viewBox="0 0 48 48" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
      close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      play: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l11-6.86a1.05 1.05 0 0 0 0-1.8l-11-6.86A1.05 1.05 0 0 0 8 5.14z"/></svg>'
    };
    return icons[name] || '';
  };

  App.mainImage = function (product) {
    const imgs = (product.product_images || []).slice().sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.sort_order - b.sort_order;
    });
    return imgs.length ? imgs[0].url : null;
  };
})();
