(function () {
  App.admin = {};

  App.admin.upload = async function (bucket, folder, file) {
    const safe = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = folder + '/' + Date.now() + '-' + safe;
    const { error } = await App.sb.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const url = App.sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { path, url };
  };

  App.admin.removeFile = async function (bucket, path) {
    if (path) await App.sb.storage.from(bucket).remove([path]);
  };

  App.admin.api = {
    async saveProduct(payload) {
      if (payload.id) {
        const { data, error } = await App.sb.from('products').update(payload).eq('id', payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await App.sb.from('products').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async deleteProduct(id) {
      const { error } = await App.sb.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    async saveCategory(payload) {
      if (payload.id) {
        const { data, error } = await App.sb.from('categories').update(payload).eq('id', payload.id).select().single();
        if (error) throw error; return data;
      }
      const { data, error } = await App.sb.from('categories').insert(payload).select().single();
      if (error) throw error; return data;
    },
    async deleteCategory(id) {
      const { error } = await App.sb.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    async saveCollection(payload) {
      if (payload.id) {
        const { data, error } = await App.sb.from('collections').update(payload).eq('id', payload.id).select().single();
        if (error) throw error; return data;
      }
      const { data, error } = await App.sb.from('collections').insert(payload).select().single();
      if (error) throw error; return data;
    },
    async deleteCollection(id) {
      const { error } = await App.sb.from('collections').delete().eq('id', id);
      if (error) throw error;
    },
    async addImage(row) {
      const { data, error } = await App.sb.from('product_images').insert(row).select().single();
      if (error) throw error; return data;
    },
    async updateImage(id, patch) {
      const { error } = await App.sb.from('product_images').update(patch).eq('id', id);
      if (error) throw error;
    },
    async deleteImage(id) {
      const { error } = await App.sb.from('product_images').delete().eq('id', id);
      if (error) throw error;
    },
    async addVideo(row) {
      const { data, error } = await App.sb.from('product_videos').insert(row).select().single();
      if (error) throw error; return data;
    },
    async deleteVideo(id) {
      const { error } = await App.sb.from('product_videos').delete().eq('id', id);
      if (error) throw error;
    },
    async listGroups() {
      const { data, error } = await App.sb.from('group_purchases').select('*, product:products(name)').order('created_at', { ascending: false });
      if (error) throw error; return data || [];
    },
    async updateGroupStatus(id, status) {
      const { error } = await App.sb.from('group_purchases').update({ status }).eq('id', id);
      if (error) throw error;
    },
    async listOrdersAdmin() {
      const { data, error } = await App.sb.from('orders').select('*, order_items(*), profile:profiles(full_name, phone), group_purchases(status, min_qty, current_qty)').order('created_at', { ascending: false });
      if (error) throw error; return data || [];
    },
    async listMedia() {
      const [{ data: imgs }, { data: vids }] = await Promise.all([
        App.sb.from('product_images').select('*, product:products(name)').order('created_at', { ascending: false }),
        App.sb.from('product_videos').select('*, product:products(name)').order('created_at', { ascending: false })
      ]);
      return { images: imgs || [], videos: vids || [] };
    }
  };

  const SECTIONS = {
    dashboard: 'Dashboard',
    produtos: 'Produtos',
    produto: 'Produto',
    categorias: 'Categorias',
    colecoes: 'Coleções',
    pedidos: 'Pedidos',
    clientes: 'Clientes',
    grupos: 'Compras em Grupo',
    midias: 'Mídias',
    config: 'Configurações do Site',
    whatsapp: 'Configurações do WhatsApp',
    admins: 'Usuários Administradores'
  };

  App.admin.render = async function (route) {
    if (!App.state.user.isAdmin) return '<div class="empty">Acesso restrito a administradores.</div>';
    const section = route.parts[1] || 'dashboard';
    const content = await App.admin.section(section, route);
    const sidebar =
      '<aside class="admin-sidebar">' +
        '<a class="admin-brand" href="#/admin"><span>USE LOMA</span><small>Painel Admin</small></a>' +
        '<nav>' +
          Object.keys(SECTIONS).filter((k) => k !== 'produto').map((k) =>
            '<a class="admin-nav' + (section === k ? ' active' : '') + '" href="#/admin/' + k + '">' + SECTIONS[k] + '</a>').join('') +
        '</nav>' +
        '<a class="admin-logout" href="#/" id="admin-back">← Voltar à loja</a>' +
      '</aside>';
    return '<div class="admin-layout">' + sidebar +
      '<div class="admin-main">' +
        '<header class="admin-topbar"><h1>' + (SECTIONS[section] || 'Admin') + '</h1></header>' +
        '<div class="admin-content">' + content + '</div>' +
      '</div></div>';
  };

  App.admin.bind = function (route) {
    const section = route.parts[1] || 'dashboard';
    if (section === 'produto') App.admin.bindProduct(route);
    else if (section === 'produtos') App.admin.bindProducts();
    else if (section === 'categorias') App.admin.bindCategories();
    else if (section === 'colecoes') App.admin.bindCollections();
    else if (section === 'pedidos') App.admin.bindOrders();
    else if (section === 'grupos') App.admin.bindGroups();
    else if (section === 'midias') App.admin.bindMedia();
    else if (section === 'config') App.admin.bindConfig();
    else if (section === 'whatsapp') App.admin.bindWhatsapp();
    else if (section === 'admins') App.admin.bindAdmins();
    const back = document.getElementById('admin-back');
    if (back) back.addEventListener('click', () => App.renderHeader(App.STORE.settings));
  };

  App.admin.section = async function (section, route) {
    switch (section) {
      case 'dashboard': return App.admin.dashboard();
      case 'produtos': return App.admin.productsList();
      case 'produto': return App.admin.productEditor(route.query.id);
      case 'categorias': return App.admin.categoriesList();
      case 'colecoes': return App.admin.collectionsList();
      case 'pedidos': return App.admin.ordersList();
      case 'clientes': return App.admin.customersList();
      case 'grupos': return App.admin.groupsList();
      case 'midias': return App.admin.mediaList();
      case 'config': return App.admin.configForm();
      case 'whatsapp': return App.admin.whatsappForm();
      case 'admins': return App.admin.adminsList();
      default: return App.admin.dashboard();
    }
  };

  // ---------- DASHBOARD ----------
  App.admin.dashboard = async function () {
    const [products, orders, customers, groups] = await Promise.all([
      App.api.listProducts({}),
      App.admin.api.listOrdersAdmin(),
      App.api.listCustomers(),
      App.admin.api.listGroups()
    ]);
    const count = (s) => orders.filter((o) => o.status === s).length;
    const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const lowStock = products.filter((p) => p.stock <= 5).length;

    const card = (label, value, cls) => '<div class="stat-card ' + (cls || '') + '"><span>' + App.esc(label) + '</span><strong>' + value + '</strong></div>';

    return '<div class="stats-grid">' +
      card('Total de pedidos', orders.length) +
      card('Aguardando pagamento', count('pending')) +
      card('Em preparação', count('preparing')) +
      card('Enviados', count('shipped')) +
      card('Entregues', count('delivered')) +
      card('Total de clientes', customers.length) +
      card('Total de produtos', products.length) +
      card('Estoque baixo', lowStock, 'warn') +
      card('Grupos ativos', groups.filter((g) => g.status === 'open').length) +
      card('Grupos concluídos', groups.filter((g) => g.status === 'complete').length) +
      card('Receita total', App.money(revenue), 'highlight') +
    '</div>' +
    '<div class="admin-panel"><h3>Resumo de vendas</h3>' +
      '<div class="stats-grid">' +
        card('Pedidos recebidos', count('received')) +
        card('Pagamentos confirmados', count('paid')) +
        card('Cancelados', count('cancelled')) +
      '</div></div>';
  };

  // ---------- PRODUCTS ----------
  App.admin.productsList = async function () {
    const products = await App.api.listProducts({});
    return '<div class="admin-actions"><a class="btn btn-primary" href="#/admin/produto">+ Novo produto</a></div>' +
      '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Imagem</th><th>Nome</th><th>Preço</th><th>Estoque</th><th>Ativo</th><th>Destaque</th><th>Grupo</th><th></th></tr></thead>' +
      '<tbody>' + products.map((p) =>
        '<tr><td><img class="cell-img" src="' + App.img(App.mainImage(p)) + '"></td>' +
        '<td>' + App.esc(p.name) + '<small>' + App.esc(p.sku || '') + '</small></td>' +
        '<td>' + App.money(p.sale_price != null ? p.sale_price : p.price) + '</td>' +
        '<td>' + p.stock + '</td>' +
        '<td>' + (p.is_active ? 'Sim' : 'Não') + '</td>' +
        '<td>' + (p.is_featured ? 'Sim' : 'Não') + '</td>' +
        '<td>' + (p.group_enabled ? 'Sim' : 'Não') + '</td>' +
        '<td class="cell-actions"><a class="btn btn-sm btn-outline" href="#/admin/produto?id=' + p.id + '">Editar</a>' +
        '<button class="btn btn-sm btn-danger del-product" data-id="' + p.id + '">Excluir</button></td></tr>'
      ).join('') + '</tbody></table></div>';
  };

  App.admin.bindProducts = function () {
    document.querySelectorAll('.del-product').forEach((b) => b.addEventListener('click', () => {
      App.confirm('Excluir este produto?', async () => {
        await App.admin.api.deleteProduct(b.getAttribute('data-id'));
        App.toast('Produto excluído', 'success');
        App.render();
      });
    }));
  };

  App.admin.productEditor = async function (id) {
    const [cats, cols] = await Promise.all([App.api.listCategories(), App.api.listCollections()]);
    let p = null;
    if (id) p = await App.api.getProduct(id);

    const v = (k, def) => (p && p[k] != null ? p[k] : def);
    const catOpts = '<option value="">—</option>' + cats.map((c) => '<option value="' + c.id + '"' + (p && p.category_id === c.id ? ' selected' : '') + '>' + App.esc(c.name) + '</option>').join('');
    const colOpts = '<option value="">—</option>' + cols.map((c) => '<option value="' + c.id + '"' + (p && p.collection_id === c.id ? ' selected' : '') + '>' + App.esc(c.name) + '</option>').join('');

    const form =
      '<div class="form-grid">' +
        '<label class="field span-2"><span>Nome</span><input class="input" id="f-name" value="' + App.esc(v('name', '')) + '"></label>' +
        '<label class="field"><span>SKU</span><input class="input" id="f-sku" value="' + App.esc(v('sku', '')) + '"></label>' +
        '<label class="field"><span>Estoque</span><input class="input" id="f-stock" type="number" value="' + v('stock', 0) + '"></label>' +
        '<label class="field"><span>Preço normal</span><input class="input" id="f-price" type="number" step="0.01" value="' + v('price', 0) + '"></label>' +
        '<label class="field"><span>Preço promocional</span><input class="input" id="f-sale" type="number" step="0.01" value="' + (p && p.sale_price != null ? p.sale_price : '') + '"></label>' +
        '<label class="field"><span>Preço compra em grupo</span><input class="input" id="f-group-price" type="number" step="0.01" value="' + (p && p.group_price != null ? p.group_price : '') + '"></label>' +
        '<label class="field"><span>Categoria</span><select class="input" id="f-cat">' + catOpts + '</select></label>' +
        '<label class="field"><span>Coleção</span><select class="input" id="f-col">' + colOpts + '</select></label>' +
        '<label class="field span-2"><span>Descrição</span><textarea class="input" id="f-desc" rows="3">' + App.esc(v('description', '')) + '</textarea></label>' +
        '<label class="field"><span>Tamanhos (separados por vírgula)</span><input class="input" id="f-sizes" value="' + App.esc((v('sizes', []) || []).join(', ')) + '"></label>' +
        '<label class="field"><span>Cores (separados por vírgula)</span><input class="input" id="f-colors" value="' + App.esc((v('colors', []) || []).join(', ')) + '"></label>' +
        '<label class="field"><span>Ativo</span><select class="input" id="f-active"><option value="1"' + (v('is_active', true) ? ' selected' : '') + '>Sim</option><option value="0"' + (!v('is_active', true) ? ' selected' : '') + '>Não</option></select></label>' +
        '<label class="field"><span>Destaque</span><select class="input" id="f-featured"><option value="0">Não</option><option value="1"' + (v('is_featured', false) ? ' selected' : '') + '>Sim</option></select></label>' +
        '<label class="field"><span>Novo</span><select class="input" id="f-new"><option value="0">Não</option><option value="1"' + (v('is_new', false) ? ' selected' : '') + '>Sim</option></select></label>' +
        '<label class="field"><span>Compra em grupo</span><select class="input" id="f-group"><option value="0">Não</option><option value="1"' + (v('group_enabled', false) ? ' selected' : '') + '>Sim</option></select></label>' +
        '<label class="field"><span>Qtde mínima grupo</span><input class="input" id="f-min" type="number" value="' + v('group_min_qty', 5) + '"></label>' +
      '</div>' +
      '<div class="admin-actions"><button class="btn btn-primary" id="btn-save-product">Salvar produto</button>' +
      (id ? '<a class="btn btn-outline" href="#/admin/produtos">Voltar</a>' : '') + '</div>';

    let media = '';
    if (id) media = App.admin.mediaManager(p);

    return form + media;
  };

  App.admin.mediaManager = function (p) {
    const imgs = (p.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const vids = (p.product_videos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return '<div class="admin-panel mt"><h3>Fotos</h3>' +
      '<div class="media-grid">' + imgs.map((im, i) =>
        '<div class="media-item"><img src="' + App.img(im.url) + '">' +
        (im.is_main ? '<span class="media-main">Principal</span>' : '') +
        '<div class="media-actions">' +
          '<button class="btn btn-sm btn-outline set-main" data-id="' + im.id + '">' + (im.is_main ? 'Principal' : 'Definir principal') + '</button>' +
          '<button class="btn btn-sm btn-outline img-up" data-id="' + im.id + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
          '<button class="btn btn-sm btn-outline img-down" data-id="' + im.id + '" ' + (i === imgs.length - 1 ? 'disabled' : '') + '>↓</button>' +
          '<button class="btn btn-sm btn-danger img-del" data-id="' + im.id + '" data-path="' + App.esc(im.storage_path || '') + '">Excluir</button>' +
        '</div></div>').join('') + '</div>' +
      '<label class="btn btn-outline mt">Enviar fotos<input type="file" id="img-input" accept="image/*" multiple hidden></label>' +
      '<div class="preview-row" id="img-preview"></div>' +
      '</div>' +
      '<div class="admin-panel mt"><h3>Vídeos</h3>' +
      '<div class="media-grid">' + vids.map((v) =>
        '<div class="media-item"><video src="' + App.esc(v.url) + '" controls preload="metadata"></video>' +
        '<div class="media-actions"><button class="btn btn-sm btn-danger vid-del" data-id="' + v.id + '" data-path="' + App.esc(v.storage_path || '') + '">Excluir</button></div></div>').join('') + '</div>' +
      '<label class="btn btn-outline mt">Enviar vídeos<input type="file" id="vid-input" accept="video/*" multiple hidden></label>' +
      '</div>';
  };

  App.admin.bindProduct = function (route) {
    const id = route.query.id;
    const saveBtn = document.getElementById('btn-save-product');
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      const g = (n) => document.getElementById(n).value;
      const csv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
      const payload = {
        name: g('f-name'), sku: g('f-sku'), stock: parseInt(g('f-stock')) || 0,
        price: parseFloat(g('f-price')) || 0,
        sale_price: g('f-sale') ? parseFloat(g('f-sale')) : null,
        group_price: g('f-group-price') ? parseFloat(g('f-group-price')) : null,
        category_id: g('f-cat') || null, collection_id: g('f-col') || null,
        description: document.getElementById('f-desc').value,
        sizes: csv(g('f-sizes')), colors: csv(g('f-colors')),
        is_active: g('f-active') === '1', is_featured: g('f-featured') === '1', is_new: g('f-new') === '1',
        group_enabled: g('f-group') === '1', group_min_qty: parseInt(g('f-min')) || 5
      };
      if (!payload.name) { App.toast('Informe o nome do produto', 'error'); return; }
      if (id) payload.id = id;
      else payload.slug = App.slugify(payload.name) + '-' + Math.random().toString(36).slice(2, 6);
      App.loading(true);
      try {
        const saved = await App.admin.api.saveProduct(payload);
        App.toast('Produto salvo', 'success');
        App.navigate('#/admin/produto?id=' + saved.id);
      } catch (e) {
        App.toast(App.errMsg(e), 'error');
      } finally {
        App.loading(false);
      }
    });

    if (id) {
      const imgInput = document.getElementById('img-input');
      const vidInput = document.getElementById('vid-input');
      const preview = document.getElementById('img-preview');

      if (imgInput) imgInput.addEventListener('change', async () => {
        const files = Array.from(imgInput.files || []);
        preview.innerHTML = files.map((f) => '<div class="preview-item"><img src="' + URL.createObjectURL(f) + '"><span>' + App.esc(f.name) + '</span></div>').join('');
        App.loading(true);
        try {
          const imgs = await App.api.getProduct(id);
          const maxOrder = (imgs.product_images || []).reduce((m, i) => Math.max(m, i.sort_order), 0);
          for (let i = 0; i < files.length; i++) {
            const up = await App.admin.upload('product-images', id, files[i]);
            await App.admin.api.addImage({ product_id: id, storage_path: up.path, url: up.url, sort_order: maxOrder + i + 1, is_main: !(imgs.product_images || []).length && i === 0 });
          }
          App.toast('Fotos enviadas', 'success');
          App.navigate(location.hash);
        } catch (e) {
          App.toast(App.errMsg(e), 'error');
        } finally {
          App.loading(false);
        }
      });

      if (vidInput) vidInput.addEventListener('change', async () => {
        const files = Array.from(vidInput.files || []);
        App.loading(true);
        try {
          const p = await App.api.getProduct(id);
          const maxOrder = (p.product_videos || []).reduce((m, i) => Math.max(m, i.sort_order), 0);
          for (let i = 0; i < files.length; i++) {
            const up = await App.admin.upload('product-videos', id, files[i]);
            await App.admin.api.addVideo({ product_id: id, storage_path: up.path, url: up.url, sort_order: maxOrder + i + 1 });
          }
          App.toast('Vídeos enviados', 'success');
          App.navigate(location.hash);
        } catch (e) {
          App.toast(App.errMsg(e), 'error');
        } finally {
          App.loading(false);
        }
      });

      document.querySelectorAll('.set-main').forEach((b) => b.addEventListener('click', async () => {
        const pid = id;
        await App.admin.api.updateImage(b.getAttribute('data-id'), { is_main: true });
        const imgs = await App.api.getProduct(pid);
        await Promise.all((imgs.product_images || []).filter((i) => i.id !== b.getAttribute('data-id')).map((i) => App.admin.api.updateImage(i.id, { is_main: false })));
        App.toast('Imagem principal definida', 'success');
        App.navigate(location.hash);
      }));

      document.querySelectorAll('.img-del').forEach((b) => b.addEventListener('click', async () => {
        await App.admin.removeFile('product-images', b.getAttribute('data-path'));
        await App.admin.api.deleteImage(b.getAttribute('data-id'));
        App.navigate(location.hash);
      }));
      document.querySelectorAll('.vid-del').forEach((b) => b.addEventListener('click', async () => {
        await App.admin.removeFile('product-videos', b.getAttribute('data-path'));
        await App.admin.api.deleteVideo(b.getAttribute('data-id'));
        App.navigate(location.hash);
      }));

      document.querySelectorAll('.img-up, .img-down').forEach((b) => b.addEventListener('click', async () => {
        const dir = b.classList.contains('img-up') ? -1 : 1;
        const imgs = (await App.api.getProduct(id)).product_images.slice().sort((a, b) => a.sort_order - b.sort_order);
        const idx = imgs.findIndex((i) => i.id === b.getAttribute('data-id'));
        const swap = imgs[idx + dir];
        if (!swap) return;
        await App.admin.api.updateImage(imgs[idx].id, { sort_order: swap.sort_order });
        await App.admin.api.updateImage(swap.id, { sort_order: imgs[idx].sort_order });
        App.navigate(location.hash);
      }));
    }
  };

  // ---------- CATEGORIES ----------
  App.admin.categoriesList = async function () {
    const cats = await App.api.listCategories();
    return '<div class="admin-panel"><h3>Nova categoria</h3><div class="form-inline">' +
      '<input class="input" id="c-name" placeholder="Nome">' +
      '<input class="input" id="c-order" type="number" placeholder="Ordem" value="0">' +
      '<button class="btn btn-primary" id="btn-add-cat">Adicionar</button></div></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>Slug</th><th></th></tr></thead><tbody>' +
      cats.map((c) => '<tr><td>' + App.esc(c.name) + '</td><td>' + App.esc(c.slug) + '</td><td><button class="btn btn-sm btn-danger del-cat" data-id="' + c.id + '">Excluir</button></td></tr>').join('') +
      '</tbody></table></div>';
  };

  App.admin.bindCategories = function () {
    const add = document.getElementById('btn-add-cat');
    if (add) add.addEventListener('click', async () => {
      const name = document.getElementById('c-name').value.trim();
      const order = parseInt(document.getElementById('c-order').value) || 0;
      if (!name) { App.toast('Informe o nome', 'error'); return; }
      await App.admin.api.saveCategory({ name, slug: App.slugify(name), sort_order: order });
      App.navigate(location.hash);
    });
    document.querySelectorAll('.del-cat').forEach((b) => b.addEventListener('click', () => {
      App.confirm('Excluir categoria?', async () => { await App.admin.api.deleteCategory(b.getAttribute('data-id')); App.navigate(location.hash); });
    }));
  };

  // ---------- COLLECTIONS ----------
  App.admin.collectionsList = async function () {
    const cols = await App.api.listCollections();
    return '<div class="admin-panel"><h3>Nova coleção</h3><div class="form-inline">' +
      '<input class="input" id="co-name" placeholder="Nome">' +
      '<input class="input" id="co-desc" placeholder="Descrição">' +
      '<button class="btn btn-primary" id="btn-add-col">Adicionar</button></div></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>Slug</th><th></th></tr></thead><tbody>' +
      cols.map((c) => '<tr><td>' + App.esc(c.name) + '</td><td>' + App.esc(c.slug) + '</td><td><button class="btn btn-sm btn-danger del-col" data-id="' + c.id + '">Excluir</button></td></tr>').join('') +
      '</tbody></table></div>';
  };

  App.admin.bindCollections = function () {
    const add = document.getElementById('btn-add-col');
    if (add) add.addEventListener('click', async () => {
      const name = document.getElementById('co-name').value.trim();
      const desc = document.getElementById('co-desc').value.trim();
      if (!name) { App.toast('Informe o nome', 'error'); return; }
      await App.admin.api.saveCollection({ name, slug: App.slugify(name), description: desc });
      App.navigate(location.hash);
    });
    document.querySelectorAll('.del-col').forEach((b) => b.addEventListener('click', () => {
      App.confirm('Excluir coleção?', async () => { await App.admin.api.deleteCollection(b.getAttribute('data-id')); App.navigate(location.hash); });
    }));
  };

  // ---------- ORDERS ----------
  App.admin.ordersList = async function () {
    const orders = await App.admin.api.listOrdersAdmin();
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Número</th><th>Cliente</th><th>Data</th><th>Total</th><th>Tipo</th><th>Status</th><th></th></tr></thead><tbody>' +
      orders.map((o) =>
        '<tr><td>' + App.esc(o.order_number) + '</td>' +
        '<td>' + App.esc(o.profile && o.profile.full_name || '—') + '</td>' +
        '<td>' + App.formatDate(o.created_at) + '</td>' +
        '<td>' + App.money(o.total) + '</td>' +
        '<td>' + (o.type === 'group' ? 'Grupo' : 'Normal') + '</td>' +
        '<td><select class="input order-status" data-id="' + o.id + '">' +
          Object.keys(App.ORDER_STATUS).map((k) => '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + App.ORDER_STATUS[k] + '</option>').join('') +
        '</select></td>' +
        '<td class="cell-actions"><button class="btn btn-sm btn-outline view-order" data-id="' + o.id + '">Detalhes</button></td></tr>'
      ).join('') + '</tbody></table></div>';
  };

  App.admin.bindOrders = function () {
    document.querySelectorAll('.order-status').forEach((s) => s.addEventListener('change', async () => {
      await App.api.updateOrderStatus(s.getAttribute('data-id'), s.value);
      App.toast('Status atualizado', 'success');
    }));
    document.querySelectorAll('.view-order').forEach((b) => b.addEventListener('click', async () => {
      const o = await App.api.getOrder(b.getAttribute('data-id'));
      App.admin.orderDetailModal(o);
    }));
  };

  App.admin.orderDetailModal = function (o) {
    const items = (o.order_items || []).map((i) =>
      '<div class="sum-row"><span>' + App.esc(i.name) + ' (' + App.esc(i.size || '—') + '/' + App.esc(i.color || '—') + ') ×' + i.quantity + '</span><span>' + App.money(parseFloat(i.unit_price) * i.quantity) + '</span></div>').join('');
    const grp = o.group_purchases ? '<p class="muted">Grupo: ' + (App.GROUP_STATUS[o.group_purchases.status] || o.group_purchases.status) + ' (' + o.group_purchases.current_qty + '/' + o.group_purchases.min_qty + ')</p>' : '';
    const wa = App.whatsLink(o.phone, App.buildOrderMessage(o));
    const m = App.modal(
      '<div class="modal-body"><h2>' + App.esc(o.order_number) + '</h2>' +
      '<span class="or-status status-' + App.esc(o.status) + '">' + (App.ORDER_STATUS[o.status] || o.status) + '</span>' + grp +
      '<h3>Cliente</h3><p>' + App.esc(o.recipient) + '<br>' + App.esc(o.phone) + '</p>' +
      '<h3>Endereço</h3><p>' + [o.street, o.number, o.complement, o.neighborhood, o.city, o.state, o.zip].filter(Boolean).join(', ') + '</p>' +
      '<h3>Produtos</h3><div class="checkout-summary">' + items +
        '<div class="sum-row"><span>Subtotal</span><span>' + App.money(o.subtotal) + '</span></div>' +
        (parseFloat(o.discount) > 0 ? '<div class="sum-row discount"><span>Desconto</span><span>− ' + App.money(o.discount) + '</span></div>' : '') +
        '<div class="sum-row total"><span>Total</span><span>' + App.money(o.total) + '</span></div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<a class="btn btn-whats" href="' + wa + '" target="_blank" rel="noopener">' + App.icon('whats') + ' WhatsApp</a>' +
        (o.status !== 'cancelled' ? '<button class="btn btn-danger" id="cancel-order" data-id="' + o.id + '">Cancelar pedido</button>' : '') +
      '</div></div>'
    );
    const cancel = m.el.querySelector('#cancel-order');
    if (cancel) cancel.addEventListener('click', () => {
      App.confirm('Cancelar este pedido?', async () => {
        await App.api.updateOrderStatus(cancel.getAttribute('data-id'), 'cancelled');
        m.close();
        App.navigate(location.hash);
      });
    });
  };

  // ---------- CUSTOMERS ----------
  App.admin.customersList = async function () {
    const customers = await App.api.listCustomers();
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Cadastro</th><th>Pedidos</th><th></th></tr></thead><tbody>' +
      customers.map((c) =>
        '<tr><td>' + App.esc(c.full_name) + '</td><td>' + App.esc(c.email) + '</td><td>' + App.esc(c.phone) + '</td>' +
        '<td>' + App.formatDate(c.created_at) + '</td><td>' + c.orderCount + '</td>' +
        '<td><button class="btn btn-sm btn-outline view-customer" data-id="' + c.id + '">Ver</button></td></tr>'
      ).join('') + '</tbody></table></div>';
  };

  App.admin.bindCustomers = function () {
    document.querySelectorAll('.view-customer').forEach((b) => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const [orders, addrs, groups] = await Promise.all([
        App.api.listOrders(id), App.api.listAddresses(id), App.api.myGroups(id)
      ]);
      const m = App.modal(
        '<div class="modal-body"><h2>Dados do cliente</h2>' +
        '<h3>Pedidos (' + orders.length + ')</h3><div class="mini-list">' + orders.map((o) => '<span>' + App.esc(o.order_number) + ' · ' + App.money(o.total) + ' · ' + (App.ORDER_STATUS[o.status] || o.status) + '</span>').join('') + '</div>' +
        '<h3>Endereços (' + addrs.length + ')</h3><div class="mini-list">' + addrs.map((a) => '<span>' + App.esc(a.street) + ', ' + App.esc(a.number) + ' · ' + App.esc(a.city) + '/' + App.esc(a.state) + '</span>').join('') + '</div>' +
        '<h3>Compras em grupo (' + groups.length + ')</h3><div class="mini-list">' + groups.map((g) => '<span>' + App.esc(g.group.product.name) + ' · ' + App.esc(g.group.status) + '</span>').join('') + '</div>' +
        '</div>'
      );
    }));
  };

  // ---------- GROUPS ----------
  App.admin.groupsList = async function () {
    const groups = await App.admin.api.listGroups();
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Produto</th><th>Mínimo</th><th>Participantes</th><th>Progresso</th><th>Desconto</th><th>Status</th><th></th></tr></thead><tbody>' +
      groups.map((g) => {
        const min = g.min_qty || 1;
        const cur = g.current_qty || 0;
        const pct = Math.min(100, Math.round((cur / min) * 100));
        return '<tr><td>' + App.esc(g.product && g.product.name || '—') + '</td>' +
          '<td>' + min + '</td><td>' + cur + '</td>' +
          '<td><div class="progress"><div class="progress-fill" style="width:' + pct + '%"></div></div></td>' +
          '<td>' + App.money(g.discount_price) + '</td>' +
          '<td><span class="or-status status-' + App.esc(g.status) + '">' + (App.GROUP_STATUS[g.status] || g.status) + '</span></td>' +
          '<td class="cell-actions"><button class="btn btn-sm btn-outline view-members" data-id="' + g.id + '">Participantes</button>' +
          (g.status === 'open' ? '<button class="btn btn-sm btn-danger close-group" data-id="' + g.id + '">Encerrar</button>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  };

  App.admin.bindGroups = function () {
    document.querySelectorAll('.view-members').forEach((b) => b.addEventListener('click', async () => {
      const members = await App.api.listGroupMembers(b.getAttribute('data-id'));
      const m = App.modal('<div class="modal-body"><h2>Participantes (' + members.length + ')</h2><div class="mini-list">' +
        members.map((mem) => {
          const nm = mem.name || (mem.profile && mem.profile.full_name) || '—';
          const ph = mem.phone || (mem.profile && mem.profile.phone) || '';
          return '<span>' + App.esc(nm) + ' · ' + App.esc(ph) + ' · ' + App.formatDate(mem.created_at) + '</span>';
        }).join('') +
        '</div></div>');
    }));
    document.querySelectorAll('.close-group').forEach((b) => b.addEventListener('click', () => {
      App.confirm('Encerrar este grupo?', async () => {
        await App.admin.api.updateGroupStatus(b.getAttribute('data-id'), 'closed');
        App.toast('Grupo encerrado', 'success');
        App.navigate(location.hash);
      });
    }));
  };

  // ---------- MEDIA ----------
  App.admin.mediaList = async function () {
    const { images, videos } = await App.admin.api.listMedia();
    const imgRows = images.map((i) => '<tr><td>Imagem</td><td>' + App.esc(i.product && i.product.name || '—') + '</td><td><img class="cell-img" src="' + App.img(i.url) + '"></td><td><button class="btn btn-sm btn-danger del-media" data-kind="image" data-id="' + i.id + '" data-path="' + App.esc(i.storage_path || '') + '">Excluir</button></td></tr>').join('');
    const vidRows = videos.map((v) => '<tr><td>Vídeo</td><td>' + App.esc(v.product && v.product.name || '—') + '</td><td><video class="cell-video" src="' + App.esc(v.url) + '" controls preload="metadata"></video></td><td><button class="btn btn-sm btn-danger del-media" data-kind="video" data-id="' + v.id + '" data-path="' + App.esc(v.storage_path || '') + '">Excluir</button></td></tr>').join('');
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Tipo</th><th>Produto</th><th>Mídia</th><th></th></tr></thead><tbody>' + imgRows + vidRows + '</tbody></table></div>';
  };

  App.admin.bindMedia = function () {
    document.querySelectorAll('.del-media').forEach((b) => b.addEventListener('click', async () => {
      const kind = b.getAttribute('data-kind');
      const bucket = kind === 'image' ? 'product-images' : 'product-videos';
      await App.admin.removeFile(bucket, b.getAttribute('data-path'));
      if (kind === 'image') await App.admin.api.deleteImage(b.getAttribute('data-id'));
      else await App.admin.api.deleteVideo(b.getAttribute('data-id'));
      App.navigate(location.hash);
    }));
  };

  // ---------- SITE CONFIG ----------
  App.admin.configForm = async function () {
    const s = App.STORE.settings || {};
    const brand = s.brand || {};
    const hero = s.hero || {};
    const social = s.social || {};
    const contact = s.contact || {};
    const footer = s.footer || {};
    const colors = s.colors || {};
    return '<div class="form-grid">' +
      '<label class="field"><span>Nome da loja</span><input class="input" id="s-name" value="' + App.esc(brand.name || '') + '"></label>' +
      '<label class="field"><span>Slogan</span><input class="input" id="s-slogan" value="' + App.esc(brand.slogan || '') + '"></label>' +
      '<label class="field span-2"><span>Frase da marca</span><input class="input" id="s-tagline" value="' + App.esc(brand.tagline || '') + '"></label>' +
      '<label class="field span-2"><span>URL da logo</span><input class="input" id="s-logo" value="' + App.esc(brand.logo_url || '') + '"></label>' +
      '<label class="field"><span>Banner - título</span><input class="input" id="s-hero-title" value="' + App.esc(hero.title || '') + '"></label>' +
      '<label class="field"><span>Banner - subtítulo</span><input class="input" id="s-hero-sub" value="' + App.esc(hero.subtitle || '') + '"></label>' +
      '<label class="field span-2"><span>Banner - URL da imagem</span><input class="input" id="s-hero-img" value="' + App.esc(hero.image_url || '') + '"></label>' +
      '<label class="field"><span>Instagram</span><input class="input" id="s-insta" value="' + App.esc(social.instagram || '') + '"></label>' +
      '<label class="field"><span>TikTok</span><input class="input" id="s-tiktok" value="' + App.esc(social.tiktok || '') + '"></label>' +
      '<label class="field"><span>Facebook</span><input class="input" id="s-face" value="' + App.esc(social.facebook || '') + '"></label>' +
      '<label class="field"><span>E-mail de contato</span><input class="input" id="s-email" value="' + App.esc(contact.email || '') + '"></label>' +
      '<label class="field"><span>Telefone de contato</span><input class="input" id="s-phone" value="' + App.esc(contact.phone || '') + '"></label>' +
      '<label class="field span-2"><span>Texto do rodapé (sobre)</span><textarea class="input" id="s-about" rows="2">' + App.esc(footer.about || '') + '</textarea></label>' +
      '<label class="field"><span>Cor primária</span><input class="input" id="s-color-primary" type="color" value="' + App.esc(colors.primary || '#b08968') + '"></label>' +
      '<label class="field"><span>Cor de destaque</span><input class="input" id="s-color-accent" type="color" value="' + App.esc(colors.accent || '#e6ccb2') + '"></label>' +
      '</div>' +
      '<div class="admin-actions"><button class="btn btn-primary" id="btn-save-config">Salvar configurações</button></div>' +
      '<div class="admin-panel mt"><h3>Enviar logo / banner</h3>' +
      '<label class="btn btn-outline">Enviar imagem (logo/banner)<input type="file" id="asset-input" accept="image/*" hidden></label>' +
      '<p class="muted mt" id="asset-result"></p></div>';
  };

  App.admin.bindConfig = function () {
    const save = document.getElementById('btn-save-config');
    if (save) save.addEventListener('click', async () => {
      const g = (n) => document.getElementById(n).value;
      await App.api.saveSiteSetting('brand', { logo_url: g('s-logo'), name: g('s-name'), slogan: g('s-slogan'), tagline: g('s-tagline') });
      await App.api.saveSiteSetting('hero', { title: g('s-hero-title'), subtitle: g('s-hero-sub'), image_url: g('s-hero-img') });
      await App.api.saveSiteSetting('social', { instagram: g('s-insta'), tiktok: g('s-tiktok'), facebook: g('s-face') });
      await App.api.saveSiteSetting('contact', { email: g('s-email'), phone: g('s-phone') });
      await App.api.saveSiteSetting('footer', { about: g('s-about'), copyright: 'USE LOMA - Todos os direitos reservados.' });
      await App.api.saveSiteSetting('colors', { primary: g('s-color-primary'), accent: g('s-color-accent'), background: '#faf6f1', text: '#3e2f23' });
      App.STORE.settings = await App.api.getSiteSettings();
      App.applyTheme(App.STORE.settings);
      App.toast('Configurações salvas', 'success');
    });
    const assetInput = document.getElementById('asset-input');
    if (assetInput) assetInput.addEventListener('change', async () => {
      const file = assetInput.files[0];
      if (!file) return;
      App.loading(true);
      try {
        const up = await App.admin.upload('site-assets', 'assets', file);
        document.getElementById('asset-result').textContent = 'URL: ' + up.url;
        App.toast('Imagem enviada. Copie a URL para usar nos campos acima.', 'success');
      } catch (e) {
        App.toast(App.errMsg(e), 'error');
      } finally {
        App.loading(false);
      }
    });
  };

  // ---------- WHATSAPP ----------
  App.admin.whatsappForm = async function () {
    const w = App.STORE.whatsapp || {};
    const phone = w.admin_phone || {};
    const messages = w.messages || {};
    return '<div class="form-grid">' +
      '<label class="field span-2"><span>WhatsApp do administrador (com DDI, ex: 5511999999999)</span><input class="input" id="w-phone" value="' + App.esc(phone.number || '') + '"></label>' +
      '<label class="field span-2"><span>Mensagem padrão</span><textarea class="input" id="w-default" rows="2">' + App.esc(messages.default || '') + '</textarea></label>' +
      '<label class="field span-2"><span>Mensagem de confirmação</span><textarea class="input" id="w-confirm" rows="2">' + App.esc(messages.confirmation || '') + '</textarea></label>' +
      '<label class="field span-2"><span>Mensagem de novo pedido (título)</span><input class="input" id="w-neworder" value="' + App.esc(messages.new_order || '') + '"></label>' +
      '</div>' +
      '<div class="admin-actions"><button class="btn btn-primary" id="btn-save-whatsapp">Salvar</button></div>';
  };

  App.admin.bindWhatsapp = function () {
    const save = document.getElementById('btn-save-whatsapp');
    if (save) save.addEventListener('click', async () => {
      const phone = document.getElementById('w-phone').value.trim();
      await App.api.saveWhatsappSetting('admin_phone', { number: phone });
      await App.api.saveWhatsappSetting('messages', {
        default: document.getElementById('w-default').value,
        confirmation: document.getElementById('w-confirm').value,
        new_order: document.getElementById('w-neworder').value
      });
      App.STORE.whatsapp = await App.api.getWhatsappSettings();
      App.toast('Configurações de WhatsApp salvas', 'success');
    });
  };

  // ---------- ADMINS ----------
  App.admin.adminsList = async function () {
    const admins = await App.api.listAdminUsers();
    return '<div class="admin-panel"><h3>Adicionar administrador</h3><div class="form-inline">' +
      '<input class="input" id="a-email" placeholder="E-mail do usuário">' +
      '<button class="btn btn-primary" id="btn-add-admin">Adicionar</button></div></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Desde</th><th></th></tr></thead><tbody>' +
      admins.map((a) => '<tr><td>' + App.esc(a.profile && a.profile.full_name || '—') + '</td><td>' + App.esc(a.profile && a.profile.email || '—') + '</td><td>' + App.formatDate(a.created_at) + '</td><td>' + (admins.length > 1 ? '<button class="btn btn-sm btn-danger del-admin" data-id="' + a.id + '">Remover</button>' : '') + '</td></tr>').join('') +
      '</tbody></table></div>';
  };

  App.admin.bindAdmins = function () {
    const add = document.getElementById('btn-add-admin');
    if (add) add.addEventListener('click', async () => {
      const email = document.getElementById('a-email').value.trim();
      if (!App.validateEmail(email)) { App.toast('E-mail inválido', 'error'); return; }
      const { data, error } = await App.sb.from('profiles').select('id').eq('email', email).maybeSingle();
      if (error || !data) { App.toast('Usuário não encontrado', 'error'); return; }
      try {
        await App.api.addAdmin(data.id);
        App.toast('Administrador adicionado', 'success');
        App.navigate(location.hash);
      } catch (e) {
        App.toast(App.errMsg(e), 'error');
      }
    });
    document.querySelectorAll('.del-admin').forEach((b) => b.addEventListener('click', () => {
      App.confirm('Remover este administrador?', async () => { await App.api.removeAdmin(b.getAttribute('data-id')); App.navigate(location.hash); });
    }));
  };
})();
