(function () {
  App.pages = {};

  App.STORE = {
    settings: null,
    whatsapp: null
  };

  function navItem(href, label) {
    return '<a class="nav-link" href="' + href + '">' + label + '</a>';
  }

  App.renderHeader = function (s) {
    const header = document.getElementById('site-header');
    if (!header) return;
    const brand = s && s.brand ? s.brand : { name: 'USE LOMA', slogan: 'Moda Feminina', tagline: 'Mais que moda, é você bem vestida ♡', logo_url: null };
    const logoHtml = brand.logo_url
      ? '<img class="logo-img" src="' + App.esc(brand.logo_url) + '" alt="' + App.esc(brand.name) + '">'
      : '<span class="logo-name">' + App.esc(brand.name) + '</span><span class="logo-slogan">' + App.esc(brand.slogan) + '</span>';

    const user = App.state.user;
    const accountHref = user ? '#/conta' : '#/login';
    const accountLabel = user ? (user.profile && user.profile.full_name ? App.esc(user.profile.full_name.split(' ')[0]) : 'Minha conta') : 'Entrar';

    header.innerHTML =
      '<div class="announcement">' + App.esc(brand.tagline) + '</div>' +
      '<div class="header-main">' +
        '<button class="menu-toggle" id="menu-toggle" aria-label="Menu"><span></span><span></span><span></span></button>' +
        '<a class="logo" href="#/">' + logoHtml + '</a>' +
        '<nav class="main-nav" id="main-nav">' +
          navItem('#/novidades', 'Novidades') +
          navItem('#/colecoes', 'Coleções') +
          navItem('#/grupos', 'Compra em Grupo') +
          navItem('#/catalogo', 'Catálogo') +
          '<a class="nav-link" href="' + App.whatsLink(App.STORE.whatsapp && App.STORE.whatsapp.admin_phone && App.STORE.whatsapp.admin_phone.number) + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '</nav>' +
        '<div class="header-actions">' +
          '<a class="icon-btn cart-btn" href="#/carrinho" aria-label="Carrinho">' + App.icon('bag') + '<span class="badge" id="cart-badge">' + App.cart.count() + '</span></a>' +
          '<a class="account-link" href="' + accountHref + '">' + accountLabel + '</a>' +
          (user && user.isAdmin ? '<a class="account-link admin-link" href="#/admin">Admin</a>' : '') +
          (user ? '<button class="logout-btn" id="btn-header-logout">Sair</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="mobile-nav" id="mobile-nav">' +
        navItem('#/novidades', 'Novidades') +
        navItem('#/colecoes', 'Coleções') +
        navItem('#/grupos', 'Compra em Grupo') +
        navItem('#/catalogo', 'Catálogo') +
        navItem('#/carrinho', 'Meu Carrinho') +
        navItem(accountHref, accountLabel) +
        (user && user.isAdmin ? navItem('#/admin', 'Painel Admin') : '') +
        (user ? '<a class="nav-link" href="javascript:void(0)" id="btn-mobile-logout">Sair</a>' : '') +
      '</div>';

    const toggle = header.querySelector('#menu-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      document.getElementById('mobile-nav').classList.toggle('open');
      toggle.classList.toggle('open');
    });

    header.querySelectorAll('#btn-header-logout, #btn-mobile-logout').forEach(function (b) {
      b.addEventListener('click', function () { App.doLogout(); });
    });
  };

  App.doLogout = async function () {
    await App.api.signOut();
    App.state.user = null;
    App.emit('auth');
    App.navigate('#/');
  };

  App.renderFooter = function (s) {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    const brand = s && s.brand ? s.brand : { name: 'USE LOMA', tagline: '' };
    const social = (s && s.social) || {};
    const contact = (s && s.contact) || {};
    const foot = (s && s.footer) || {};
    footer.innerHTML =
      '<div class="footer-grid">' +
        '<div class="footer-col"><h4>' + App.esc(brand.name) + '</h4><p>' + App.esc(foot.about || '') + '</p></div>' +
        '<div class="footer-col"><h4>Navegação</h4>' +
          '<a href="#/novidades">Novidades</a><a href="#/colecoes">Coleções</a><a href="#/grupos">Compra em Grupo</a><a href="#/catalogo">Catálogo</a>' +
        '</div>' +
        '<div class="footer-col"><h4>Atendimento</h4>' +
          (contact.email ? '<a href="mailto:' + App.esc(contact.email) + '">' + App.esc(contact.email) + '</a>' : '') +
          (contact.phone ? '<span>' + App.esc(contact.phone) + '</span>' : '') +
          '<a href="' + App.whatsLink(App.STORE.whatsapp && App.STORE.whatsapp.admin_phone && App.STORE.whatsapp.admin_phone.number) + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '</div>' +
        '<div class="footer-col"><h4>Siga a gente</h4><div class="social-row">' +
          (social.instagram ? '<a href="' + App.esc(social.instagram) + '" target="_blank" rel="noopener">Instagram</a>' : '') +
          (social.tiktok ? '<a href="' + App.esc(social.tiktok) + '" target="_blank" rel="noopener">TikTok</a>' : '') +
          (social.facebook ? '<a href="' + App.esc(social.facebook) + '" target="_blank" rel="noopener">Facebook</a>' : '') +
        '</div></div>' +
      '</div>' +
      '<div class="footer-bottom">' + App.esc(foot.copyright || '') + '</div>';
  };

  App.productCard = function (p) {
    const img = App.mainImage(p);
    const price = parseFloat(p.price) || 0;
    const sale = p.sale_price != null ? parseFloat(p.sale_price) : null;
    const showSale = sale != null && sale < price;
    const group = p.group_enabled;
    const badges =
      (p.is_new ? '<span class="p-badge new">Novo</span>' : '') +
      (p.is_featured ? '<span class="p-badge feat">Destaque</span>' : '') +
      (showSale ? '<span class="p-badge offer">Oferta</span>' : '');
    const priceHtml = showSale
      ? '<span class="price">' + App.money(sale) + '</span><span class="price-old">' + App.money(price) + '</span>'
      : '<span class="price">' + App.money(price) + '</span>';
    const groupHtml = group ? '<span class="group-tag">Compra coletiva ' + App.money(p.group_price) + '</span>' : '';
    return '<a class="product-card" href="#/produto/' + p.id + '">' +
      '<div class="product-media">' + badges + '<img src="' + App.img(img) + '" alt="' + App.esc(p.name) + '" loading="lazy"></div>' +
      '<div class="product-info">' +
        '<h3>' + App.esc(p.name) + '</h3>' +
        (p.category ? '<span class="product-cat">' + App.esc(p.category.name) + '</span>' : '') +
        '<div class="product-price">' + priceHtml + '</div>' + groupHtml +
      '</div>' +
    '</a>';
  };

  App.productGrid = function (products) {
    if (!products || !products.length) return '<div class="empty">Nenhum produto por aqui ainda.</div>';
    return '<div class="product-grid">' + products.map(App.productCard).join('') + '</div>';
  };

  App.section = function (title, subtitle, inner, extra) {
    return '<section class="section">' +
      '<div class="section-head"><h2>' + App.esc(title) + '</h2>' + (subtitle ? '<p>' + App.esc(subtitle) + '</p>' : '') + '</div>' +
      inner + (extra || '') +
    '</section>';
  };

  // ============ HOME ============
  App.pages.home = async function () {
    App.loading(true);
    try {
      const s = App.STORE.settings || {};
      const [products, categories, collections] = await Promise.all([
        App.api.listProducts({ activeOnly: true }),
        App.api.listCategories(),
        App.api.listCollections()
      ]);
      const hero = s.hero || {};
      const news = products.filter((p) => p.is_new).slice(0, 8);
      const featured = products.filter((p) => p.is_featured).slice(0, 8);
      const offers = products.filter((p) => p.sale_price != null && parseFloat(p.sale_price) < parseFloat(p.price)).slice(0, 8);
      const groups = products.filter((p) => p.group_enabled).slice(0, 8);

      const heroHtml =
        '<section class="hero" style="' + (hero.image_url ? 'background-image:url(' + App.esc(hero.image_url) + ')' : '') + '">' +
          '<div class="hero-overlay"></div>' +
          '<div class="hero-content">' +
            '<span class="hero-kicker">' + App.esc(hero.kicker || 'Nova Coleção') + '</span>' +
            '<h1>' + App.esc(hero.title || 'USE LOMA') + '</h1>' +
            '<p>' + App.esc(hero.subtitle || 'Mais que moda, é você bem vestida ♡') + '</p>' +
            '<a class="btn btn-light" href="#/catalogo">' + App.esc(hero.button_text || 'Ver Catálogo') + '</a>' +
          '</div>' +
        '</section>';

      let html = heroHtml;

      if (categories.length) {
        html += App.section('Categorias', 'Escolha a sua favorita',
          '<div class="chip-row">' + categories.map((c) => '<a class="chip" href="#/categoria/' + App.esc(c.slug) + '">' + App.esc(c.name) + '</a>').join('') + '</div>');
      }

      if (news.length) html += App.section('Novidades', 'Acabaram de chegar', App.productGrid(news));
      if (collections.length) html += App.section('Coleções', 'Feitas para você',
        '<div class="collection-grid">' + collections.map((c) =>
          '<a class="collection-card" href="#/colecao/' + App.esc(c.slug) + '">' +
          '<img src="' + App.img(c.image_url) + '" alt="' + App.esc(c.name) + '">' +
          '<div class="collection-overlay"><span>' + App.esc(c.name) + '</span></div></a>').join('') + '</div>');
      if (offers.length) html += App.section('Ofertas Especiais', 'Por tempo limitado', App.productGrid(offers));
      if (groups.length) html += App.section('Compra em Grupo', 'Junte amigas e pague menos', App.productGrid(groups),
        '<div class="section-cta"><a class="btn btn-primary" href="#/grupos">Ver todas as compras coletivas</a></div>');
      if (featured.length) html += App.section('Em Destaque', 'Os queridinhos da loja', App.productGrid(featured));

      html += App.whatsappCta(s);
      return html;
    } finally {
      App.loading(false);
    }
  };

  App.whatsappCta = function (s) {
    const wa = App.STORE.whatsapp;
    const number = wa && wa.admin_phone && wa.admin_phone.number;
    return '<section class="whats-cta">' +
      '<h2>Atendimento pelo WhatsApp</h2>' +
      '<p>Tire dúvidas e faça seu pedido direto com a gente.</p>' +
      '<a class="btn btn-whats" href="' + App.whatsLink(number) + '" target="_blank" rel="noopener">' + App.icon('whats') + ' Falar no WhatsApp</a>' +
    '</section>';
  };

  // ============ CATALOG ============
  App.pages.catalog = async function (params) {
    App.loading(true);
    try {
      const filters = { activeOnly: true };
      let title = 'Catálogo';
      let subtitle = 'Todas as peças';

      if (params.route === 'novidades') { filters.isNew = true; title = 'Novidades'; subtitle = 'Acabaram de chegar'; }
      else if (params.route === 'grupos') { title = 'Compra em Grupo'; subtitle = 'Junte amigas e pague menos'; }
      else if (params.category) { filters.category = params.category; title = params.name || 'Categoria'; }
      else if (params.collection) { filters.collection = params.collection; title = params.name || 'Coleção'; }

      let products = await App.api.listProducts(filters);
      if (params.route === 'grupos') products = products.filter((p) => p.group_enabled);

      const categories = await App.api.listCategories();
      const collections = await App.api.listCollections();

      const filterBar =
        '<div class="filter-bar">' +
        '<select id="cat-filter" class="select"><option value="">Categoria</option>' +
        categories.map((c) => '<option value="' + c.id + '"' + (params.category === c.id ? ' selected' : '') + '>' + App.esc(c.name) + '</option>').join('') +
        '</select>' +
        '<select id="col-filter" class="select"><option value="">Coleção</option>' +
        collections.map((c) => '<option value="' + c.id + '"' + (params.collection === c.id ? ' selected' : '') + '>' + App.esc(c.name) + '</option>').join('') +
        '</select>' +
        '</div>';

      return '<section class="page-head"><h1>' + App.esc(title) + '</h1><p>' + App.esc(subtitle) + '</p></section>' +
        filterBar + App.productGrid(products);
    } finally {
      App.loading(false);
    }
  };

  App.bindCatalogFilters = function () {
    const cat = document.getElementById('cat-filter');
    const col = document.getElementById('col-filter');
    if (cat) cat.addEventListener('change', () => { App.navigate('#/catalogo?cat=' + cat.value); });
    if (col) col.addEventListener('change', () => { App.navigate('#/catalogo?col=' + col.value); });
  };

  // ============ PRODUCT DETAIL ============
  App.pages.product = async function (params) {
    App.loading(true);
    try {
      const p = await App.api.getProduct(params.id);
      if (!p.is_active && !App.state.user?.isAdmin) return '<div class="empty">Produto indisponível.</div>';

      const price = parseFloat(p.price) || 0;
      const sale = p.sale_price != null ? parseFloat(p.sale_price) : null;
      const showSale = sale != null && sale < price;
      const normal = sale != null ? sale : price;

      const images = (p.product_images || []).slice().sort((a, b) => {
        if (a.is_main && !b.is_main) return -1;
        if (!a.is_main && b.is_main) return 1;
        return a.sort_order - b.sort_order;
      });
      const videos = (p.product_videos || []).slice().sort((a, b) => a.sort_order - b.sort_order);

      const gallery = images.map((im, i) =>
        '<div class="thumb' + (i === 0 ? ' active' : '') + '" data-i="' + i + '"><img src="' + App.img(im.url) + '" alt=""></div>'
      ).join('');
      const mainImg = images.length ? images[0].url : null;

      const sizes = p.sizes || [];
      const colors = p.colors || [];

      const priceHtml = showSale
        ? '<span class="price-big">' + App.money(sale) + '</span><span class="price-old">' + App.money(price) + '</span>'
        : '<span class="price-big">' + App.money(price) + '</span>';

      const groupCard = p.group_enabled ? App.groupCard(p) : '';

      const videosHtml = videos.length
        ? '<div class="videos-row">' + videos.map((v) =>
            '<video controls preload="metadata" src="' + App.esc(v.url) + '"></video>').join('') + '</div>'
        : '';

      const html =
        '<div class="product-detail">' +
          '<div class="pd-gallery">' +
            '<div class="pd-main"><img id="pd-main-img" src="' + App.img(mainImg) + '" alt="' + App.esc(p.name) + '"></div>' +
            (images.length > 1 ? '<div class="pd-thumbs">' + gallery + '</div>' : '') +
          '</div>' +
          '<div class="pd-info">' +
            '<div class="pd-badges">' +
              (p.is_new ? '<span class="p-badge new">Novo</span>' : '') +
              (p.is_featured ? '<span class="p-badge feat">Destaque</span>' : '') +
              (showSale ? '<span class="p-badge offer">Oferta</span>' : '') +
            '</div>' +
            '<h1>' + App.esc(p.name) + '</h1>' +
            '<div class="pd-price">' + priceHtml + '</div>' +
            '<p class="pd-desc">' + App.esc(p.description) + '</p>' +
            (p.sku ? '<p class="pd-meta">SKU: ' + App.esc(p.sku) + '</p>' : '') +
            (sizes.length ? '<div class="pd-option"><span>Tamanho</span><div class="option-row" id="size-row">' +
              sizes.map((s) => '<button class="opt" data-opt="size" data-v="' + App.esc(s) + '">' + App.esc(s) + '</button>').join('') + '</div></div>' : '') +
            (colors.length ? '<div class="pd-option"><span>Cor</span><div class="option-row" id="color-row">' +
              colors.map((c) => '<button class="opt" data-opt="color" data-v="' + App.esc(c) + '">' + App.esc(c) + '</button>').join('') + '</div></div>' : '') +
            '<div class="pd-actions">' +
              '<button class="btn btn-primary" id="btn-add-cart">' + App.icon('bag') + ' Adicionar ao carrinho</button>' +
            '</div>' +
            '<div id="group-zone">' + groupCard + '</div>' +
            videosHtml +
          '</div>' +
        '</div>';

      return html;
    } finally {
      App.loading(false);
    }
  };

  App.waitlist = {
    key: 'useloma_waitlist_v1',
    load: function () { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
    get: function (groupId) { return this.load()[groupId] || null; },
    set: function (groupId, data) { const all = this.load(); all[groupId] = data; localStorage.setItem(this.key, JSON.stringify(all)); }
  };

  App.groupCard = function (p) {
    const normal = p.sale_price != null ? parseFloat(p.sale_price) : parseFloat(p.price);
    return '<div class="group-card" id="group-card">' +
      '<div class="group-head"><span class="group-badge">COMPRA COLETIVA</span><span class="group-discount">Fila de espera</span></div>' +
      '<div class="group-prices">' +
        '<div class="gp-row"><span class="gp-label">Preço normal</span><span class="gp-value">' + App.money(normal) + '</span></div>' +
        '<div class="gp-row locked"><span class="gp-label">Preço na fila</span><span class="gp-value">' + App.icon('lock') + ' ' + App.money(p.group_price) + '</span></div>' +
      '</div>' +
      '<p class="group-min">' + (p.group_min_qty || 5) + ' pessoas para liberar o preço de ' + App.money(p.group_price) + '</p>' +
      '<div class="progress"><div class="progress-fill" id="group-fill" style="width:0%"></div></div>' +
      '<p class="progress-label" id="group-label">Carregando…</p>' +
      '<div id="group-actions">' +
        '<button class="btn btn-group" id="btn-join-group">PARTICIPAR DA COMPRA EM GRUPO</button>' +
      '</div>' +
      '<div id="group-notify"></div>' +
    '</div>';
  };

  App.groupJoinModal = function (p, onConfirm) {
    const wl = App.waitlist.get(p.id);
    const profile = (App.state.user && App.state.user.profile) || {};
    const name = (wl && wl.name) || profile.full_name || '';
    const phone = (wl && wl.phone) || profile.phone || '';
    const m = App.modal(
      '<div class="modal-body">' +
        '<h2>Entrar na Fila de Espera</h2>' +
        '<p class="muted">' + App.esc(p.name) + '<br>Preço na fila: <strong>' + App.money(p.group_price) + '</strong> (liberado ao atingir ' + (p.group_min_qty || 5) + ' pessoas)</p>' +
        '<div class="modal-fields">' +
          '<label class="field"><span>Nome</span><input class="input" id="gj-name" value="' + App.esc(name) + '" placeholder="Seu nome"></label>' +
          '<label class="field"><span>WhatsApp</span><input class="input" id="gj-phone" value="' + App.esc(phone) + '" placeholder="(11) 99999-9999"></label>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-outline" data-close>Cancelar</button>' +
          '<button class="btn btn-group" id="gj-confirm">Confirmar e entrar na fila</button>' +
        '</div>' +
      '</div>', { size: 'sm' }
    );
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    m.el.querySelector('#gj-confirm').addEventListener('click', function () {
      const n = m.el.querySelector('#gj-name').value.trim();
      const ph = m.el.querySelector('#gj-phone').value.trim();
      if (!n) { App.toast('Informe seu nome', 'error'); return; }
      if (!App.validatePhone(ph)) { App.toast('WhatsApp inválido', 'error'); return; }
      m.close();
      onConfirm(n, ph);
    });
  };

  App.simulateGroupClosed = function (p, group, phone) {
    const box = document.getElementById('group-notify');
    if (!box) return;
    const link = 'https://useloma.com.br/pagamento/' + group.id;
    const now = new Date();
    const ts = now.toLocaleTimeString('pt-BR');
    const phoneDisplay = phone ? App.formatPhone(phone) : 'os participantes';
    box.innerHTML =
      '<div class="group-complete">' +
        '<div class="gc-check">✓</div>' +
        '<h3>Meta atingida! Grupo completo.</h3>' +
        '<p>Uma mensagem automática será enviada para o seu WhatsApp cadastrado informando o sucesso do grupo e contendo o link de pagamento exclusivo com o valor de ' + App.money(p.group_price) + ' para concluir a compra.</p>' +
        '<div class="wa-mock">' +
          '<div class="wa-bar">' + App.icon('whats') + ' <span>USE LOMA — WhatsApp</span></div>' +
          '<div class="wa-bubble incoming">' +
            '<div class="wa-time">' + ts + '</div>' +
            'Olá! Seu grupo fechou com sucesso!<br>' +
            'Link de pagamento exclusivo (' + App.money(p.group_price) + '):<br>' +
            '<span class="wa-link">' + App.esc(link) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="log-panel">' +
          '<div class="log-title">Log de disparo</div>' +
          '<div class="log-entry"><span>' + ts + '</span> Grupo fechado — meta de ' + (group.min_qty || 5) + ' pessoas atingida</div>' +
          '<div class="log-entry"><span>' + ts + '</span> Disparando mensagem para ' + phoneDisplay + '</div>' +
          '<div class="log-entry"><span>' + ts + '</span> Link de pagamento (' + App.money(p.group_price) + ') enviado com sucesso</div>' +
        '</div>' +
      '</div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    App.toast('Meta atingida! Link de pagamento disparado para os participantes.', 'success');
  };

  App.bindProduct = function (params) {
    const imgs = document.querySelectorAll('.pd-thumbs .thumb');
    imgs.forEach((t) => t.addEventListener('click', function () {
      const main = document.getElementById('pd-main-img');
      if (main && t.querySelector('img')) main.src = t.querySelector('img').src;
      imgs.forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
    }));

    const opts = document.querySelectorAll('.opt');
    opts.forEach((o) => o.addEventListener('click', function () {
      const group = o.getAttribute('data-opt');
      const container = document.getElementById(group + '-row');
      container.querySelectorAll('.opt').forEach((x) => x.classList.remove('selected'));
      o.classList.add('selected');
    }));

    const addBtn = document.getElementById('btn-add-cart');
    if (addBtn) addBtn.addEventListener('click', async function () {
      const p = await App.api.getProduct(params.id);
      const size = App.selectedOpt('size');
      const color = App.selectedOpt('color');
      if (p.sizes && p.sizes.length && !size) { App.toast('Escolha um tamanho', 'error'); return; }
      if (p.colors && p.colors.length && !color) { App.toast('Escolha uma cor', 'error'); return; }
      const img = App.mainImage(p);
      const price = p.sale_price != null ? parseFloat(p.sale_price) : parseFloat(p.price);
      App.cart.add({
        product_id: p.id,
        name: p.name,
        size: size || '',
        color: color || '',
        quantity: 1,
        group: false,
        price: price,
        group_price: p.group_price != null ? parseFloat(p.group_price) : null,
        image: img
      });
      App.toast('Produto adicionado ao carrinho', 'success');
      App.emit('cart');
    });

    const groupBtn = document.getElementById('btn-join-group');
    if (groupBtn) App.bindGroup(productDetailFromParams(params.id), groupBtn);
  };

  function productDetailFromParams(id) {
    return App.api.getProduct(id);
  }

  App.selectedOpt = function (kind) {
    const el = document.querySelector('#' + kind + '-row .opt.selected');
    return el ? el.getAttribute('data-v') : null;
  };

  App.bindGroup = async function (pPromise, btn) {
    const p = await pPromise;
    let group = await App.api.getGroupForProduct(p.id);
    let joined = !!App.waitlist.get(p.id);

    const render = async () => {
      const label = document.getElementById('group-label');
      const fill = document.getElementById('group-fill');
      if (!label || !fill) return;
      const min = group ? (group.min_qty || 1) : (p.group_min_qty || 5);
      const cur = group ? (group.current_qty || 0) : 0;
      const complete = !!group && group.status === 'complete';
      fill.style.width = (complete ? 100 : Math.min(100, Math.round((cur / min) * 100))) + '%';

      if (!group) {
        label.textContent = '0 de ' + min + ' pessoas · Seja a primeira a entrar na fila!';
      } else if (complete) {
        label.textContent = 'Meta atingida! Preço de ' + App.money(group.discount_price) + ' liberado para os participantes.';
      } else {
        const missing = Math.max(0, min - cur);
        label.textContent = cur + ' de ' + min + ' pessoas · Falta(m) ' + missing + ' para liberar ' + App.money(p.group_price) + '!';
      }

      if (btn) {
        if (complete) { btn.textContent = 'Grupo fechado — meta atingida'; btn.disabled = true; }
        else if (joined) { btn.textContent = 'Você está na fila de espera'; btn.disabled = true; }
        else { btn.textContent = 'PARTICIPAR DA COMPRA EM GRUPO'; btn.disabled = false; }
      }
    };

    const openModal = function () {
      App.groupJoinModal(p, async function (name, phone) {
        App.loading(true);
        try {
          const prev = group;
          group = await App.api.joinGroup(p.id, name, phone);
          joined = true;
          App.waitlist.set(p.id, { name: name, phone: phone });
          await render();
          App.toast('Você entrou na fila de espera!', 'success');
          if (group && group.status === 'complete' && (!prev || prev.status !== 'complete')) {
            App.simulateGroupClosed(p, group, phone);
          }
        } catch (e) {
          App.toast(App.errMsg(e), 'error');
        } finally {
          App.loading(false);
        }
      });
    };

    if (btn) btn.addEventListener('click', function () {
      if (joined || (group && group.status === 'complete')) return;
      openModal();
    });

    await render();

    const sub = App.api.subscribeGroup(p.id, async (payload) => {
      if (payload) {
        const prev = group;
        group = payload;
        await render();
        if (prev && prev.status !== 'complete' && group.status === 'complete') {
          const wl = App.waitlist.get(p.id);
          App.simulateGroupClosed(p, group, wl ? wl.phone : null);
        }
      }
    });
    App.cleanup.push(() => App.sb.removeChannel(sub));
  };

  App.errMsg = function (e) {
    const m = e && e.message ? e.message : String(e);
    if (m.includes('AUTH_REQUIRED')) return 'Você precisa entrar para continuar.';
    if (m.includes('NAME_REQUIRED')) return 'Informe seu nome.';
    if (m.includes('PHONE_REQUIRED')) return 'Informe um WhatsApp válido.';
    if (m.includes('INSUFFICIENT_STOCK')) return 'Estoque insuficiente.';
    if (m.includes('PRODUCT_INACTIVE')) return 'Produto indisponível.';
    if (m.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (m.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.';
    if (m.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (m.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (m.includes('duplicate key') || m.includes('23505')) return 'Registro duplicado.';
    return m;
  };

  // ============ CART ============
  App.pages.cart = async function () {
    const items = App.cart.load();
    if (!items.length) return '<section class="page-head"><h1>Meu Carrinho</h1></section><div class="empty">Seu carrinho está vazio. <a href="#/catalogo">Ver produtos</a></div>';

    let subtotal = 0;
    const rows = items.map((it) => {
      const line = parseFloat(it.price) * it.quantity;
      subtotal += line;
      return '<div class="cart-row" data-key="' + App.esc(it.key) + '">' +
        '<img class="cart-img" src="' + App.img(it.image) + '" alt="">' +
        '<div class="cart-info"><h4>' + App.esc(it.name) + '</h4>' +
          '<span class="cart-meta">' + App.esc(it.size || '') + (it.size && it.color ? ' · ' : '') + App.esc(it.color || '') + '</span>' +
          (it.group ? '<span class="group-tag">Compra em grupo</span>' : '') +
        '</div>' +
        '<div class="cart-qty"><button class="qty-btn" data-d="-1">−</button><input type="number" value="' + it.quantity + '" min="1"><button class="qty-btn" data-d="1">+</button></div>' +
        '<div class="cart-line-total">' + App.money(line) + '</div>' +
        '<button class="cart-remove" title="Remover">×</button>' +
      '</div>';
    }).join('');

    return '<section class="page-head"><h1>Meu Carrinho</h1></section>' +
      '<div class="cart-page">' +
        '<div class="cart-list">' + rows + '</div>' +
        '<div class="cart-summary">' +
          '<h3>Resumo</h3>' +
          '<div class="sum-row"><span>Subtotal</span><span>' + App.money(subtotal) + '</span></div>' +
          '<div class="sum-row"><span>Desconto de grupo</span><span class="muted">calculado na finalização</span></div>' +
          '<button class="btn btn-primary btn-block" id="btn-checkout">Finalizar pedido</button>' +
          '<a class="link" href="#/catalogo">Continuar comprando</a>' +
        '</div>' +
      '</div>';
  };

  App.bindCart = function () {
    document.querySelectorAll('.cart-row').forEach((row) => {
      const key = row.getAttribute('data-key');
      row.querySelector('.cart-remove').addEventListener('click', () => { App.cart.remove(key); App.navigate('#/carrinho'); });
      const input = row.querySelector('input');
      input.addEventListener('change', () => { App.cart.updateQty(key, parseInt(input.value) || 1); App.navigate('#/carrinho'); });
      row.querySelectorAll('.qty-btn').forEach((b) => b.addEventListener('click', () => {
        const cur = parseInt(input.value) || 1;
        const d = parseInt(b.getAttribute('data-d'));
        App.cart.updateQty(key, cur + d);
        App.navigate('#/carrinho');
      }));
    });
    const checkout = document.getElementById('btn-checkout');
    if (checkout) checkout.addEventListener('click', () => {
      if (!App.state.user) { App.navigate('#/login?next=' + encodeURIComponent('#/checkout')); }
      else App.navigate('#/checkout');
    });
  };

  // ============ CHECKOUT ============
  App.pages.checkout = async function () {
    const items = App.cart.load();
    if (!items.length) { App.navigate('#/carrinho'); return ''; }

    const profile = App.state.user.profile || {};
    const addresses = await App.api.listAddresses(App.state.user.id);
    const expected = await App.cart.expected();

    const addrOpts = addresses.length
      ? '<div class="addr-list" id="addr-list">' + addresses.map((a) =>
          '<label class="addr-opt"><input type="radio" name="addr" value="' + a.id + '"' + (addresses.length === 1 ? ' checked' : '') + '>' +
          '<span>' + App.esc(a.recipient) + ' · ' + App.esc(a.street) + ', ' + App.esc(a.number) + ' · ' + App.esc(a.city) + '/' + App.esc(a.state) + '</span></label>').join('') +
        '</div>'
      : '<p class="muted">Nenhum endereço salvo. Cadastre abaixo.</p>';

    const rows = items.map((it) =>
      '<div class="sum-row"><span>' + App.esc(it.name) + ' (' + App.esc(it.size || '—') + '/' + App.esc(it.color || '—') + ') ×' + it.quantity + (it.group ? ' [grupo]' : '') + '</span><span>' + App.money(parseFloat(it.price) * it.quantity) + '</span></div>'
    ).join('');

    return '<section class="page-head"><h1>Finalizar Pedido</h1></section>' +
      '<div class="checkout-page">' +
        '<div class="checkout-main">' +
          '<h3>Endereço de entrega</h3>' + addrOpts +
          '<h3 class="mt">Novo endereço</h3>' + App.addressForm({}) +
          '<h3 class="mt">Resumo do pedido</h3><div class="checkout-summary">' + rows +
            '<div class="sum-row"><span>Subtotal</span><span>' + App.money(expected.subtotal) + '</span></div>' +
            (expected.discount > 0 ? '<div class="sum-row discount"><span>Desconto</span><span>− ' + App.money(expected.discount) + '</span></div>' : '') +
            '<div class="sum-row total"><span>Total</span><span>' + App.money(expected.total) + '</span></div>' +
          '</div>' +
          '<button class="btn btn-primary btn-block" id="btn-place-order">Confirmar pedido</button>' +
        '</div>' +
      '</div>';
  };

  App.addressForm = function (a) {
    a = a || {};
    return '<div class="form-grid addr-form" id="addr-form">' +
      '<input class="input" name="recipient" placeholder="Nome do destinatário" value="' + App.esc(a.recipient || '') + '">' +
      '<input class="input" name="phone" placeholder="Telefone/WhatsApp" value="' + App.esc(a.phone || '') + '">' +
      '<input class="input" name="zip" placeholder="CEP" value="' + App.esc(a.zip || '') + '">' +
      '<input class="input" name="street" placeholder="Rua" value="' + App.esc(a.street || '') + '">' +
      '<input class="input" name="number" placeholder="Número" value="' + App.esc(a.number || '') + '">' +
      '<input class="input" name="complement" placeholder="Complemento" value="' + App.esc(a.complement || '') + '">' +
      '<input class="input" name="neighborhood" placeholder="Bairro" value="' + App.esc(a.neighborhood || '') + '">' +
      '<input class="input" name="city" placeholder="Cidade" value="' + App.esc(a.city || '') + '">' +
      '<input class="input" name="state" placeholder="UF" maxlength="2" value="' + App.esc(a.state || '') + '">' +
      '</div>';
  };

  App.bindCheckout = function () {
    const btn = document.getElementById('btn-place-order');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      const profile = App.state.user.profile || {};
      const selectedAddr = document.querySelector('input[name="addr"]:checked');

      let address;
      const form = document.getElementById('addr-form');
      const getVal = (n) => (form.querySelector('[name="' + n + '"]') || {}).value || '';
      if (selectedAddr) {
        const addrId = selectedAddr.value;
        const list = await App.api.listAddresses(App.state.user.id);
        address = list.find((a) => a.id === addrId);
      } else {
        address = {
          recipient: getVal('recipient'), phone: getVal('phone'), zip: getVal('zip'),
          street: getVal('street'), number: getVal('number'), complement: getVal('complement'),
          neighborhood: getVal('neighborhood'), city: getVal('city'), state: getVal('state')
        };
        if (!address.recipient || !address.phone || !address.street || !address.city) {
          App.toast('Preencha o endereço de entrega', 'error');
          return;
        }
        if (!App.validatePhone(address.phone)) { App.toast('Telefone inválido', 'error'); return; }
        address.user_id = App.state.user.id;
        address = await App.api.saveAddress(address);
      }

      const cart = App.cart.load().map((i) => ({
        product_id: i.product_id, size: i.size, color: i.color, quantity: i.quantity, group: !!i.group
      }));

      App.loading(true);
      try {
        const order = await App.api.createOrder(cart, address);
        App.cart.clear();
        const full = await App.api.getOrder(order.order_id);
        App.showOrderSuccess(full);
      } catch (e) {
        App.toast(App.errMsg(e), 'error');
      } finally {
        App.loading(false);
      }
    });
  };

  App.showOrderSuccess = function (order) {
    const waNumber = App.STORE.whatsapp && App.STORE.whatsapp.admin_phone && App.STORE.whatsapp.admin_phone.number;
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML =
        '<section class="success-page">' +
          '<div class="success-icon">✓</div>' +
          '<h1>Pedido realizado com sucesso!</h1>' +
          '<p>Número do pedido: <strong>' + App.esc(order.order_number) + '</strong></p>' +
          '<p>Total: <strong>' + App.money(order.total) + '</strong></p>' +
          '<p class="muted">Envie o resumo do pedido para o nosso WhatsApp para agilizar o atendimento.</p>' +
          '<div class="success-actions">' +
            '<a class="btn btn-whats" href="' + App.whatsLink(waNumber, App.buildOrderMessage(order)) + '" target="_blank" rel="noopener">' + App.icon('whats') + ' Enviar pedido pelo WhatsApp</a>' +
            '<a class="btn btn-primary" href="#/conta">Acompanhar meus pedidos</a>' +
            '<a class="btn btn-outline" href="#/catalogo">Continuar comprando</a>' +
          '</div>' +
        '</section>';
      window.scrollTo(0, 0);
    }
  };

  App.buildOrderMessage = function (order) {
    const items = (order.order_items || []).map((i) =>
      '- ' + i.name + (i.size ? ' | Tam: ' + i.size : '') + (i.color ? ' | Cor: ' + i.color : '') +
      ' | Qtd: ' + i.quantity + ' | ' + App.money(parseFloat(i.unit_price))
    ).join('\n');

    let msg = 'USE LOMA – NOVO PEDIDO\n\n';
    msg += 'Número: ' + order.order_number + '\n';
    msg += 'Cliente: ' + (order.recipient || '') + '\n';
    msg += 'Telefone: ' + (order.phone || '') + '\n';
    msg += 'Endereço: ' + [order.street, order.number, order.neighborhood, order.city, order.state].filter(Boolean).join(', ') + '\n\n';
    msg += 'Produtos:\n' + items + '\n\n';
    msg += 'Subtotal: ' + App.money(order.subtotal) + '\n';
    msg += 'Desconto: - ' + App.money(order.discount) + '\n';
    msg += 'Total: ' + App.money(order.total) + '\n\n';
    msg += 'Tipo: ' + (order.type === 'group' ? 'Compra em grupo' : 'Compra normal') + '\n';
    if (order.type === 'group' && order.group_purchases) {
      msg += 'Status do grupo: ' + (App.GROUP_STATUS[order.group_purchases.status] || order.group_purchases.status) + '\n';
    }
    return msg;
  };

  // ============ AUTH ============
  App.pages.auth = function (mode, params) {
    const isLogin = mode === 'login';
    const next = (params && params.next) || '#/conta';
    App.authNext = next;
    return '<section class="auth-page"><div class="auth-card">' +
      '<h1>' + (isLogin ? 'Entrar' : 'Criar conta') + '</h1>' +
      '<p class="muted">' + (isLogin ? 'Acesse sua conta Use Loma' : 'Para finalizar seu pedido, crie sua conta na Use Loma.') + '</p>' +
      (isLogin ? '' :
        '<input class="input" id="au-name" type="text" placeholder="Nome completo">' +
        '<input class="input" id="au-phone" type="tel" placeholder="Telefone/WhatsApp">') +
      '<input class="input" id="au-email" type="email" placeholder="E-mail">' +
      '<input class="input" id="au-pass" type="password" placeholder="Senha">' +
      (!isLogin ? '<input class="input" id="au-pass2" type="password" placeholder="Confirmação de senha">' : '') +
      '<button class="btn btn-primary btn-block" id="au-submit">' + (isLogin ? 'Entrar' : 'Cadastrar e continuar') + '</button>' +
      '<p class="auth-alt">' + (isLogin ? 'Não tem conta? <a href="#/cadastro">Cadastre-se</a>' : 'Já tem conta? <a href="#/login">Entrar</a>') + '</p>' +
      '</div></section>';
  };

  App.bindAuth = function (mode) {
    const isLogin = mode === 'login';
    const btn = document.getElementById('au-submit');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      const email = document.getElementById('au-email').value.trim();
      const pass = document.getElementById('au-pass').value;
      if (!App.validateEmail(email)) { App.toast('E-mail inválido', 'error'); return; }

      App.loading(true);
      try {
        if (isLogin) {
          await App.api.signIn(email, pass);
          App.toast('Bem-vinda(o)!', 'success');
        } else {
          const name = document.getElementById('au-name').value.trim();
          const phone = document.getElementById('au-phone').value.trim();
          const pass2 = document.getElementById('au-pass2').value;
          if (!name) { App.toast('Informe seu nome completo', 'error'); return; }
          if (pass.length < 6) { App.toast('A senha deve ter pelo menos 6 caracteres', 'error'); return; }
          if (pass !== pass2) { App.toast('As senhas não conferem', 'error'); return; }
          await App.api.signUp(name, email, phone, pass);
          App.toast('Conta criada! Verifique seu e-mail se necessário.', 'success');
        }
        await App.refreshAuth();
        const next = App.authNext || App.parseRoute(location.hash).next || '#/conta';
        App.navigate(next ? decodeURIComponent(next) : '#/conta');
      } catch (e) {
        App.toast(App.errMsg(e), 'error');
      } finally {
        App.loading(false);
      }
    });
  };

  // ============ ACCOUNT ============
  App.pages.account = async function (tab) {
    const user = App.state.user;
    const p = user.profile || {};
    const addresses = await App.api.listAddresses(user.id);
    const orders = await App.api.listOrders(user.id);
    const groups = await App.api.myGroups(user.id);

    tab = tab || 'pedidos';

    const tabs =
      '<div class="account-tabs">' +
        '<button class="tab' + (tab === 'pedidos' ? ' active' : '') + '" data-tab="pedidos">Meus pedidos</button>' +
        '<button class="tab' + (tab === 'dados' ? ' active' : '') + '" data-tab="dados">Meus dados</button>' +
        '<button class="tab' + (tab === 'enderecos' ? ' active' : '') + '" data-tab="enderecos">Endereços</button>' +
        '<button class="tab' + (tab === 'grupos' ? ' active' : '') + '" data-tab="grupos">Compras em grupo</button>' +
      '</div>';

    let body = '';
    if (tab === 'pedidos') {
      body = orders.length
        ? '<div class="orders-list">' + orders.map((o) => App.orderRow(o, true)).join('') + '</div>'
        : '<div class="empty">Você ainda não tem pedidos.</div>';
    } else if (tab === 'dados') {
      body = '<div class="form-grid">' +
        '<label class="field"><span>Nome completo</span><input class="input" id="p-name" value="' + App.esc(p.full_name || '') + '"></label>' +
        '<label class="field"><span>E-mail</span><input class="input" value="' + App.esc(p.email || '') + '" disabled></label>' +
        '<label class="field"><span>Telefone/WhatsApp</span><input class="input" id="p-phone" value="' + App.esc(p.phone || '') + '"></label>' +
        '</div>' +
        '<button class="btn btn-primary" id="btn-save-profile">Salvar</button>' +
        '<button class="btn btn-outline" id="btn-logout">Sair da conta</button>';
    } else if (tab === 'enderecos') {
      body = '<div class="addr-cards">' + addresses.map((a) =>
        '<div class="addr-card"><p><strong>' + App.esc(a.recipient) + '</strong> · ' + App.esc(a.phone) + '</p>' +
        '<p>' + App.esc(a.street) + ', ' + App.esc(a.number) + ' ' + App.esc(a.complement) + '</p>' +
        '<p>' + App.esc(a.neighborhood) + ' · ' + App.esc(a.city) + '/' + App.esc(a.state) + ' · ' + App.esc(a.zip) + '</p>' +
        '<button class="btn btn-sm btn-outline addr-del" data-id="' + a.id + '">Excluir</button></div>').join('') + '</div>' +
        '<h3 class="mt">Adicionar endereço</h3>' + App.addressForm({}) +
        '<button class="btn btn-primary" id="btn-add-addr">Salvar endereço</button>';
    } else if (tab === 'grupos') {
      body = groups.length
        ? '<div class="orders-list">' + groups.map((g) => {
            const gr = g.group;
            const min = gr.min_qty || 1;
            const cur = gr.current_qty || 0;
            const pct = Math.min(100, Math.round((cur / min) * 100));
            return '<div class="group-line"><div class="gl-info"><strong>' + App.esc(gr.product && gr.product.name) + '</strong>' +
              '<span class="group-tag">' + App.GROUP_STATUS[gr.status] + '</span></div>' +
              '<div class="progress"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
              '<span>' + cur + '/' + min + ' pessoas</span></div>';
          }).join('') + '</div>'
        : '<div class="empty">Você ainda não participa de nenhuma compra em grupo.</div>';
    }

    return '<section class="page-head"><h1>Minha Conta</h1><p>Olá, ' + App.esc(p.full_name || '') + '</p></section>' +
      tabs + '<div class="account-body">' + body + '</div>';
  };

  App.orderRow = function (o, link) {
    const items = (o.order_items || []).map((i) => '<span>' + App.esc(i.name) + ' ×' + i.quantity + '</span>').join(', ');
    return '<div class="order-row">' +
      '<div class="or-head"><span class="or-num">' + App.esc(o.order_number) + '</span>' +
      '<span class="or-status status-' + App.esc(o.status) + '">' + (App.ORDER_STATUS[o.status] || o.status) + '</span></div>' +
      '<p class="or-items">' + items + '</p>' +
      '<div class="or-foot"><span>' + App.formatDate(o.created_at) + '</span>' +
      '<span class="or-total">' + App.money(o.total) + '</span>' +
      '<button class="btn btn-sm btn-outline view-order" data-id="' + o.id + '">Detalhes</button></div>' +
    '</div>';
  };

  App.bindAccount = function () {
    document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
      App.navigate('#/conta/' + t.getAttribute('data-tab'));
    }));
    const saveProfile = document.getElementById('btn-save-profile');
    if (saveProfile) saveProfile.addEventListener('click', async () => {
      const name = document.getElementById('p-name').value.trim();
      const phone = document.getElementById('p-phone').value.trim();
      if (!name) { App.toast('Informe seu nome', 'error'); return; }
      await App.api.updateProfile(App.state.user.id, { full_name: name, phone: phone });
      await App.refreshAuth();
      App.toast('Dados atualizados', 'success');
    });
    const logout = document.getElementById('btn-logout');
    if (logout) logout.addEventListener('click', () => { App.doLogout(); });
    document.querySelectorAll('.addr-del').forEach((b) => b.addEventListener('click', async () => {
      await App.api.deleteAddress(b.getAttribute('data-id'));
      App.navigate('#/conta/enderecos');
    }));
    const addAddr = document.getElementById('btn-add-addr');
    if (addAddr) addAddr.addEventListener('click', async () => {
      const form = document.getElementById('addr-form');
      const g = (n) => form.querySelector('[name="' + n + '"]').value.trim();
      const addr = { user_id: App.state.user.id, recipient: g('recipient'), phone: g('phone'), zip: g('zip'), street: g('street'), number: g('number'), complement: g('complement'), neighborhood: g('neighborhood'), city: g('city'), state: g('state') };
      if (!addr.recipient || !addr.street || !addr.city) { App.toast('Preencha os campos obrigatórios', 'error'); return; }
      await App.api.saveAddress(addr);
      App.navigate('#/conta/enderecos');
    });
    document.querySelectorAll('.view-order').forEach((b) => b.addEventListener('click', async () => {
      const o = await App.api.getOrder(b.getAttribute('data-id'));
      App.showOrderDetail(o);
    }));
  };

  App.showOrderDetail = function (o) {
    const items = (o.order_items || []).map((i) =>
      '<div class="sum-row"><span>' + App.esc(i.name) + ' (' + App.esc(i.size || '—') + '/' + App.esc(i.color || '—') + ') ×' + i.quantity + '</span><span>' + App.money(parseFloat(i.unit_price) * i.quantity) + '</span></div>'
    ).join('');
    const grp = o.group_purchases ? '<p class="muted">Compra em grupo: ' + App.esc(o.group_purchases.status) + '</p>' : '';
    const m = App.modal(
      '<div class="modal-body"><h2>' + App.esc(o.order_number) + '</h2>' +
      '<span class="or-status status-' + App.esc(o.status) + '">' + (App.ORDER_STATUS[o.status] || o.status) + '</span>' + grp +
      '<p>' + App.esc(o.recipient) + ' · ' + App.esc(o.phone) + '</p>' +
      '<p>' + App.esc(o.street) + ', ' + App.esc(o.number) + ' · ' + App.esc(o.city) + '/' + App.esc(o.state) + '</p>' +
      '<div class="checkout-summary">' + items +
        '<div class="sum-row"><span>Subtotal</span><span>' + App.money(o.subtotal) + '</span></div>' +
        (parseFloat(o.discount) > 0 ? '<div class="sum-row discount"><span>Desconto</span><span>− ' + App.money(o.discount) + '</span></div>' : '') +
        '<div class="sum-row total"><span>Total</span><span>' + App.money(o.total) + '</span></div>' +
      '</div></div>'
    );
  };
})();
