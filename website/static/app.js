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
          macros: Object.assign({}, window.KATEX_MACROS || {}),
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
  // Copy button on code blocks.
  document.querySelectorAll("main.content pre, main.content .code-block").forEach(function (pre) {
    var box = pre.closest("div.sourceCode") || pre;
    if (box.querySelector(".copy-btn")) return;
    var btn = document.createElement("button");
    btn.className = "copy-btn hl-ignore";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var text = pre.innerText.replace(/\n$/, "");
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      });
    });
    box.classList.add("has-copy");
    box.appendChild(btn);
  });

  // Reading progress bar under the navbar.
  var progress = document.getElementById("progress");
  if (progress && document.body.dataset.kind !== "page") {
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  // Keyboard: [ and ] for previous / next page, / for search.
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.metaKey || e.ctrlKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    if (e.key === "[" || e.key === "]") {
      var link = document.querySelector(e.key === "[" ? ".pager-link.prev" : ".pager-link.next");
      if (link) location.href = link.href;
    } else if (e.key === "/") {
      var input = document.querySelector(".pagefind-ui__search-input");
      if (input) { e.preventDefault(); input.focus(); }
    }
  });

  // Remember the last page read in each course and offer to continue there.
  var store = null;
  try { store = window.localStorage; } catch (e) {}
  var course = document.body.dataset.course;
  var kind = document.body.dataset.kind;
  if (store && course && kind === "chapter") {
    try {
      store.setItem("cnuw:v1:last:" + course, JSON.stringify({
        href: location.pathname + location.search, title: document.body.dataset.pageTitle,
      }));
    } catch (e) {}
  }
  function lastRead(slug) {
    try { return JSON.parse(store.getItem("cnuw:v1:last:" + slug)); } catch (e) { return null; }
  }
  var cont = document.getElementById("continue-reading");
  if (store && cont && course) {
    var last = lastRead(course);
    if (last && last.href) {
      cont.innerHTML = '<a class="continue-card" href=""><small>Continue where you left off</small><span></span></a>';
      cont.querySelector("a").href = last.href;
      cont.querySelector("span").textContent = last.title || "Last page";
    }
  }
  if (store) {
    document.querySelectorAll(".card[data-course]").forEach(function (card) {
      var last = lastRead(card.dataset.course);
      if (!last || !last.href) return;
      var link = document.createElement("a");
      link.className = "card-continue";
      link.href = last.href;
      link.textContent = "Continue: " + (last.title || "last page");
      link.addEventListener("click", function (e) { e.stopPropagation(); });
      card.appendChild(link);
    });
  }
})();
