(function () {
  function updateCartBadge() {
    const b = document.getElementById('cart-badge');
    if (b) b.textContent = App.cart.count();
  }

  async function boot() {
    try { App.STORE.settings = await App.api.getSiteSettings(); } catch (e) { console.error(e); }
    try { App.STORE.whatsapp = await App.api.getWhatsappSettings(); } catch (e) { console.error(e); }

    await App.refreshAuth();

    if (App.authFlow.type === 'signup' && App.state.user) {
      App.authFlow.type = null;
      App.navigate('#/confirmacao');
    } else if (App.authFlow.type === 'recovery') {
      App.authFlow.type = null;
      App.navigate('#/redefinir-senha');
    }

    App.applyTheme(App.STORE.settings);
    App.renderHeader(App.STORE.settings);
    App.renderFooter(App.STORE.settings);
    updateCartBadge();

    App.on('cart', updateCartBadge);
    App.on('auth', function () { App.renderHeader(App.STORE.settings); });

    App.api.onAuth(function () { App.refreshAuth(); });

    await App.render();
  }

  App.applyTheme = function (s) {
    const colors = (s && s.colors) || {};
    const root = document.documentElement;
    if (colors.primary) root.style.setProperty('--primary', colors.primary);
    if (colors.accent) root.style.setProperty('--accent', colors.accent);
    if (colors.background) root.style.setProperty('--bg', colors.background);
    if (colors.text) root.style.setProperty('--text', colors.text);
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
