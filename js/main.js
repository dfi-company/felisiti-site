/* Felicity — header interactions: burger menu, mobile search, search suggestions. */
(function () {
  "use strict";

  function relPath(path) {
    var depth = document.body.getAttribute("data-depth") || "0";
    var prefix = depth === "2" ? "../../" : depth === "1" ? "../" : "";
    return prefix + path;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var burger = document.querySelector("[data-burger]");
    var nav = document.querySelector("[data-main-nav]");

    if (burger && nav) {
      burger.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("open");
        burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    // Search suggestions (desktop + mobile inputs)
    var searchInputs = document.querySelectorAll("[data-search-input]");
    var products = window.FELICITY_PRODUCTS || [];

    searchInputs.forEach(function (input) {
      var wrap = input.closest("[data-search-wrap]");
      var results = wrap ? wrap.querySelector("[data-search-results]") : null;
      if (!results) return;

      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        if (q.length < 2) {
          results.classList.remove("open");
          results.innerHTML = "";
          return;
        }
        var matches = products
          .filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; })
          .slice(0, 6);

        if (matches.length === 0) {
          results.innerHTML = '<div style="padding:12px 14px; font-size:0.9rem; color:var(--color-text-muted);">Нічого не знайдено</div>';
          results.classList.add("open");
          return;
        }

        results.innerHTML = matches.map(function (p) {
          return (
            '<a href="' + relPath(p.url) + '">' +
            "<span>" + p.name + "</span>" +
            '<span class="sugg-price">' + p.price.toLocaleString("uk-UA") + " ₴</span>" +
            "</a>"
          );
        }).join("");
        results.classList.add("open");
      });

      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) {
          results.classList.remove("open");
        }
      });

      var form = input.closest("form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var q = input.value.trim().toLowerCase();
          var match = products.find(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; });
          if (match) window.location.href = relPath(match.url);
        });
      }
    });
  });
})();
