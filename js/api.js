(function () {
  App.authFlow = { type: null };
  try {
    const m = (window.location.hash || '').match(/[?&#]type=(signup|recovery|invite|email|magiclink|email_change)/);
    if (m) App.authFlow.type = m[1];
  } catch (e) {}

  App.sb = supabase.createClient(App.cfg.supabaseUrl, App.cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  App.api = {};

  App.api.onAuth = function () {
    App.sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        App.emit('auth', session);
        if (App.authFlow.type === 'signup') {
          App.authFlow.type = null;
          App.navigate('#/confirmacao');
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        App.emit('auth', session);
        App.authFlow.type = null;
        App.navigate('#/redefinir-senha');
      } else if (event === 'SIGNED_OUT') {
        App.emit('auth', null);
      } else if (event === 'USER_UPDATED') {
        App.emit('auth', session);
      }
    });
  };

  App.api.getSession = async function () {
    const { data } = await App.sb.auth.getSession();
    return data.session || null;
  };

  App.api.signUp = async function (full_name, email, phone, password) {
    const { data, error } = await App.sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: full_name, phone: phone } }
    });
    if (error) throw error;
    return data;
  };

  App.api.signIn = async function (email, password) {
    const { data, error } = await App.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  App.api.signOut = async function () {
    const { error } = await App.sb.auth.signOut();
    if (error) throw error;
  };

  App.api.getProfile = async function () {
    const session = await App.api.getSession();
    if (!session) return null;
    const { data, error } = await App.sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  App.api.updateProfile = async function (id, updates) {
    const { data, error } = await App.sb.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  };

  App.api.isAdmin = async function () {
    const session = await App.api.getSession();
    if (!session) return false;
    const { data, error } = await App.sb
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) return false;
    return !!data;
  };

  App.api.getSiteSettings = async function () {
    const { data, error } = await App.sb.from('site_settings').select('key, value');
    if (error) throw error;
    const out = {};
    (data || []).forEach((r) => (out[r.key] = r.value));
    return out;
  };

  App.api.saveSiteSetting = async function (key, value) {
    const { data, error } = await App.sb
      .from('site_settings')
      .upsert({ key: key, value: value }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  App.api.getWhatsappSettings = async function () {
    const { data, error } = await App.sb.from('whatsapp_settings').select('key, value');
    if (error) throw error;
    const out = {};
    (data || []).forEach((r) => (out[r.key] = r.value));
    return out;
  };

  App.api.saveWhatsappSetting = async function (key, value) {
    const { data, error } = await App.sb
      .from('whatsapp_settings')
      .upsert({ key: key, value: value }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  App.api.getAdminPhone = async function () {
    const s = await App.api.getWhatsappSettings();
    return (s.admin_phone && s.admin_phone.number) || '';
  };

  App.api.listProducts = async function (filters) {
    let q = App.sb.from('products').select(
      '*, product_images(id, url, sort_order, is_main), product_videos(id, url, sort_order), category:categories(name, slug), collection:collections(name, slug)'
    );
    if (filters && filters.activeOnly) q = q.eq('is_active', true);
    if (filters && filters.featured) q = q.eq('is_featured', true);
    if (filters && filters.isNew) q = q.eq('is_new', true);
    if (filters && filters.category) q = q.eq('category_id', filters.category);
    if (filters && filters.collection) q = q.eq('collection_id', filters.collection);
    q = q.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  App.api.getProduct = async function (id) {
    const { data, error } = await App.sb
      .from('products')
      .select(
        '*, product_images(id, url, sort_order, is_main), product_videos(id, url, sort_order), category:categories(name, slug), collection:collections(name, slug)'
      )
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  };

  App.api.listCategories = async function () {
    const { data, error } = await App.sb.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return data || [];
  };

  App.api.listCollections = async function () {
    const { data, error } = await App.sb.from('collections').select('*').order('sort_order');
    if (error) throw error;
    return data || [];
  };

  App.api.getGroupForProduct = async function (productId) {
    const { data, error } = await App.sb
      .from('group_purchases')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'open')
      .order('created_at')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  App.api.getGroup = async function (groupId) {
    const { data, error } = await App.sb
      .from('group_purchases')
      .select('*, product:products(name, group_price, group_min_qty)')
      .eq('id', groupId)
      .single();
    if (error) throw error;
    return data;
  };

  App.api.joinGroup = async function (productId, name, phone) {
    const { data, error } = await App.sb.rpc('join_group', { p_product_id: productId, p_name: name, p_phone: phone });
    if (error) throw error;
    return data;
  };

  App.api.getMyMembership = async function (groupId) {
    const session = await App.api.getSession();
    if (!session) return null;
    const { data, error } = await App.sb
      .from('group_purchase_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  App.api.subscribeGroup = function (productId, cb) {
    return App.sb
      .channel('group-' + productId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_purchases', filter: 'product_id=eq.' + productId }, (payload) => cb(payload.new))
      .subscribe();
  };

  App.api.createOrder = async function (cart, address) {
    const { data, error } = await App.sb.rpc('create_order', { p_cart: cart, p_address: address });
    if (error) throw error;
    return data;
  };

  App.api.listAddresses = async function (userId) {
    const { data, error } = await App.sb.from('addresses').select('*').eq('user_id', userId).order('created_at');
    if (error) throw error;
    return data || [];
  };

  App.api.saveAddress = async function (address) {
    const { data, error } = await App.sb
      .from('addresses')
      .upsert(address, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  App.api.deleteAddress = async function (id) {
    const { error } = await App.sb.from('addresses').delete().eq('id', id);
    if (error) throw error;
  };

  App.api.listOrders = async function (userId) {
    let q = App.sb.from('orders').select('*, order_items(*), group_purchases(status, min_qty, current_qty)');
    if (userId) q = q.eq('user_id', userId);
    q = q.order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  App.api.getOrder = async function (id) {
    const { data, error } = await App.sb
      .from('orders')
      .select('*, order_items(*), group_purchases(status, min_qty, current_qty, discount_price)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  };

  App.api.updateOrderStatus = async function (id, status) {
    const { data, error } = await App.sb.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  };

  App.api.listGroupMembers = async function (groupId) {
    const { data, error } = await App.sb
      .from('group_purchase_members')
      .select('*, profile:profiles(full_name, email, phone)')
      .eq('group_id', groupId)
      .order('created_at');
    if (error) throw error;
    return data || [];
  };

  App.api.myGroups = async function (userId) {
    const { data, error } = await App.sb
      .from('group_purchase_members')
      .select('*, group:group_purchases(*, product:products(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  App.api.listCustomers = async function () {
    const { data: profiles, error } = await App.sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const { data: orders } = await App.sb.from('orders').select('id, user_id, created_at, total');
    const byUser = {};
    (orders || []).forEach((o) => {
      byUser[o.user_id] = byUser[o.user_id] || { count: 0, last: null };
      byUser[o.user_id].count++;
      if (!byUser[o.user_id].last || new Date(o.created_at) > new Date(byUser[o.user_id].last)) {
        byUser[o.user_id].last = o.created_at;
      }
    });
    return (profiles || []).map((p) => ({
      ...p,
      orderCount: (byUser[p.id] && byUser[p.id].count) || 0,
      lastOrder: (byUser[p.id] && byUser[p.id].last) || null
    }));
  };

  App.api.listAdminUsers = async function () {
    const { data, error } = await App.sb
      .from('admin_users')
      .select('*, profile:profiles(full_name, email)')
      .order('created_at');
    if (error) throw error;
    return data || [];
  };

  App.api.addAdmin = async function (userId) {
    const { data, error } = await App.sb.from('admin_users').insert({ user_id: userId }).select().single();
    if (error) throw error;
    return data;
  };

  App.api.removeAdmin = async function (id) {
    const { error } = await App.sb.from('admin_users').delete().eq('id', id);
    if (error) throw error;
  };
})();
