// Page basics (theme, menus, math, search, code copy) and, on a course page,
// tracking which chapter of the one long scroll is being read.
import { body, emit, getJSON, isTyping, renderMath, setJSON } from "./util";

const root = document.documentElement;

// Theme toggle (remembered per browser).
document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch {
    /* ignore */
  }
});

// Course dropdown.
document.querySelectorAll<HTMLElement>(".dropdown").forEach((dd) => {
  dd.querySelector(".dropdown-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dd.classList.toggle("open");
  });
});
document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown.open").forEach((dd) => dd.classList.remove("open"));
});

// Mobile sidebar.
const sidebar = document.getElementById("sidebar");
const navToggle = document.getElementById("nav-toggle");
if (navToggle) {
  if (!sidebar) navToggle.style.visibility = "hidden";
  navToggle.addEventListener("click", () => body.classList.toggle("sidebar-open"));
}

// Math: pandoc --katex leaves the TeX source in span.math elements.
renderMath(document);

// Search.
if (typeof PagefindUI !== "undefined" && document.getElementById("search")) {
  new PagefindUI({ element: "#search", showSubResults: true, showImages: false });
}

// Copy button on code blocks.
document.querySelectorAll<HTMLElement>("main.content pre, main.content .code-block").forEach((pre) => {
  const box = pre.closest<HTMLElement>("div.sourceCode") || pre;
  if (box.querySelector(".copy-btn")) return;
  const btn = document.createElement("button");
  btn.className = "copy-btn hl-ignore";
  btn.type = "button";
  btn.textContent = "Copy";
  btn.addEventListener("click", () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(pre.innerText.replace(/\n$/, "")).then(() => {
      btn.textContent = "Copied";
      window.setTimeout(() => { btn.textContent = "Copy"; }, 1500);
    });
  });
  box.classList.add("has-copy");
  box.appendChild(btn);
});

// ---------------------------------------------------------------------------
// Course page: every chapter in one scroll. Track which one is being read and
// tell the rest of the page (sidebar, contents, notes, ink).

interface LastRead { href: string; title?: string }

const chapters = Array.from(document.querySelectorAll<HTMLElement>("section.chapter"));
const sideLinks = new Map<string, HTMLAnchorElement>();
const tocLists = new Map<string, HTMLElement>();
document.querySelectorAll<HTMLAnchorElement>(".sidebar-link[data-chapter]").forEach((a) => sideLinks.set(a.dataset.chapter!, a));
document.querySelectorAll<HTMLElement>(".toc-chapter").forEach((ul) => tocLists.set(ul.dataset.chapter!, ul));
const progress = document.getElementById("progress");
const LINE = 140; // a chapter is "current" once its top passes this line
let current: HTMLElement | null = null;

function chapterAt(): HTMLElement | null {
  let found: HTMLElement | null = null;
  for (const ch of chapters) {
    if (ch.getBoundingClientRect().top <= LINE) found = ch;
    else break;
  }
  return found;
}

let hashTimer: number | undefined;
function setChapter(ch: HTMLElement | null): void {
  if (ch === current) return;
  if (current) {
    sideLinks.get(current.id)?.classList.remove("active");
    const toc = tocLists.get(current.id);
    if (toc) toc.hidden = true;
  }
  current = ch;
  window.currentChapter = ch;
  if (ch) {
    const link = sideLinks.get(ch.id);
    if (link && sidebar) {
      link.classList.add("active");
      const r = link.getBoundingClientRect(), sr = sidebar.getBoundingClientRect();
      if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) {
        sidebar.scrollTo({ top: link.offsetTop - sidebar.clientHeight / 3, behavior: "smooth" });
      }
    }
    const toc = tocLists.get(ch.id);
    if (toc) toc.hidden = false;
  }
  window.clearTimeout(hashTimer);
  hashTimer = window.setTimeout(() => {
    // Keep the address pointing at the chapter being read (unless it already
    // points somewhere inside it), so reloading or sharing lands here.
    const hash = location.hash.slice(1);
    const inside = ch && (hash === ch.id || hash.startsWith(ch.id + "-"));
    if (!inside) history.replaceState(null, "", location.pathname + location.search + (ch ? "#" + ch.id : ""));
    if (ch) {
      setJSON("cnuw:v1:last:" + body.dataset.course, { href: location.pathname + "#" + ch.id, title: ch.dataset.title });
    }
  }, 400);
  emit("chapterchange", { chapter: ch });
}

// "In this chapter": highlight the section being read.
function updateToc(): void {
  const list = current && tocLists.get(current.id);
  if (!list) return;
  let active: HTMLAnchorElement | null = null;
  const links = Array.from(list.querySelectorAll<HTMLAnchorElement>("a"));
  for (const a of links) {
    const h = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (h && h.getBoundingClientRect().top < LINE) active = a;
  }
  if (!active && links.length) active = links[0];
  list.querySelectorAll("a.active").forEach((a) => { if (a !== active) a.classList.remove("active"); });
  active?.classList.add("active");
}

// Progress bar: how far through the current chapter (or the page).
function updateProgress(): void {
  if (!progress) return;
  let pct = 0;
  if (current) {
    const r = current.getBoundingClientRect();
    const span = r.height - window.innerHeight + LINE;
    pct = span > 0 ? Math.min(100, Math.max(0, ((LINE - r.top) / span) * 100)) : 100;
  } else if (body.dataset.kind !== "page" && !chapters.length) {
    const max = root.scrollHeight - window.innerHeight;
    pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  }
  progress.style.width = pct + "%";
}

let ticking = false;
function onScroll(): void {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    if (chapters.length) {
      setChapter(chapterAt());
      updateToc();
    }
    updateProgress();
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

if (chapters.length) {
  sideLinks.forEach((link) => link.addEventListener("click", () => body.classList.remove("sidebar-open")));
  // Math and fonts change heights after load: land on the linked spot again.
  window.addEventListener("load", () => {
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    onScroll();
  });
}
onScroll();

// Keyboard: [ and ] for the previous / next chapter, / for search.
document.addEventListener("keydown", (e) => {
  if (isTyping(e)) return;
  if ((e.key === "[" || e.key === "]") && chapters.length) {
    const i = current ? chapters.indexOf(current) : -1;
    let target: HTMLElement | undefined;
    if (e.key === "]") target = chapters[i + 1];
    else if (current && current.getBoundingClientRect().top < -40) target = current; // back to its start
    else target = chapters[Math.max(0, i - 1)];
    target?.scrollIntoView({ behavior: "smooth" });
  } else if (e.key === "/") {
    const input = document.querySelector<HTMLInputElement>(".pagefind-ui__search-input");
    if (input) {
      e.preventDefault();
      input.focus();
    }
  }
});

// Continue where you left off (course page and home page cards).
const lastRead = (slug: string): LastRead | null => getJSON<LastRead | null>("cnuw:v1:last:" + slug, null);

const cont = document.getElementById("continue-reading");
if (cont && body.dataset.course && !location.hash) {
  const last = lastRead(body.dataset.course);
  if (last?.href) {
    cont.innerHTML = '<a class="continue-card" href=""><small>Continue where you left off</small><span></span></a>';
    cont.querySelector("a")!.href = last.href;
    cont.querySelector("span")!.textContent = last.title || "Last chapter";
  }
}
document.querySelectorAll<HTMLElement>(".card[data-course]").forEach((card) => {
  const last = lastRead(card.dataset.course!);
  if (!last?.href) return;
  const link = document.createElement("a");
  link.className = "card-continue";
  link.href = last.href;
  link.textContent = "Continue: " + (last.title || "last chapter");
  card.appendChild(link);
});
