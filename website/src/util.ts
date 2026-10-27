// Small helpers shared by the page scripts (each script is bundled separately).

export const body = document.body;

/** The site root (pages know their relative path to it from data-root). */
export const rootUrl = new URL(body.dataset.root || "./", location.href);

/** This page's path relative to the site root, e.g. "cs-246/index.html". */
export const pagePath = decodeURIComponent(location.pathname.slice(rootUrl.pathname.length)) || "index.html";

/** localStorage, or null where it is unavailable (private mode, blocked storage). */
export function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage()?.getItem(key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw) as T | null;
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: nothing to do */
  }
}

export function removeKey(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** True when a key press belongs to a text field or carries a modifier. */
export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return e.metaKey || e.ctrlKey || e.altKey ||
    !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
}

type Attrs = Record<string, string | ((e: Event) => void)>;

/** Create an element; "text"/"html" set content, "onX" adds a listener. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Attrs = {}, children: (Node | null | undefined)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) if (child) node.appendChild(child);
  return node;
}

export function debounce(fn: () => void, ms: number): () => void {
  let timer: number | undefined;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, ms);
  };
}

export function excerpt(text: string, n: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Render every span.math inside a container with KaTeX (uses the notes' macros). */
export function renderMath(container: ParentNode): void {
  if (typeof katex === "undefined") return;
  container.querySelectorAll<HTMLElement>(".math").forEach((m) => {
    try {
      katex.render(m.textContent || "", m, {
        displayMode: m.classList.contains("display"),
        macros: { ...(window.KATEX_MACROS || {}) },
        throwOnError: false,
      });
    } catch {
      /* leave the TeX source visible */
    }
  });
}

/** The chapter <section> containing a node, if any. */
export function sectionOf(node: Node | null): HTMLElement | null {
  const elem = node && (node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement);
  return elem ? elem.closest<HTMLElement>("section.chapter") : null;
}

export function emit<K extends keyof AppEventDetail>(type: K, detail: AppEventDetail[K]): void {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}
