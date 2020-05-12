// Getting around quickly: Ctrl/Cmd+K quick jump, sidebar filter, focus mode,
// recently viewed pages and a sidebar that keeps its scroll position.
(function () {
  "use strict";

  var body = document.body;
  var root = body.dataset.root || "";
  var rootUrl = new URL(root || "./", location.href);
  var store = null;
  try { store = window.localStorage; } catch (e) {}

  function get(key, fallback) {
    try { var v = JSON.parse(store.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function set(key, value) {
    try { store.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function typing(e) {
    var t = e.target;
    return e.metaKey || e.ctrlKey || e.altKey ||
      (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  var pageId = decodeURIComponent(location.pathname.slice(rootUrl.pathname.length)) || "index.html";

  // ------------------------------------------------------------ recently viewed

  var RECENT = "cnuw:v1:recent";
  var kind = body.dataset.kind;
  if (store && (kind === "chapter" || kind === "original")) {
    var recent = get(RECENT, []).filter(function (r) { return r.h !== pageId; });
    recent.unshift({ h: pageId, t: body.dataset.pageTitle, c: body.dataset.courseCode, k: kind });
    set(RECENT, recent.slice(0, 12));
  }

  var recentBox = document.getElementById("recent-pages");
  if (recentBox && store) {
    var items = get(RECENT, []).slice(0, 6);
    if (items.length) {
      recentBox.appendChild(el("h2", "subject", "Recently viewed"));
      var list = el("div", "recent-list");
      items.forEach(function (r) {
        var a = el("a", "recent-item");
        a.href = new URL(r.h, rootUrl).href;
        a.appendChild(el("span", "recent-course", r.c || ""));
        a.appendChild(el("span", "recent-title", r.t || r.h));
        list.appendChild(a);
      });
      recentBox.appendChild(list);
    }
  }

  // ------------------------------------------------------------ sidebar

  var sidebar = document.getElementById("sidebar");
  var course = body.dataset.course;
  if (sidebar && course) {
    // Keep the sidebar where it was when moving between pages of a course.
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem("cnuw:sidebar")); } catch (e) {}
    var active = sidebar.querySelector(".sidebar-link.active");
    if (saved && saved.course === course) {
      sidebar.scrollTop = saved.top;
      if (active) {  // still make sure the current page is visible
        var r = active.getBoundingClientRect(), sr = sidebar.getBoundingClientRect();
        if (r.top < sr.top || r.bottom > sr.bottom) sidebar.scrollTop = active.offsetTop - sidebar.clientHeight / 2;
      }
    }
    window.addEventListener("pagehide", function () {
      try { sessionStorage.setItem("cnuw:sidebar", JSON.stringify({ course: course, top: sidebar.scrollTop })); } catch (e) {}
    });
  }

  document.querySelectorAll(".sidebar-filter").forEach(function (input) {
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var links = sidebar.querySelectorAll(".sidebar-link");
      links.forEach(function (a) {
        if (a.textContent.trim() === "Overview") return;
        a.hidden = q && a.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var first = sidebar.querySelector(".sidebar-link:not([hidden]):not(.active)");
        if (first) location.href = first.href;
      } else if (e.key === "Escape") {
        input.value = "";
        input.dispatchEvent(new Event("input"));
        input.blur();
      }
    });
  });

  // ------------------------------------------------------------ focus mode

  function setFocus(on) {
    body.classList.toggle("focus-mode", on);
    set("cnuw:v1:focus", on);
  }
  if (get("cnuw:v1:focus", false)) body.classList.add("focus-mode");
  var focusBtn = document.getElementById("focus-toggle");
  if (focusBtn) focusBtn.addEventListener("click", function () { setFocus(!body.classList.contains("focus-mode")); });

  // ------------------------------------------------------------ prefetch fallback

  // Browsers without speculation rules: prefetch a page when its link is hovered.
  if (!(HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules"))) {
    var done = {};
    document.addEventListener("pointerover", function (e) {
      var a = e.target.closest && e.target.closest("a[href$='.html']");
      if (!a || a.origin !== location.origin || done[a.href]) return;
      done[a.href] = true;
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.href = a.href;
      document.head.appendChild(link);
    }, { passive: true });
  }

  // ------------------------------------------------------------ quick jump

  var entries = null;
  function loadEntries() {
    if (entries) return Promise.resolve(entries);
    return fetch(new URL("assets/nav.json", rootUrl)).then(function (r) { return r.json(); })
      .then(function (data) { entries = data; return data; }, function () { entries = []; return entries; });
  }

  var overlay = el("div", "jump-overlay");
  var dialog = el("div", "jump-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-label", "Jump to");
  var input = el("input", "jump-input");
  input.type = "text";
  input.placeholder = "Jump to a course, chapter or lecture…";
  input.setAttribute("aria-label", "Jump to");
  var results = el("div", "jump-results");
  results.setAttribute("role", "listbox");
  var hint = el("div", "jump-hint");
  hint.innerHTML = "<span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span>" +
                   "<span><kbd>Esc</kbd> close</span>";
  dialog.appendChild(input);
  dialog.appendChild(results);
  dialog.appendChild(hint);
  overlay.appendChild(dialog);
  body.appendChild(overlay);

  var current = [], selected = 0;

  function actions() {
    var list = [
      { t: "Toggle dark mode", k: "action", run: function () { var b = document.getElementById("theme-toggle"); if (b) b.click(); } },
      { t: "Open notes", k: "action", run: function () { var b = document.getElementById("notes-toggle"); if (b) b.click(); } },
      { t: "Toggle focus mode", k: "action", run: function () { setFocus(!body.classList.contains("focus-mode")); } },
    ];
    var other = document.querySelector(".view-toggle a:not(.active)");
    if (other) list.push({ t: "Switch to " + other.textContent, k: "action", h: other.href });
    return list;
  }

  // Every word of the query must appear; earlier, word-start and in-order matches rank higher.
  function score(entry, words) {
    var text = (entry.t + " " + (entry.c || "") + " " + (entry.l || "")).toLowerCase();
    var total = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i], at = text.indexOf(w);
      if (at === -1) {
        var compact = text.replace(/\s+/g, "");  // "cs246" matches "CS 246"
        at = compact.indexOf(w);
        if (at === -1) return -1;
        total += 5;
        continue;
      }
      total += at === 0 || /[\s(—·:-]/.test(text[at - 1]) ? 20 : 8;
      total -= at / 50;
    }
    if (entry.k === "course") total += 4;
    if (entry.c && body.dataset.courseCode === entry.c) total += 3;
    return total;
  }

  function render(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) {
      var rec = get(RECENT, []).filter(function (r) { return r.h !== pageId; }).slice(0, 8)
        .map(function (r) { return { t: r.t, c: r.c, h: r.h, k: "recent" }; });
      current = rec.concat(actions());
    } else {
      var scored = (entries || []).concat(actions()).map(function (e) { return { e: e, s: score(e, words) }; })
        .filter(function (x) { return x.s >= 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 40)
        .map(function (x) { return x.e; });
      current = scored.concat([{ t: "Search all notes for “" + q + "”", k: "search", q: q }]);
    }
    selected = 0;
    results.innerHTML = "";
    var lastGroup = null;
    current.forEach(function (entry, i) {
      var group = !words.length ? (entry.k === "recent" ? "Recently viewed" : "Actions") : null;
      if (group && group !== lastGroup) { results.appendChild(el("div", "jump-group", group)); lastGroup = group; }
      var row = el("div", "jump-item");
      row.setAttribute("role", "option");
      row.dataset.index = i;
      var tag = entry.k === "chapter" ? (entry.l || "") : entry.k === "original" ? "Original"
              : entry.k === "course" ? "Course" : entry.k === "search" ? "Search" : entry.k === "action" ? "Action" : "";
      row.appendChild(el("span", "jump-tag", tag || entry.c || ""));
      row.appendChild(el("span", "jump-title", entry.t));
      if (entry.c && entry.k !== "course") row.appendChild(el("span", "jump-course", entry.c));
      row.addEventListener("mousemove", function () { highlight(i); });
      row.addEventListener("click", function () { choose(i); });
      results.appendChild(row);
    });
    highlight(0);
  }

  function highlight(i) {
    selected = Math.max(0, Math.min(i, current.length - 1));
    results.querySelectorAll(".jump-item").forEach(function (row) {
      var on = +row.dataset.index === selected;
      row.classList.toggle("active", on);
      if (on) row.scrollIntoView({ block: "nearest" });
    });
  }

  function choose(i) {
    var entry = current[i];
    if (!entry) return;
    closeJump();
    if (entry.run) { entry.run(); return; }
    if (entry.k === "search") {
      var box = document.querySelector(".pagefind-ui__search-input");
      body.classList.add("show-search");  // the search box is hidden on small screens
      if (box) {
        box.value = entry.q;
        box.dispatchEvent(new Event("input", { bubbles: true }));
        box.focus();
      }
      return;
    }
    location.href = /^https?:/.test(entry.h) ? entry.h : new URL(entry.h, rootUrl).href;
  }

  function openJump() {
    overlay.classList.add("open");
    input.value = "";
    loadEntries().then(function () { render(input.value); });
    render("");
    input.focus();
  }
  function closeJump() { overlay.classList.remove("open"); }

  input.addEventListener("input", function () { render(input.value); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); highlight(selected + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); highlight(selected - 1); }
    else if (e.key === "Enter") { e.preventDefault(); choose(selected); }
    else if (e.key === "Escape") { e.preventDefault(); closeJump(); }
  });
  overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) closeJump(); });
  var jumpBtn = document.getElementById("jump-open");
  if (jumpBtn) jumpBtn.addEventListener("click", openJump);
  var kbd = document.querySelector(".jump-kbd");
  if (kbd && /Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = "⌘K";

  document.addEventListener("mousedown", function (e) {
    var search = document.getElementById("search");
    if (body.classList.contains("show-search") && search && !search.contains(e.target)) body.classList.remove("show-search");
  });

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      overlay.classList.contains("open") ? closeJump() : openJump();
      return;
    }
    if (typing(e)) return;
    if (e.key === "f") { e.preventDefault(); setFocus(!body.classList.contains("focus-mode")); }
  });
})();
