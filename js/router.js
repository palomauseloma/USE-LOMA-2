(function () {
  App.state = { user: null };
  App.cleanup = [];

  App.refreshAuth = async function () {
    const session = await App.api.getSession();
    if (session) {
      let profile = null;
      let isAdmin = false;
      try { profile = await App.api.getProfile(); } catch (e) {}
      try { isAdmin = await App.api.isAdmin(); } catch (e) {}
      App.state.user = { id: session.user.id, email: session.user.email, profile: profile, isAdmin: isAdmin };
    } else {
      App.state.user = null;
    }
    App.emit('auth');
  };

  App.parseRoute = function (hash) {
    let h = (hash || '').replace(/^#/, '') || '/';
    const [pathPart, queryPart] = h.split('?');
    const parts = pathPart.split('/').filter(Boolean);
    const query = {};
    (queryPart || '').split('&').forEach((kv) => {
      const [k, v] = kv.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { path: pathPart, parts, query, next: query.next };
  };

  App.dispatch = async function (route) {
    const p = route.parts;
    const app = document.getElementById('app');
    const s = App.STORE.settings;

    if (p.length === 0) return App.pages.home();

    switch (p[0]) {
      case 'novidades': return App.pages.catalog({ route: 'novidades' });
      case 'grupos': return App.pages.catalog({ route: 'grupos' });
      case 'catalogo': {
        return App.pages.catalog({ route: 'catalogo', category: route.query.cat || null, collection: route.query.col || null });
      }
      case 'colecoes': {
        const collections = await App.api.listCollections();
        return '<section class="page-head"><h1>Coleções</h1></section>' +
          (collections.length
            ? '<div class="collection-grid">' + collections.map((c) =>
                '<a class="collection-card" href="#/colecao/' + App.esc(c.slug) + '">' +
                '<img src="' + App.img(c.image_url) + '" alt="' + App.esc(c.name) + '">' +
                '<div class="collection-overlay"><span>' + App.esc(c.name) + '</span></div></a>').join('') + '</div>'
            : '<div class="empty">Nenhuma coleção cadastrada.</div>');
      }
      case 'categoria': {
        const cats = await App.api.listCategories();
        const c = cats.find((x) => x.slug === p[1]);
        if (!c) return '<div class="empty">Categoria não encontrada.</div>';
        return App.pages.catalog({ route: 'catalogo', category: c.id, name: c.name });
      }
      case 'colecao': {
        const cols = await App.api.listCollections();
        const c = cols.find((x) => x.slug === p[1]);
        if (!c) return '<div class="empty">Coleção não encontrada.</div>';
        return App.pages.catalog({ route: 'catalogo', collection: c.id, name: c.name });
      }
      case 'produto': return App.pages.product({ id: p[1] });
      case 'carrinho': return App.pages.cart();
      case 'checkout':
        if (!App.state.user) return App.pages.auth('login', { next: '#/checkout' });
        return App.pages.checkout();
      case 'login': return App.pages.auth('login', { next: route.next });
      case 'cadastro': return App.pages.auth('signup', { next: route.next });
      case 'conta':
        if (!App.state.user) return App.pages.auth('login', { next: '#/conta' });
        return App.pages.account(p[1]);
      case 'admin':
        if (!App.state.user) return App.pages.auth('login', { next: '#/admin' });
        return App.admin.render(route);
      default: return App.pages.home();
    }
  };

  App.bindRoute = function (route) {
    const p = route.parts;
    switch (p[0]) {
      case 'catalogo': App.bindCatalogFilters(); break;
      case 'produto': App.bindProduct({ id: p[1] }); break;
      case 'carrinho': App.bindCart(); break;
      case 'checkout':
        if (!App.state.user) App.bindAuth('login');
        else App.bindCheckout();
        break;
      case 'login': App.bindAuth('login'); break;
      case 'cadastro': App.bindAuth('signup'); break;
      case 'conta':
        if (!App.state.user) App.bindAuth('login');
        else App.bindAccount();
        break;
      case 'admin':
        if (!App.state.user) App.bindAuth('login');
        else App.admin.bind(route);
        break;
      default: break;
    }
  };

  App.render = async function () {
    App.cleanup.forEach((fn) => { try { fn(); } catch (e) {} });
    App.cleanup = [];
    const route = App.parseRoute(location.hash);
    const app = document.getElementById('app');
    let html = '';
    try {
      html = await App.dispatch(route);
    } catch (e) {
      console.error(e);
      html = '<div class="empty">Ocorreu um erro ao carregar esta página.</div>';
    }
    app.innerHTML = html;
    App.bindRoute(route);
    window.scrollTo(0, 0);
  };

  App.navigate = function (hash) {
    if (location.hash === hash) App.render();
    else location.hash = hash;
  };

  window.addEventListener('hashchange', App.render);
})();
