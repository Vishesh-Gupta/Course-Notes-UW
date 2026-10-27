// Getting around quickly: Ctrl/Cmd+K quick jump, sidebar filter, focus mode,
// recently viewed chapters and a hover-prefetch fallback.
import { body, getJSON, isTyping, pagePath, rootUrl, setJSON } from "./util";

interface Recent { h: string; t?: string; c?: string; k: string }
interface Entry { t: string; h?: string; c?: string; k: string; l?: string; q?: string; run?: () => void }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// ------------------------------------------------------------ recently viewed

const RECENT = "cnuw:v1:recent";
// Record each chapter read (the course page is one scroll, so on chapter change).
document.addEventListener("chapterchange", (e) => {
  const ch = e.detail.chapter;
  if (!ch) return;
  const h = pagePath + "#" + ch.id;
  const recent = getJSON<Recent[]>(RECENT, []).filter((r) => r.h !== h);
  recent.unshift({ h, t: ch.dataset.title, c: body.dataset.courseCode, k: "chapter" });
  setJSON(RECENT, recent.slice(0, 12));
});

const recentBox = document.getElementById("recent-pages");
if (recentBox) {
  const items = getJSON<Recent[]>(RECENT, []).slice(0, 6);
  if (items.length) {
    recentBox.appendChild(el("h2", "subject", "Recently viewed"));
    const list = el("div", "recent-list");
    for (const r of items) {
      const a = el("a", "recent-item");
      a.href = new URL(r.h, rootUrl).href;
      a.appendChild(el("span", "recent-course", r.c || ""));
      a.appendChild(el("span", "recent-title", r.t || r.h));
      list.appendChild(a);
    }
    recentBox.appendChild(list);
  }
}

// ------------------------------------------------------------ sidebar filter

const sidebar = document.getElementById("sidebar");
document.querySelectorAll<HTMLInputElement>(".sidebar-filter").forEach((input) => {
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    sidebar?.querySelectorAll<HTMLElement>(".sidebar-link").forEach((a) => {
      a.hidden = !!q && !(a.textContent || "").toLowerCase().includes(q);
    });
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = sidebar?.querySelector<HTMLAnchorElement>(".sidebar-link:not([hidden]):not(.active)");
      if (first) location.href = first.href;
    } else if (e.key === "Escape") {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.blur();
    }
  });
});

// ------------------------------------------------------------ focus mode

function setFocus(on: boolean): void {
  body.classList.toggle("focus-mode", on);
  setJSON("cnuw:v1:focus", on);
}
if (getJSON("cnuw:v1:focus", false)) body.classList.add("focus-mode");
document.getElementById("focus-toggle")?.addEventListener("click", () => setFocus(!body.classList.contains("focus-mode")));

// ------------------------------------------------------------ prefetch fallback

// Browsers without speculation rules: prefetch a page when its link is hovered.
const supportsRules = typeof HTMLScriptElement.supports === "function" && HTMLScriptElement.supports("speculationrules");
if (!supportsRules) {
  const done = new Set<string>();
  document.addEventListener("pointerover", (e) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href$='.html']");
    if (!a || a.origin !== location.origin || done.has(a.href)) return;
    done.add(a.href);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = a.href;
    document.head.appendChild(link);
  }, { passive: true });
}

// ------------------------------------------------------------ quick jump

let entries: Entry[] | null = null;
function loadEntries(): Promise<Entry[]> {
  if (entries) return Promise.resolve(entries);
  return fetch(new URL("assets/nav.json", rootUrl).href)
    .then((r) => r.json() as Promise<Entry[]>)
    .then((data) => (entries = data), () => (entries = []));
}

const overlay = el("div", "jump-overlay");
const dialog = el("div", "jump-dialog");
dialog.setAttribute("role", "dialog");
dialog.setAttribute("aria-label", "Jump to");
const input = el("input", "jump-input");
input.type = "text";
input.placeholder = "Jump to a course, chapter or lecture…";
input.setAttribute("aria-label", "Jump to");
const results = el("div", "jump-results");
results.setAttribute("role", "listbox");
const hint = el("div", "jump-hint");
hint.innerHTML = "<span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span>" +
                 "<span><kbd>Esc</kbd> close</span>";
dialog.append(input, results, hint);
overlay.appendChild(dialog);
body.appendChild(overlay);

let shown: Entry[] = [];
let selected = 0;

function actions(): Entry[] {
  return [
    { t: "Toggle dark mode", k: "action", run: () => document.getElementById("theme-toggle")?.click() },
    { t: "Open notes", k: "action", run: () => document.getElementById("notes-toggle")?.click() },
    { t: "Draw / handwriting", k: "action", run: () => document.getElementById("draw-toggle")?.click() },
    { t: "Toggle focus mode", k: "action", run: () => setFocus(!body.classList.contains("focus-mode")) },
  ];
}

// Every word of the query must appear; earlier and word-start matches rank higher.
function score(entry: Entry, words: string[]): number {
  const text = (entry.t + " " + (entry.c || "") + " " + (entry.l || "")).toLowerCase();
  let total = 0;
  for (const w of words) {
    let at = text.indexOf(w);
    if (at === -1) {
      at = text.replace(/\s+/g, "").indexOf(w); // "cs246" matches "CS 246"
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

function render(q: string): void {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    const here = window.currentChapter ? pagePath + "#" + window.currentChapter.id : pagePath;
    const recent: Entry[] = getJSON<Recent[]>(RECENT, []).filter((r) => r.h !== here).slice(0, 8)
      .map((r) => ({ t: r.t || r.h, c: r.c, h: r.h, k: "recent" }));
    shown = recent.concat(actions());
  } else {
    shown = (entries || []).concat(actions())
      .map((e) => ({ e, s: score(e, words) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((x) => x.e)
      .concat([{ t: "Search all notes for “" + q + "”", k: "search", q }]);
  }
  selected = 0;
  results.innerHTML = "";
  let lastGroup: string | null = null;
  shown.forEach((entry, i) => {
    const group = !words.length ? (entry.k === "recent" ? "Recently viewed" : "Actions") : null;
    if (group && group !== lastGroup) {
      results.appendChild(el("div", "jump-group", group));
      lastGroup = group;
    }
    const row = el("div", "jump-item");
    row.setAttribute("role", "option");
    row.dataset.index = String(i);
    const tag = entry.k === "chapter" ? entry.l || ""
      : entry.k === "course" ? "Course" : entry.k === "search" ? "Search" : entry.k === "action" ? "Action" : "";
    row.appendChild(el("span", "jump-tag", tag || entry.c || ""));
    row.appendChild(el("span", "jump-title", entry.t));
    if (entry.c && entry.k !== "course") row.appendChild(el("span", "jump-course", entry.c));
    row.addEventListener("mousemove", () => highlight(i));
    row.addEventListener("click", () => choose(i));
    results.appendChild(row);
  });
  highlight(0);
}

function highlight(i: number): void {
  selected = Math.max(0, Math.min(i, shown.length - 1));
  results.querySelectorAll<HTMLElement>(".jump-item").forEach((row) => {
    const on = Number(row.dataset.index) === selected;
    row.classList.toggle("active", on);
    if (on) row.scrollIntoView({ block: "nearest" });
  });
}

function choose(i: number): void {
  const entry = shown[i];
  if (!entry) return;
  closeJump();
  if (entry.run) {
    entry.run();
    return;
  }
  if (entry.k === "search") {
    const box = document.querySelector<HTMLInputElement>(".pagefind-ui__search-input");
    body.classList.add("show-search"); // the search box is hidden on small screens
    if (box) {
      box.value = entry.q || "";
      box.dispatchEvent(new Event("input", { bubbles: true }));
      box.focus();
    }
    return;
  }
  if (entry.h) location.href = /^https?:/.test(entry.h) ? entry.h : new URL(entry.h, rootUrl).href;
}

function openJump(): void {
  overlay.classList.add("open");
  input.value = "";
  loadEntries().then(() => render(input.value));
  render("");
  input.focus();
}
function closeJump(): void {
  overlay.classList.remove("open");
}

input.addEventListener("input", () => render(input.value));
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); highlight(selected + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); highlight(selected - 1); }
  else if (e.key === "Enter") { e.preventDefault(); choose(selected); }
  else if (e.key === "Escape") { e.preventDefault(); closeJump(); }
});
overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeJump(); });
document.getElementById("jump-open")?.addEventListener("click", openJump);
const kbd = document.querySelector(".jump-kbd");
if (kbd && /Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = "⌘K";

document.addEventListener("mousedown", (e) => {
  const search = document.getElementById("search");
  if (body.classList.contains("show-search") && search && !search.contains(e.target as Node)) {
    body.classList.remove("show-search");
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    if (overlay.classList.contains("open")) closeJump();
    else openJump();
    return;
  }
  if (isTyping(e)) return;
  if (e.key === "f") {
    e.preventDefault();
    setFocus(!body.classList.contains("focus-mode"));
  }
});
