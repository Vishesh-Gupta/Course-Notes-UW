// Personal notes and highlights, saved in this browser (localStorage).
//
// Each page stores { title, course, note, highlights: [...], updated } under
// "cnuw:v1:page:<page id>", where the page id is the page's path relative to
// the site root (e.g. "cs-246/10-lecture10.html"). Highlights are anchored by
// their text plus a little context before and after, so they survive rebuilds
// of the site as long as the passage itself is unchanged.
(function () {
  "use strict";

  var PREFIX = "cnuw:v1:page:";
  var COLORS = ["yellow", "green", "blue", "pink"];
  var CONTEXT = 32;

  var body = document.body;
  var content = document.querySelector("main.content");
  var rootUrl = new URL(body.dataset.root || "./", location.href);
  var pageId = decodeURIComponent(location.pathname.slice(rootUrl.pathname.length)) || "index.html";
  if (/\/$/.test(pageId) || pageId === "") pageId += "index.html";
  var annotatable = body.dataset.kind === "chapter";

  // ---------------------------------------------------------------- storage

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function load(id) {
    var s = storage();
    if (!s) return null;
    try { return JSON.parse(s.getItem(PREFIX + id)); } catch (e) { return null; }
  }

  function save(id, data) {
    var s = storage();
    if (!s) return;
    try {
      if (!data.note && (!data.highlights || !data.highlights.length)) s.removeItem(PREFIX + id);
      else s.setItem(PREFIX + id, JSON.stringify(data));
    } catch (e) {}
  }

  function allPages() {
    var s = storage(), out = [];
    if (!s) return out;
    for (var i = 0; i < s.length; i++) {
      var k = s.key(i);
      if (k && k.indexOf(PREFIX) === 0) {
        try { out.push({ id: k.slice(PREFIX.length), data: JSON.parse(s.getItem(k)) }); } catch (e) {}
      }
    }
    out.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    return out;
  }

  var state = load(pageId) || { note: "", highlights: [] };
  state.highlights = state.highlights || [];

  function persist() {
    state.title = body.dataset.pageTitle || document.title;
    state.course = body.dataset.courseCode || "";
    state.updated = new Date().toISOString();
    save(pageId, state);
    updateCount();
    markSidebar();
  }

  // ---------------------------------------------------------------- text index

  // Text nodes of the page content, skipping KaTeX's hidden MathML copy.
  function textIndex() {
    var nodes = [], text = "";
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || p.closest(".katex-mathml, script, style, .pager, .hl-ignore")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var n;
    while ((n = walker.nextNode())) {
      nodes.push({ node: n, start: text.length });
      text += n.nodeValue;
    }
    return { nodes: nodes, text: text };
  }

  function offsetOf(index, container, offset) {
    if (container.nodeType !== Node.TEXT_NODE) {
      // A point between elements: it maps to the start of the first text node after it.
      var point = document.createRange();
      point.setStart(container, offset);
      point.collapse(true);
      for (var i = 0; i < index.nodes.length; i++) {
        if (point.comparePoint(index.nodes[i].node, 0) >= 0) return index.nodes[i].start;
      }
      return index.text.length;
    }
    for (var j = 0; j < index.nodes.length; j++) {
      if (index.nodes[j].node === container) return index.nodes[j].start + offset;
    }
    return -1;
  }

  function similarity(a, b, fromEnd) {
    var n = 0, len = Math.min(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var x = fromEnd ? a[a.length - 1 - i] : a[i];
      var y = fromEnd ? b[b.length - 1 - i] : b[i];
      if (x !== y) break;
      n++;
    }
    return n;
  }

  function locate(index, hl) {
    var best = -1, bestScore = -1, from = 0, at;
    while ((at = index.text.indexOf(hl.exact, from)) !== -1) {
      var score = similarity(index.text.slice(Math.max(0, at - CONTEXT), at), hl.prefix || "", true) +
                  similarity(index.text.slice(at + hl.exact.length, at + hl.exact.length + CONTEXT), hl.suffix || "", false);
      if (score > bestScore) { best = at; bestScore = score; }
      from = at + 1;
    }
    return best;
  }

  function wrap(index, start, end, hl) {
    var marks = [];
    index.nodes.forEach(function (entry) {
      var node = entry.node, s = entry.start, e = s + node.nodeValue.length;
      if (e <= start || s >= end) return;
      var a = Math.max(start, s) - s, b = Math.min(end, e) - s;
      if (!node.nodeValue.slice(a, b).trim()) return;
      var target = node;
      if (a > 0) target = target.splitText(a);
      if (b - a < target.nodeValue.length) target.splitText(b - a);
      var mark = document.createElement("mark");
      mark.className = "hl hl-" + hl.color;
      mark.dataset.hl = hl.id;
      if (hl.comment) mark.classList.add("has-comment");
      target.parentNode.insertBefore(mark, target);
      mark.appendChild(target);
      marks.push(mark);
    });
    return marks;
  }

  function unwrap(id) {
    content.querySelectorAll('mark.hl[data-hl="' + id + '"]').forEach(function (m) {
      var parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
  }

  var orphans = [];
  function applyAll() {
    orphans = [];
    state.highlights.forEach(function (hl) {
      var index = textIndex();
      var at = locate(index, hl);
      if (at < 0) { orphans.push(hl.id); return; }
      wrap(index, at, at + hl.exact.length, hl);
    });
  }

  // ---------------------------------------------------------------- UI helpers

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function findHl(id) {
    return state.highlights.filter(function (h) { return h.id === id; })[0];
  }

  function excerpt(text, n) {
    text = text.replace(/\s+/g, " ").trim();
    return text.length > n ? text.slice(0, n - 1) + "…" : text;
  }

  function download(name, type, text) {
    var a = el("a", { href: URL.createObjectURL(new Blob([text], { type: type })), download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  // ---------------------------------------------------------------- selection toolbar

  var toolbar = el("div", { class: "hl-toolbar hl-ignore", role: "toolbar", "aria-label": "Highlight" });
  COLORS.forEach(function (c) {
    toolbar.appendChild(el("button", {
      class: "swatch swatch-" + c, "aria-label": "Highlight " + c, title: "Highlight",
      onmousedown: function (e) { e.preventDefault(); createFromSelection(c, false); },
    }));
  });
  toolbar.appendChild(el("button", {
    class: "hl-note-btn", text: "Add note",
    onmousedown: function (e) { e.preventDefault(); createFromSelection("yellow", true); },
  }));

  function hideToolbar() { toolbar.classList.remove("open"); }

  function selectionInContent() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    var range = sel.getRangeAt(0);
    if (!content.contains(range.commonAncestorContainer)) return null;
    var anc = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer
                                                           : range.commonAncestorContainer.parentElement;
    if (anc && anc.closest(".hl-ignore, .pager, input, textarea")) return null;
    if (!range.toString().trim()) return null;
    return range;
  }

  function showToolbarSoon() {
    setTimeout(function () {
      var range = selectionInContent();
      if (!range) { hideToolbar(); return; }
      var rect = range.getBoundingClientRect();
      toolbar.classList.add("open");
      var w = toolbar.offsetWidth, h = toolbar.offsetHeight;
      var left = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2), window.innerWidth - w - 8);
      var top = rect.top - h - 10;
      if (top < 70) top = rect.bottom + 10;
      toolbar.style.left = left + "px";
      toolbar.style.top = top + "px";
    }, 10);
  }

  function createFromSelection(color, withNote) {
    var range = selectionInContent();
    hideToolbar();
    if (!range) return;
    var index = textIndex();
    var start = offsetOf(index, range.startContainer, range.startOffset);
    var end = offsetOf(index, range.endContainer, range.endOffset);
    if (start < 0 || end <= start) return;
    var exact = index.text.slice(start, end);
    var lead = exact.length - exact.replace(/^\s+/, "").length;
    var trail = exact.length - exact.replace(/\s+$/, "").length;
    start += lead; end -= trail;
    exact = index.text.slice(start, end);
    if (!exact) return;
    var hl = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      exact: exact,
      prefix: index.text.slice(Math.max(0, start - CONTEXT), start),
      suffix: index.text.slice(end, end + CONTEXT),
      color: color, comment: "", created: new Date().toISOString(),
    };
    state.highlights.push(hl);
    var marks = wrap(index, start, end, hl);
    window.getSelection().removeAllRanges();
    persist();
    renderPanel();
    if (withNote && marks.length) openPopover(hl.id, marks[0], true);
  }

  // ---------------------------------------------------------------- highlight popover

  var popover = el("div", { class: "hl-popover hl-ignore", role: "dialog", "aria-label": "Highlight note" });
  var popTextarea = el("textarea", { placeholder: "Add a note to this highlight…", rows: "3" });
  var popColors = el("div", { class: "hl-pop-colors" });
  var popId = null;
  COLORS.forEach(function (c) {
    popColors.appendChild(el("button", {
      class: "swatch swatch-" + c, "aria-label": c,
      onclick: function () {
        var hl = findHl(popId);
        if (!hl) return;
        hl.color = c;
        content.querySelectorAll('mark.hl[data-hl="' + popId + '"]').forEach(function (m) {
          COLORS.forEach(function (x) { m.classList.remove("hl-" + x); });
          m.classList.add("hl-" + c);
        });
        persist(); renderPanel();
      },
    }));
  });
  popover.appendChild(popColors);
  popover.appendChild(popTextarea);
  popover.appendChild(el("div", { class: "hl-pop-actions" }, [
    el("button", { class: "link-btn danger", text: "Delete highlight", onclick: function () { removeHl(popId); closePopover(); } }),
    el("button", { class: "small-btn", text: "Done", onclick: function () { closePopover(); } }),
  ]));
  popTextarea.addEventListener("input", debounce(function () {
    var hl = findHl(popId);
    if (!hl) return;
    hl.comment = popTextarea.value;
    content.querySelectorAll('mark.hl[data-hl="' + popId + '"]').forEach(function (m) {
      m.classList.toggle("has-comment", !!hl.comment);
    });
    persist(); renderPanel();
  }, 300));

  function openPopover(id, anchor, focus) {
    var hl = findHl(id);
    if (!hl) return;
    popId = id;
    popTextarea.value = hl.comment || "";
    popover.classList.add("open");
    var rect = anchor.getBoundingClientRect();
    var w = popover.offsetWidth;
    popover.style.left = Math.min(Math.max(8, rect.left), window.innerWidth - w - 8) + "px";
    popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - popover.offsetHeight - 8) + "px";
    if (focus) popTextarea.focus();
  }

  function closePopover() { popover.classList.remove("open"); popId = null; }

  function removeHl(id) {
    unwrap(id);
    state.highlights = state.highlights.filter(function (h) { return h.id !== id; });
    persist(); renderPanel();
  }

  // ---------------------------------------------------------------- notes panel

  var panel = el("aside", { class: "notes-panel hl-ignore", id: "notes-panel", "aria-label": "Notes" });
  var tabPage = el("button", { class: "notes-tab active", text: "This page" });
  var tabAll = el("button", { class: "notes-tab", text: "All notes" });
  var pageView = el("div", { class: "notes-view" });
  var allView = el("div", { class: "notes-view", hidden: "" });
  var noteArea = el("textarea", { class: "notes-textarea", placeholder: "Write your notes for this page… (saved automatically)" });
  var savedHint = el("span", { class: "notes-saved" });
  var hlList = el("div", { class: "hl-list" });
  var fileInput = el("input", { type: "file", accept: "application/json,.json", hidden: "" });

  panel.appendChild(el("div", { class: "notes-head" }, [
    el("div", { class: "notes-tabs" }, [tabPage, tabAll]),
    el("button", { class: "icon-btn", "aria-label": "Close notes", html: "&times;", onclick: function () { togglePanel(false); } }),
  ]));
  pageView.appendChild(el("div", { class: "notes-page-title", text: body.dataset.pageTitle || document.title }));
  if (annotatable) {
    pageView.appendChild(el("p", { class: "notes-tip", text: "Select any text on the page to highlight it or attach a note." }));
  }
  pageView.appendChild(noteArea);
  pageView.appendChild(savedHint);
  if (annotatable) {
    pageView.appendChild(el("div", { class: "notes-section-title", text: "Highlights" }));
    pageView.appendChild(hlList);
  }
  pageView.appendChild(el("div", { class: "notes-actions" }, [
    el("button", { class: "small-btn", text: "Copy as Markdown", onclick: function (e) {
      var btn = e.currentTarget;
      var text = pageMarkdown(pageId, state);
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy as Markdown"; }, 1500);
      }, function () { download("notes.md", "text/markdown", text); });
    } }),
    el("button", { class: "link-btn danger", text: "Clear this page", onclick: function () {
      if (!confirm("Delete your notes and highlights on this page?")) return;
      state.highlights.forEach(function (h) { unwrap(h.id); });
      state = { note: "", highlights: [] };
      noteArea.value = "";
      persist(); renderPanel();
    } }),
  ]));
  allView.appendChild(el("div", { class: "notes-actions top" }, [
    el("button", { class: "small-btn", text: "Export Markdown", onclick: function () {
      download("course-notes.md", "text/markdown", allPages().map(function (p) { return pageMarkdown(p.id, p.data); }).join("\n\n"));
    } }),
    el("button", { class: "small-btn", text: "Backup (JSON)", onclick: function () {
      var data = {};
      allPages().forEach(function (p) { data[p.id] = p.data; });
      download("course-notes-backup.json", "application/json", JSON.stringify({ version: 1, pages: data }, null, 2));
    } }),
    el("button", { class: "small-btn", text: "Restore", onclick: function () { fileInput.click(); } }),
  ]));
  var allList = el("div", { class: "all-list" });
  allView.appendChild(allList);
  allView.appendChild(fileInput);
  panel.appendChild(pageView);
  panel.appendChild(allView);
  panel.appendChild(el("div", { class: "notes-foot", html:
    "Saved in this browser only &middot; use Backup / Restore to move notes between devices.<br>" +
    "<kbd>n</kbd> notes &middot; <kbd>[</kbd> <kbd>]</kbd> previous / next &middot; <kbd>/</kbd> search" }));

  noteArea.value = state.note || "";
  noteArea.addEventListener("input", debounce(function () {
    state.note = noteArea.value;
    persist();
    savedHint.textContent = "Saved";
    setTimeout(function () { savedHint.textContent = ""; }, 1200);
  }, 400));

  tabPage.addEventListener("click", function () { showTab(false); });
  tabAll.addEventListener("click", function () { showTab(true); });
  function showTab(all) {
    tabPage.classList.toggle("active", !all);
    tabAll.classList.toggle("active", all);
    pageView.hidden = all;
    allView.hidden = !all;
    if (all) renderAll();
  }

  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var data = JSON.parse(text);
      var pages = (data && data.pages) || {};
      var n = 0;
      Object.keys(pages).forEach(function (id) {
        var incoming = pages[id], existing = load(id);
        if (existing) {  // merge: keep both notes, union of highlights
          var ids = {};
          (existing.highlights || []).forEach(function (h) { ids[h.id] = true; });
          (incoming.highlights || []).forEach(function (h) { if (!ids[h.id]) existing.highlights.push(h); });
          if (incoming.note && incoming.note !== existing.note) {
            existing.note = existing.note ? existing.note + "\n\n" + incoming.note : incoming.note;
          }
          incoming = existing;
        }
        save(id, incoming); n++;
      });
      alert("Restored notes for " + n + " page(s).");
      location.reload();
    }).catch(function () { alert("That file is not a notes backup."); });
    fileInput.value = "";
  });

  function renderPanel() {
    hlList.innerHTML = "";
    if (!state.highlights.length) {
      hlList.appendChild(el("p", { class: "muted small", text: "No highlights yet." }));
    }
    state.highlights.forEach(function (hl) {
      var orphan = orphans.indexOf(hl.id) !== -1;
      var item = el("div", { class: "hl-item hl-item-" + hl.color + (orphan ? " orphan" : "") }, [
        el("blockquote", { text: excerpt(hl.exact, 180) }),
        hl.comment ? el("p", { class: "hl-comment", text: hl.comment }) : null,
        orphan ? el("p", { class: "muted small", text: "This passage changed; the highlight could not be placed." }) : null,
      ]);
      item.addEventListener("click", function () {
        var mark = content.querySelector('mark.hl[data-hl="' + hl.id + '"]');
        if (!mark) { if (orphan && confirm("Delete this highlight?")) removeHl(hl.id); return; }
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        flash(hl.id);
        if (window.innerWidth < 900) togglePanel(false);
        setTimeout(function () { openPopover(hl.id, mark, false); }, 350);
      });
      hlList.appendChild(item);
    });
  }

  function renderAll() {
    allList.innerHTML = "";
    var pages = allPages();
    if (!pages.length) {
      allList.appendChild(el("p", { class: "muted small", text: "No notes yet. Notes and highlights you add on any page appear here." }));
      return;
    }
    var course = null;
    pages.forEach(function (p) {
      var d = p.data || {};
      if ((d.course || "") !== course) {
        course = d.course || "";
        allList.appendChild(el("div", { class: "notes-section-title", text: course || "Other pages" }));
      }
      var count = (d.highlights || []).length;
      var meta = [count ? count + " highlight" + (count === 1 ? "" : "s") : null, d.note ? "note" : null]
        .filter(Boolean).join(" · ");
      allList.appendChild(el("a", { class: "all-item", href: new URL(p.id, rootUrl).href }, [
        el("span", { class: "all-title", text: d.title || p.id }),
        el("span", { class: "muted small", text: meta }),
        d.note ? el("span", { class: "all-note", text: excerpt(d.note, 120) }) : null,
      ]));
    });
  }

  function pageMarkdown(id, d) {
    d = d || {};
    var out = ["## " + (d.title || id), "", "<" + new URL(id, rootUrl).href + ">", ""];
    if (d.note) out.push(d.note.trim(), "");
    (d.highlights || []).forEach(function (h) {
      out.push("> " + h.exact.replace(/\s+/g, " ").trim());
      if (h.comment) out.push("", h.comment.trim());
      out.push("");
    });
    return out.join("\n");
  }

  function flash(id) {
    content.querySelectorAll('mark.hl[data-hl="' + id + '"]').forEach(function (m) {
      m.classList.add("flash");
      setTimeout(function () { m.classList.remove("flash"); }, 1200);
    });
  }

  function togglePanel(open) {
    if (open === undefined) open = !body.classList.contains("notes-open");
    body.classList.toggle("notes-open", open);
    try { localStorage.setItem("cnuw:v1:panel", open ? "1" : "0"); } catch (e) {}
    if (open) { renderPanel(); if (!annotatable) showTab(true); }
  }

  function updateCount() {
    var badge = document.getElementById("notes-count");
    if (!badge) return;
    var n = state.highlights.length + (state.note ? 1 : 0);
    badge.textContent = n;
    badge.hidden = !n;
  }

  // Pen marker on sidebar entries for pages that have notes.
  function markSidebar() {
    var ids = {};
    allPages().forEach(function (p) { ids[p.id] = true; });
    document.querySelectorAll(".sidebar-link, .chapter-list a").forEach(function (a) {
      var id = decodeURIComponent(new URL(a.getAttribute("href"), location.href).pathname.slice(rootUrl.pathname.length));
      a.classList.toggle("has-notes", !!ids[id]);
    });
  }

  // ---------------------------------------------------------------- wiring

  document.body.appendChild(panel);
  document.body.appendChild(toolbar);
  document.body.appendChild(popover);

  var btn = document.getElementById("notes-toggle");
  if (btn) btn.addEventListener("click", function () { togglePanel(); });

  if (annotatable) {
    content.addEventListener("mouseup", showToolbarSoon);
    content.addEventListener("keyup", function (e) { if (e.shiftKey) showToolbarSoon(); });
    document.addEventListener("selectionchange", debounce(function () {
      if (!selectionInContent()) hideToolbar(); else if ("ontouchstart" in window) showToolbarSoon();
    }, 250));
    content.addEventListener("click", function (e) {
      var mark = e.target.closest && e.target.closest("mark.hl");
      if (mark && window.getSelection().isCollapsed) openPopover(mark.dataset.hl, mark, false);
    });
  }
  document.addEventListener("mousedown", function (e) {
    if (toolbar.contains(e.target)) return;  // its buttons open the popover themselves
    if (!popover.contains(e.target) && !(e.target.closest && e.target.closest("mark.hl"))) closePopover();
    hideToolbar();
  });
  window.addEventListener("scroll", function () { hideToolbar(); }, { passive: true });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closePopover(); hideToolbar(); togglePanel(false); return; }
    var t = e.target;
    if (e.metaKey || e.ctrlKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    if (e.key === "n") { e.preventDefault(); togglePanel(); }
  });

  // Highlights are placed after KaTeX has rendered (app.js runs first).
  function start() {
    if (annotatable) applyAll();
    updateCount();
    markSidebar();
    var wasOpen = false;
    try { wasOpen = localStorage.getItem("cnuw:v1:panel") === "1"; } catch (e) {}
    if (wasOpen && window.innerWidth >= 1100) {
      panel.style.transition = "none";  // reopen instantly, no slide-in on every page
      togglePanel(true);
      panel.offsetWidth;
      panel.style.transition = "";
    }
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
