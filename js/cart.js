(function () {
  App.cart = {};

  App.cart.load = function () {
    try {
      const raw = localStorage.getItem(App.CART_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  };

  App.cart.save = function (items) {
    localStorage.setItem(App.CART_KEY, JSON.stringify(items));
    App.emit('cart');
  };

  App.cart.items = function () {
    return App.cart.load();
  };

  App.cart.count = function () {
    return App.cart.load().reduce((s, i) => s + (i.quantity || 0), 0);
  };

  App.cart.add = function (item) {
    const items = App.cart.load();
    const key = (item.product_id || '') + '|' + (item.size || '') + '|' + (item.color || '') + '|' + (item.group ? 'g' : 'n');
    const existing = items.find((i) => i.key === key);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      item.key = key;
      items.push(item);
    }
    App.cart.save(items);
  };

  App.cart.remove = function (key) {
    const items = App.cart.load().filter((i) => i.key !== key);
    App.cart.save(items);
  };

  App.cart.updateQty = function (key, qty) {
    const items = App.cart.load();
    const it = items.find((i) => i.key === key);
    if (!it) return;
    it.quantity = Math.max(1, qty);
    App.cart.save(items);
  };

  App.cart.clear = function () {
    App.cart.save([]);
  };

  App.cart.subtotal = function () {
    return App.cart.load().reduce((s, i) => s + (parseFloat(i.price) || 0) * (i.quantity || 0), 0);
  };

  // expected total considering group discounts (fetched async)
  App.cart.expected = async function () {
    const items = App.cart.load();
    let subtotal = 0;
    let discount = 0;
    for (const it of items) {
      const normal = parseFloat(it.price) || 0;
      let applied = normal;
      if (it.group) {
        const g = await App.api.getGroupForProduct(it.product_id);
        if (g && g.status === 'complete') {
          applied = parseFloat(g.discount_price) || parseFloat(it.group_price) || normal;
        }
      }
      subtotal += normal * it.quantity;
      discount += (normal - applied) * it.quantity;
    }
    return { subtotal, discount, total: subtotal - discount };
  };
})();
