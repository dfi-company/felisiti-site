/* Felicity - progressive-enhancement filters/sort for category pages.
   Product cards are already server-rendered in the HTML for SEO; this script
   only shows/hides/reorders existing DOM nodes, it does not generate content. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.querySelector("[data-product-grid]");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-product-card]"));
    var minInput = document.querySelector("[data-price-min]");
    var maxInput = document.querySelector("[data-price-max]");
    var inStockOnly = document.querySelector("[data-instock-only]");
    var sortSelect = document.querySelector("[data-sort]");
    var resultCount = document.querySelector("[data-result-count]");
    var emptyState = document.querySelector("[data-empty-state]");

    function apply() {
      var min = minInput && minInput.value ? Number(minInput.value) : 0;
      var max = maxInput && maxInput.value ? Number(maxInput.value) : Infinity;
      var onlyInStock = inStockOnly ? inStockOnly.checked : false;

      var visible = cards.filter(function (card) {
        var price = Number(card.getAttribute("data-price"));
        var stock = card.getAttribute("data-instock") === "true";
        if (price < min || price > max) return false;
        if (onlyInStock && !stock) return false;
        return true;
      });

      if (sortSelect) {
        var mode = sortSelect.value;
        visible.sort(function (a, b) {
          var pa = Number(a.getAttribute("data-price"));
          var pb = Number(b.getAttribute("data-price"));
          if (mode === "price-asc") return pa - pb;
          if (mode === "price-desc") return pb - pa;
          return 0;
        });
      }

      cards.forEach(function (card) { card.style.display = "none"; });
      visible.forEach(function (card) {
        card.style.display = "";
        grid.appendChild(card);
      });

      if (resultCount) resultCount.textContent = visible.length;
      if (emptyState) emptyState.style.display = visible.length === 0 ? "block" : "none";
    }

    [minInput, maxInput, sortSelect].forEach(function (el) {
      if (el) el.addEventListener("input", apply);
    });
    if (inStockOnly) inStockOnly.addEventListener("change", apply);

    apply();
  });
})();
