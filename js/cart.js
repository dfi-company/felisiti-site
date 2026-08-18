/* Felicity - cart logic (localStorage). Requires products.js loaded first. */
(function () {
  "use strict";

  var CART_KEY = "felicity_cart";

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (item) {
      item.qty += qty;
    } else {
      cart.push({ id: id, qty: qty });
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (i) { return i.id !== id; });
    saveCart(cart);
  }

  function updateQty(id, qty) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    item.qty = qty;
    saveCart(cart);
  }

  function getCartCount() {
    return getCart().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function getCartDetails() {
    var cart = getCart();
    var products = (window.FELICITY_PRODUCTS || []);
    return cart.map(function (i) {
      var product = products.find(function (p) { return p.id === i.id; });
      if (!product) return null;
      return { product: product, qty: i.qty };
    }).filter(Boolean);
  }

  function formatPrice(value) {
    return value.toLocaleString("uk-UA") + " ₴";
  }

  function updateCartCount() {
    var els = document.querySelectorAll("[data-cart-count]");
    var count = getCartCount();
    els.forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  function renderCartPage() {
    var container = document.querySelector("[data-cart-root]");
    if (!container) return;
    var details = getCartDetails();

    if (details.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
        "<p>Ваш кошик порожній.</p>" +
        '<a class="btn btn-primary" href="' + rel("index.html") + '">Перейти в каталог</a>' +
        "</div>";
      var summary = document.querySelector("[data-cart-summary]");
      if (summary) summary.style.display = "none";
      return;
    }

    var rows = details.map(function (d) {
      var p = d.product;
      var lineTotal = p.price * d.qty;
      return (
        '<tr data-row="' + p.id + '">' +
        '<td><div class="cart-product">' +
        '<img src="' + rel(p.image) + '" width="56" height="56" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
        '<a href="' + rel(p.url) + '">' + escapeHtml(p.name) + "</a>" +
        "</div></td>" +
        "<td>" + formatPrice(p.price) + "</td>" +
        '<td><div class="qty-input">' +
        '<button type="button" data-decr="' + p.id + '" aria-label="Зменшити кількість">−</button>' +
        '<input type="number" min="1" value="' + d.qty + '" data-qty="' + p.id + '" aria-label="Кількість">' +
        '<button type="button" data-incr="' + p.id + '" aria-label="Збільшити кількість">+</button>' +
        "</div></td>" +
        '<td data-line-total="' + p.id + '">' + formatPrice(lineTotal) + "</td>" +
        '<td><button type="button" class="cart-remove" data-remove="' + p.id + '" aria-label="Видалити товар">✕</button></td>' +
        "</tr>"
      );
    }).join("");

    container.innerHTML =
      '<table class="cart-table">' +
      "<thead><tr>" +
      "<th>Товар</th><th>Ціна</th><th>Кількість</th><th>Сума</th><th></th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table>";

    container.addEventListener("click", function (e) {
      var target = e.target;
      if (target.dataset.remove) {
        removeFromCart(Number(target.dataset.remove));
        renderCartPage();
        updateSummary();
      } else if (target.dataset.incr) {
        stepQty(Number(target.dataset.incr), 1);
      } else if (target.dataset.decr) {
        stepQty(Number(target.dataset.decr), -1);
      }
    });

    container.addEventListener("change", function (e) {
      var target = e.target;
      if (target.dataset.qty) {
        var val = Math.max(1, parseInt(target.value, 10) || 1);
        updateQty(Number(target.dataset.qty), val);
        renderCartPage();
        updateSummary();
      }
    });

    function stepQty(id, delta) {
      var cart = getCart();
      var item = cart.find(function (i) { return i.id === id; });
      if (!item) return;
      updateQty(id, item.qty + delta);
      renderCartPage();
      updateSummary();
    }

    updateSummary();
  }

  function updateSummary() {
    var summary = document.querySelector("[data-cart-summary]");
    if (!summary) return;
    var details = getCartDetails();
    if (details.length === 0) {
      summary.style.display = "none";
      return;
    }
    summary.style.display = "block";
    var itemsCount = details.reduce(function (s, d) { return s + d.qty; }, 0);
    var total = details.reduce(function (s, d) { return s + d.product.price * d.qty; }, 0);
    var itemsEl = summary.querySelector("[data-summary-items]");
    var totalEl = summary.querySelector("[data-summary-total]");
    if (itemsEl) itemsEl.textContent = itemsCount;
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  function rel(path) {
    // image/url paths stored root-relative ("img/x.svg", "product/x/"); adjust for current depth.
    var depth = (document.body.getAttribute("data-depth") || "0");
    var prefix = depth === "2" ? "../../" : depth === "1" ? "../" : "";
    return prefix + path;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function bindAddToCartButtons() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add-to-cart]");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-add-to-cart"));
      var qtyInput = document.querySelector("[data-product-qty]");
      var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      addToCart(id, qty);
      var original = btn.textContent;
      btn.textContent = "Додано ✓";
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
      }, 1200);
    });

    var qtyWrap = document.querySelector("[data-product-qty-wrap]");
    if (qtyWrap) {
      qtyWrap.addEventListener("click", function (e) {
        var input = qtyWrap.querySelector("[data-product-qty]");
        if (e.target.matches("[data-qty-incr]")) {
          input.value = Math.max(1, (parseInt(input.value, 10) || 1) + 1);
        } else if (e.target.matches("[data-qty-decr]")) {
          input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    renderCartPage();
    bindAddToCartButtons();

    var checkoutForm = document.querySelector("[data-checkout-form]");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var details = getCartDetails();
        var itemsText = details.map(function (d) {
          return d.product.name + " x" + d.qty;
        }).join("; ");
        var total = details.reduce(function (sum, d) { return sum + d.product.price * d.qty; }, 0);
        if (window.FelicityLeads) {
          window.FelicityLeads.send({
            form: "checkout",
            name: document.getElementById("ck-name").value,
            phone: document.getElementById("ck-phone").value,
            address: document.getElementById("ck-address").value,
            items: itemsText,
            total: total,
          });
        }
        localStorage.removeItem(CART_KEY);
        updateCartCount();
        var root = document.querySelector("[data-cart-root]");
        var summary = document.querySelector("[data-cart-summary]");
        checkoutForm.style.display = "none";
        if (summary) summary.style.display = "none";
        if (root) {
          root.innerHTML =
            '<div class="empty-state">' +
            "<h2>Дякуємо за замовлення!</h2>" +
            "<p>Наш менеджер зв'яжеться з вами найближчим часом для підтвердження замовлення.</p>" +
            '<a class="btn btn-primary" href="/index.html">На головну</a>' +
            "</div>";
        }
      });
    }
  });

  window.FelicityCart = {
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQty: updateQty,
    getCartCount: getCartCount,
    formatPrice: formatPrice
  };
})();
