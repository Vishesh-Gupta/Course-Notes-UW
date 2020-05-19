// Personal notes, saved in this browser (localStorage), per chapter:
//  - typed notes in the side panel,
//  - highlights with comments (anchored by their text, so they survive rebuilds),
//  - notes typed into the page between paragraphs (notes/inserts.ts).
// Handwriting (ink.ts) is stored separately and included in backups.
import { HIGHLIGHT_COLORS, INK_PREFIX, type ChapterInk, type ChapterNotes, type Highlight, type HighlightColor } from "./types";
import { CONTEXT, locate, marksOf, offsetOf, textIndex, unwrap, wrap } from "./notes/anchor";
import { bodyOf, cardOf, createInserts } from "./notes/inserts";
import { allSaved, chapterHref, chapterMarkdown, loadNotes, saveNotes } from "./notes/store";
import { body, debounce, el, emit, excerpt, getJSON, isTyping, newId, sectionOf, setJSON } from "./util";

const sections = Array.from(document.querySelectorAll<HTMLElement>("section.chapter"));
const annotatable = sections.length > 0;
const content = document.querySelector<HTMLElement>("main.content")!;

// ---------------------------------------------------------------- state

const states = new Map<string, ChapterNotes>();
function stateOf(section: HTMLElement): ChapterNotes {
  const id = section.dataset.pageId!;
  let st = states.get(id);
  if (!st) {
    st = loadNotes(id);
    states.set(id, st);
  }
  return st;
}

function persist(section: HTMLElement): void {
  const st = stateOf(section);
  st.title = section.dataset.title;
  st.course = body.dataset.courseCode || "";
  st.updated = new Date().toISOString();
  saveNotes(section.dataset.pageId!, st);
  updateCount();
  markSidebar();
}

const currentSection = (): HTMLElement | null => window.currentChapter || sections[0] || null;

function findHl(id: string | null): { hl: Highlight; section: HTMLElement } | null {
  if (!id) return null;
  for (const section of sections) {
    const hl = stateOf(section).highlights.find((h) => h.id === id);
    if (hl) return { hl, section };
  }
  return null;
}

const orphans = new Set<string>();
function applyHighlights(): void {
  for (const section of sections) {
    const root = bodyOf(section);
    for (const hl of stateOf(section).highlights) {
      const index = textIndex(root);
      const at = locate(index, hl);
      if (at < 0) orphans.add(hl.id);
      else wrap(index, at, at + hl.exact.length, hl);
    }
  }
}

function download(name: string, type: string, text: string): void {
  const a = el("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

// ---------------------------------------------------------------- selection toolbar

const toolbar = el("div", { class: "hl-toolbar hl-ignore", role: "toolbar", "aria-label": "Highlight" });
for (const c of HIGHLIGHT_COLORS) {
  toolbar.appendChild(el("button", {
    class: "swatch swatch-" + c, "aria-label": "Highlight " + c, title: "Highlight",
    onmousedown: (e) => { e.preventDefault(); createFromSelection(c, false); },
  }));
}
toolbar.appendChild(el("button", {
  class: "hl-note-btn", text: "Add note",
  onmousedown: (e) => { e.preventDefault(); createFromSelection("yellow", true); },
}));
const hideToolbar = () => toolbar.classList.remove("open");

/** The selected range, if it lies inside one chapter's text. */
function selectionInChapter(): { range: Range; section: HTMLElement } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  const section = sectionOf(range.startContainer);
  if (!section || sectionOf(range.endContainer) !== section) return null;
  const root = bodyOf(section);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const common = range.commonAncestorContainer;
  const anc = common.nodeType === Node.ELEMENT_NODE ? common as Element : common.parentElement;
  if (anc?.closest(".hl-ignore, input, textarea")) return null;
  if (!range.toString().trim()) return null;
  return { range, section };
}

function showToolbarSoon(): void {
  window.setTimeout(() => {
    const sel = selectionInChapter();
    if (!sel) return hideToolbar();
    const rect = sel.range.getBoundingClientRect();
    toolbar.classList.add("open");
    const w = toolbar.offsetWidth, h = toolbar.offsetHeight;
    let top = rect.top - h - 10;
    if (top < 70) top = rect.bottom + 10;
    toolbar.style.left = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2), window.innerWidth - w - 8) + "px";
    toolbar.style.top = top + "px";
  }, 10);
}

function createFromSelection(color: HighlightColor, withNote: boolean): void {
  const sel = selectionInChapter();
  hideToolbar();
  if (!sel) return;
  const index = textIndex(bodyOf(sel.section));
  let start = offsetOf(index, sel.range.startContainer, sel.range.startOffset);
  let end = offsetOf(index, sel.range.endContainer, sel.range.endOffset);
  if (start < 0 || end <= start) return;
  let exact = index.text.slice(start, end);
  start += exact.length - exact.replace(/^\s+/, "").length;
  end -= exact.length - exact.replace(/\s+$/, "").length;
  exact = index.text.slice(start, end);
  if (!exact) return;
  const hl: Highlight = {
    id: newId(), exact, color, comment: "", created: new Date().toISOString(),
    prefix: index.text.slice(Math.max(0, start - CONTEXT), start),
    suffix: index.text.slice(end, end + CONTEXT),
  };
  stateOf(sel.section).highlights.push(hl);
  const marks = wrap(index, start, end, hl);
  window.getSelection()?.removeAllRanges();
  persist(sel.section);
  renderPanel();
  if (withNote && marks.length) openPopover(hl.id, marks[0], true);
}

// ---------------------------------------------------------------- highlight popover

const popover = el("div", { class: "hl-popover hl-ignore", role: "dialog", "aria-label": "Highlight note" });
const popTextarea = el("textarea", { placeholder: "Add a note to this highlight…", rows: "3" });
const popColors = el("div", { class: "hl-pop-colors" });
let popId: string | null = null;
for (const c of HIGHLIGHT_COLORS) {
  popColors.appendChild(el("button", {
    class: "swatch swatch-" + c, "aria-label": c,
    onclick: () => {
      const found = findHl(popId);
      if (!found) return;
      found.hl.color = c;
      marksOf(found.hl.id).forEach((m) => {
        for (const x of HIGHLIGHT_COLORS) m.classList.remove("hl-" + x);
        m.classList.add("hl-" + c);
      });
      persist(found.section);
      renderPanel();
    },
  }));
}
popover.append(popColors, popTextarea, el("div", { class: "hl-pop-actions" }, [
  el("button", { class: "link-btn danger", text: "Delete highlight", onclick: () => { if (popId) removeHl(popId); closePopover(); } }),
  el("button", { class: "small-btn", text: "Done", onclick: () => closePopover() }),
]));
popTextarea.addEventListener("input", debounce(() => {
  const found = findHl(popId);
  if (!found) return;
  found.hl.comment = popTextarea.value;
  marksOf(found.hl.id).forEach((m) => m.classList.toggle("has-comment", !!found.hl.comment));
  persist(found.section);
  renderPanel();
}, 300));

function openPopover(id: string, anchor: HTMLElement, focus: boolean): void {
  const found = findHl(id);
  if (!found) return;
  popId = id;
  popTextarea.value = found.hl.comment || "";
  popover.classList.add("open");
  const rect = anchor.getBoundingClientRect();
  popover.style.left = Math.min(Math.max(8, rect.left), window.innerWidth - popover.offsetWidth - 8) + "px";
  popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - popover.offsetHeight - 8) + "px";
  if (focus) popTextarea.focus();
}
function closePopover(): void {
  popover.classList.remove("open");
  popId = null;
}

function removeHl(id: string): void {
  const found = findHl(id);
  if (!found) return;
  unwrap(id);
  const st = stateOf(found.section);
  st.highlights = st.highlights.filter((h) => h.id !== id);
  persist(found.section);
  renderPanel();
}

// ---------------------------------------------------------------- notes typed into the page

const inserts = createInserts({ stateOf, persist, changed: () => renderPanel(), currentSection });

// ---------------------------------------------------------------- notes panel

const panel = el("aside", { class: "notes-panel hl-ignore", id: "notes-panel", "aria-label": "Notes" });
const tabPage = el("button", { class: "notes-tab active", text: "This chapter" });
const tabAll = el("button", { class: "notes-tab", text: "All notes" });
const pageView = el("div", { class: "notes-view" });
const allView = el("div", { class: "notes-view", hidden: "" });
const pageTitle = el("div", { class: "notes-page-title" });
const noteArea = el("textarea", { class: "notes-textarea", placeholder: "Type your notes for this chapter… (saved automatically)" });
const savedHint = el("span", { class: "notes-saved" });
const insertList = el("div", { class: "hl-list" });
const hlList = el("div", { class: "hl-list" });
const allList = el("div", { class: "all-list" });
const fileInput = el("input", { type: "file", accept: "application/json,.json", hidden: "" });
let noteSection: HTMLElement | null = null; // the chapter the panel is showing

panel.appendChild(el("div", { class: "notes-head" }, [
  el("div", { class: "notes-tabs" }, [tabPage, tabAll]),
  el("button", { class: "icon-btn", "aria-label": "Close notes", html: "&times;", onclick: () => togglePanel(false) }),
]));
pageView.append(
  pageTitle,
  el("p", { class: "notes-tip", text: "Select text to highlight it, press a to type a note into the page, or write with an Apple Pencil." }),
  noteArea, savedHint,
  el("div", { class: "notes-section-title", text: "Handwriting" }),
  el("div", { id: "ink-pad-slot" }),
  el("div", { class: "notes-section-title", text: "Added in the page" }),
  insertList,
  el("div", { class: "notes-section-title", text: "Highlights" }),
  hlList,
  el("div", { class: "notes-actions" }, [
    el("button", {
      class: "small-btn", text: "Copy as Markdown",
      onclick: (e) => {
        if (!noteSection) return;
        const btn = e.currentTarget as HTMLButtonElement;
        const text = chapterMarkdown(noteSection.dataset.pageId!, stateOf(noteSection));
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => {
          btn.textContent = "Copied";
          window.setTimeout(() => { btn.textContent = "Copy as Markdown"; }, 1500);
        }, () => download("notes.md", "text/markdown", text));
      },
    }),
    el("button", {
      class: "link-btn danger", text: "Clear this chapter",
      onclick: () => {
        if (!noteSection || !confirm("Delete your typed notes, added notes and highlights for this chapter?")) return;
        const st = stateOf(noteSection);
        st.highlights.forEach((h) => unwrap(h.id));
        st.inserts.forEach((n) => cardOf(n.id)?.remove());
        st.highlights = [];
        st.inserts = [];
        st.note = "";
        noteArea.value = "";
        persist(noteSection);
        renderPanel();
      },
    }),
  ]),
);
allView.append(
  el("div", { class: "notes-actions top" }, [
    el("button", {
      class: "small-btn", text: "Export Markdown",
      onclick: () => download("course-notes.md", "text/markdown", allSaved().map((p) => chapterMarkdown(p.id, p.data)).join("\n\n")),
    }),
    el("button", { class: "small-btn", text: "Backup (JSON)", onclick: backup }),
    el("button", { class: "small-btn", text: "Restore", onclick: () => fileInput.click() }),
  ]),
  allList, fileInput,
);
panel.append(pageView, allView, el("div", {
  class: "notes-foot",
  html: "Saved in this browser only &middot; use Backup / Restore to move notes between devices.<br>" +
        "<kbd>n</kbd> notes &middot; <kbd>a</kbd> add note &middot; <kbd>d</kbd> draw &middot; " +
        "<kbd>[</kbd> <kbd>]</kbd> chapters &middot; <kbd>Ctrl K</kbd> jump",
}));

noteArea.addEventListener("input", debounce(() => {
  if (!noteSection) return;
  stateOf(noteSection).note = noteArea.value;
  persist(noteSection);
  savedHint.textContent = "Saved";
  window.setTimeout(() => { savedHint.textContent = ""; }, 1200);
}, 400));

/** Point the "This chapter" tab at the chapter being read. */
function showChapter(section: HTMLElement | null): void {
  if (section === noteSection) return;
  if (noteSection && document.activeElement === noteArea) { // flush what was typed
    stateOf(noteSection).note = noteArea.value;
    persist(noteSection);
  }
  noteSection = section;
  pageTitle.textContent = section?.dataset.title || "";
  noteArea.value = section ? stateOf(section).note || "" : "";
  renderPanel();
  updateCount();
  emit("notes:chapter", { chapter: section });
}
window.notesChapter = () => noteSection;

tabPage.addEventListener("click", () => showTab(false));
tabAll.addEventListener("click", () => showTab(true));
function showTab(all: boolean): void {
  tabPage.classList.toggle("active", !all);
  tabAll.classList.toggle("active", all);
  pageView.hidden = all;
  allView.hidden = !all;
  if (all) renderAll();
}

interface Backup { version?: number; pages?: Record<string, ChapterNotes>; ink?: Record<string, ChapterInk> }

function backup(): void {
  const pages: Record<string, Partial<ChapterNotes>> = {};
  const ink: Record<string, ChapterInk> = {};
  for (const p of allSaved()) {
    if (p.data.note || p.data.highlights?.length || p.data.inserts?.length) pages[p.id] = p.data;
    if (p.ink) ink[p.id] = p.ink;
  }
  download("course-notes-backup.json", "application/json", JSON.stringify({ version: 2, pages, ink }, null, 2));
}

/** Merge a backup into what is saved (keeps both typed notes, unions the rest). */
function restore(data: Backup): number {
  let n = 0;
  const union = <T extends { id: string }>(mine: T[], theirs: T[] = []): T[] => {
    const seen = new Set(mine.map((x) => x.id));
    return mine.concat(theirs.filter((x) => !seen.has(x.id)));
  };
  for (const [id, incoming] of Object.entries(data.pages || {})) {
    const existing = loadNotes(id);
    const note = existing.note && incoming.note && existing.note !== incoming.note
      ? existing.note + "\n\n" + incoming.note : existing.note || incoming.note || "";
    saveNotes(id, {
      ...incoming, ...existing, note,
      highlights: union(existing.highlights, incoming.highlights),
      inserts: union(existing.inserts, incoming.inserts),
    });
    n++;
  }
  for (const [id, incoming] of Object.entries(data.ink || {})) {
    const existing = getJSON<ChapterInk>(INK_PREFIX + id, { strokes: [], pad: [] });
    setJSON(INK_PREFIX + id, {
      ...incoming, ...existing,
      strokes: union(existing.strokes || [], incoming.strokes),
      pad: union(existing.pad || [], incoming.pad),
    });
    n++;
  }
  return n;
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  file.text().then((text) => {
    const n = restore(JSON.parse(text) as Backup);
    alert("Restored notes for " + n + " item(s).");
    location.reload();
  }).catch(() => alert("That file is not a notes backup."));
  fileInput.value = "";
});

function flash(target: Element): void {
  target.classList.add("flash");
  window.setTimeout(() => target.classList.remove("flash"), 1200);
}

function renderPanel(): void {
  const st = noteSection ? stateOf(noteSection) : null;

  insertList.innerHTML = "";
  const added = st ? st.inserts.filter((n) => n.text) : [];
  if (!added.length) {
    insertList.appendChild(el("p", { class: "muted small", text: "Press a (or the + beside a paragraph) to type a note into the page." }));
  }
  for (const n of added) {
    const item = el("div", { class: "hl-item hl-item-note" }, [el("p", { class: "hl-comment", text: excerpt(n.text, 200) })]);
    item.addEventListener("click", () => {
      const card = cardOf(n.id);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      flash(card);
    });
    insertList.appendChild(item);
  }

  hlList.innerHTML = "";
  const highlights = st ? st.highlights : [];
  if (!highlights.length) hlList.appendChild(el("p", { class: "muted small", text: "No highlights in this chapter yet." }));
  for (const hl of highlights) {
    const orphan = orphans.has(hl.id);
    const item = el("div", { class: "hl-item hl-item-" + hl.color + (orphan ? " orphan" : "") }, [
      el("blockquote", { text: excerpt(hl.exact, 180) }),
      hl.comment ? el("p", { class: "hl-comment", text: hl.comment }) : null,
      orphan ? el("p", { class: "muted small", text: "This passage changed; the highlight could not be placed." }) : null,
    ]);
    item.addEventListener("click", () => {
      const mark = document.querySelector<HTMLElement>(`mark.hl[data-hl="${hl.id}"]`);
      if (!mark) {
        if (orphan && confirm("Delete this highlight?")) removeHl(hl.id);
        return;
      }
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
      marksOf(hl.id).forEach(flash);
      if (window.innerWidth < 900) togglePanel(false);
      window.setTimeout(() => openPopover(hl.id, mark, false), 350);
    });
    hlList.appendChild(item);
  }
}

function renderAll(): void {
  allList.innerHTML = "";
  const saved = allSaved();
  if (!saved.length) {
    allList.appendChild(el("p", { class: "muted small", text: "No notes yet. Notes, highlights and handwriting you add anywhere appear here." }));
    return;
  }
  let course: string | null = null;
  for (const p of saved) {
    const d = p.data;
    const c = d.course || p.ink?.course || "";
    if (c !== course) {
      course = c;
      allList.appendChild(el("div", { class: "notes-section-title", text: course || "Other" }));
    }
    const count = d.highlights?.length || 0;
    const added = d.inserts?.length || 0;
    const ink = p.ink ? (p.ink.strokes?.length || 0) + (p.ink.pad?.length || 0) : 0;
    const meta = [
      count ? `${count} highlight${count === 1 ? "" : "s"}` : "",
      d.note ? "note" : "",
      added ? `${added} added note${added === 1 ? "" : "s"}` : "",
      ink ? "handwriting" : "",
    ].filter(Boolean).join(" · ");
    allList.appendChild(el("a", { class: "all-item", href: chapterHref(p.id) }, [
      el("span", { class: "all-title", text: d.title || p.ink?.title || p.id }),
      el("span", { class: "muted small", text: meta }),
      d.note ? el("span", { class: "all-note", text: excerpt(d.note, 120) }) : null,
    ]));
  }
}

function togglePanel(open?: boolean): void {
  const show = open === undefined ? !body.classList.contains("notes-open") : open;
  body.classList.toggle("notes-open", show);
  setJSON("cnuw:v1:panel", show ? "1" : "0");
  if (show) {
    renderPanel();
    if (!annotatable) showTab(true);
  }
  emit("notes:panel", { open: show });
}

function updateCount(): void {
  const badge = document.getElementById("notes-count");
  if (!badge) return;
  const st = noteSection ? stateOf(noteSection) : null;
  const n = st ? st.highlights.length + st.inserts.length + (st.note ? 1 : 0) : 0;
  badge.textContent = String(n);
  badge.hidden = !n;
}

/** Dot on sidebar entries for chapters that have notes or handwriting. */
function markSidebar(): void {
  const ids = new Set(allSaved().map((p) => p.id));
  document.querySelectorAll<HTMLElement>(".sidebar-link[data-page-id]").forEach((a) => {
    a.classList.toggle("has-notes", ids.has(a.dataset.pageId!));
  });
}
document.addEventListener("ink:changed", markSidebar);

// ---------------------------------------------------------------- wiring

document.body.append(panel, toolbar, popover);
document.getElementById("notes-toggle")?.addEventListener("click", () => togglePanel());

if (annotatable) {
  content.addEventListener("mouseup", showToolbarSoon);
  content.addEventListener("keyup", (e) => { if (e.shiftKey) showToolbarSoon(); });
  content.addEventListener("mousemove", inserts.trackPlus);
  document.addEventListener("selectionchange", debounce(() => {
    if (!selectionInChapter()) hideToolbar();
    else if ("ontouchstart" in window) showToolbarSoon();
  }, 250));
  content.addEventListener("click", (e) => {
    const mark = (e.target as Element).closest<HTMLElement>("mark.hl");
    if (mark && window.getSelection()?.isCollapsed && !body.classList.contains("drawing")) {
      openPopover(mark.dataset.hl!, mark, false);
    }
  });
  document.addEventListener("chapterchange", (e) => { if (e.detail.chapter) showChapter(e.detail.chapter); });
}
document.addEventListener("mousedown", (e) => {
  const t = e.target as Element;
  if (toolbar.contains(t)) return; // its buttons open the popover themselves
  if (!popover.contains(t) && !t.closest?.("mark.hl")) closePopover();
  hideToolbar();
});
window.addEventListener("scroll", hideToolbar, { passive: true });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePopover();
    hideToolbar();
    togglePanel(false);
    return;
  }
  if (isTyping(e)) return;
  if (e.key === "n") {
    e.preventDefault();
    togglePanel();
  } else if (e.key === "a" && annotatable) {
    const target = inserts.targetBlock();
    if (target) {
      e.preventDefault();
      inserts.add(target.section, target.block);
    }
  }
});

// Highlights are placed after KaTeX has rendered (app.ts runs first).
function start(): void {
  if (annotatable) {
    applyHighlights();
    inserts.apply(sections);
    showChapter(currentSection());
  }
  updateCount();
  markSidebar();
  if (getJSON<string>("cnuw:v1:panel", "0") === "1" && window.innerWidth >= 1100) {
    panel.style.transition = "none"; // reopen instantly, no slide-in on every page
    togglePanel(true);
    void panel.offsetWidth;
    panel.style.transition = "";
  }
}
if (document.readyState === "complete") start();
else window.addEventListener("load", start);
