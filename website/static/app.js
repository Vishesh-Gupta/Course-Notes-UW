(function () {
  var root = document.documentElement;

  // Theme toggle (remembered per browser).
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    });
  }

  // Course dropdown.
  document.querySelectorAll(".dropdown").forEach(function (dd) {
    dd.querySelector(".dropdown-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      dd.classList.toggle("open");
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".dropdown.open").forEach(function (dd) { dd.classList.remove("open"); });
  });

  // Mobile sidebar.
  var navToggle = document.getElementById("nav-toggle");
  if (navToggle) {
    if (!document.getElementById("sidebar")) navToggle.style.visibility = "hidden";
    navToggle.addEventListener("click", function () { document.body.classList.toggle("sidebar-open"); });
  }

  // Keep the active chapter visible in the sidebar.
  var active = document.querySelector(".sidebar-link.active");
  var sidebar = document.getElementById("sidebar");
  if (active && sidebar) sidebar.scrollTop = active.offsetTop - sidebar.clientHeight / 2;

  // Math: pandoc --katex leaves the TeX source in span.math elements.
  if (window.katex) {
    document.querySelectorAll(".math").forEach(function (el) {
      try {
        katex.render(el.textContent, el, {
          displayMode: el.classList.contains("display"),
          throwOnError: false,
        });
      } catch (e) {}
    });
  }

  // Search.
  if (window.PagefindUI && document.getElementById("search")) {
    new PagefindUI({ element: "#search", showSubResults: true, showImages: false });
  }

  // Highlight the current section in "On this page".
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length && "IntersectionObserver" in window) {
    var byId = {};
    links.forEach(function (a) { byId[decodeURIComponent(a.hash.slice(1))] = a; });
    var headings = links
      .map(function (a) { return document.getElementById(decodeURIComponent(a.hash.slice(1))); })
      .filter(Boolean);
    var visible = new Set();
    var setActive = function () {
      var current = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top < 120) current = headings[i];
      }
      if (!current && headings.length) current = headings[0];
      links.forEach(function (a) { a.classList.remove("active"); });
      if (current && byId[current.id]) byId[current.id].classList.add("active");
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      setActive();
    });
    headings.forEach(function (h) { obs.observe(h); });
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }
})();
