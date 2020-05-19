// Notes typed into the page: your own blocks between a chapter's paragraphs.
// Each is anchored to the block it follows (its index among the chapter's
// blocks plus the start of its text, so it finds its place again if the
// chapter changes a little).
import { blockKey, type ChapterNotes, type Insert } from "../types";
import { body, debounce, el, newId, renderMath, sectionOf } from "../util";

export interface InsertHost {
  stateOf(section: HTMLElement): ChapterNotes;
  persist(section: HTMLElement): void;
  /** Called after an insert is added, edited or removed (to refresh the panel). */
  changed(): void;
  currentSection(): HTMLElement | null;
}

interface Card extends HTMLElement { edit?: () => void }

export function bodyOf(section: HTMLElement): HTMLElement {
  return section.querySelector<HTMLElement>(".chapter-body")!;
}

/** The chapter's own blocks (not our added notes). */
export function contentBlocks(section: HTMLElement): HTMLElement[] {
  return (Array.from(bodyOf(section).children) as HTMLElement[]).filter((b) => !b.classList.contains("user-note"));
}

export function cardOf(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.user-note[data-note-id="${id}"]`);
}

function escapeHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Light Markdown: paragraphs, "- " lists, **bold**, *italic*, `code`, $math$, $$display math$$. */
export function renderText(text: string): string {
  const maths: { tex: string; display: boolean }[] = [];
  let t = text.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_m, d?: string, i?: string) => {
    maths.push({ tex: d || i || "", display: !!d });
    return "\u0000" + (maths.length - 1) + "\u0000";
  });
  t = escapeHtml(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  const html = t.split(/\n{2,}/).map((para) => {
    const lines = para.split("\n");
    if (lines.every((l) => /^\s*[-*] /.test(l))) {
      return "<ul>" + lines.map((l) => "<li>" + l.replace(/^\s*[-*] /, "") + "</li>").join("") + "</ul>";
    }
    return "<p>" + lines.join("<br>") + "</p>";
  }).join("");
  return html.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => {
    const mm = maths[Number(i)];
    return `<span class="math ${mm.display ? "display" : "inline"}">${escapeHtml(mm.tex)}</span>`;
  });
}

function autosize(area: HTMLTextAreaElement): void {
  area.style.height = "auto";
  area.style.height = area.scrollHeight + 2 + "px";
}

export function createInserts(host: InsertHost) {
  function makeCard(section: HTMLElement, ins: Insert): Card {
    const view = el("div", { class: "user-note-view" });
    const area = el("textarea", {
      class: "user-note-edit", rows: "2",
      placeholder: "Type your note…  **bold**, *italic*, `code`, $math$, - lists.  Ctrl+Enter to finish.",
    });
    const card: Card = el("div", { class: "user-note hl-ignore", "data-note-id": ins.id }, [
      el("div", { class: "user-note-head" }, [
        el("span", { class: "user-note-label", text: "Your note" }),
        el("button", { class: "link-btn danger", type: "button", text: "Delete", onclick: () => remove(section, ins.id) }),
      ]),
      view, area,
    ]);
    const show = () => {
      view.innerHTML = renderText(ins.text || "");
      renderMath(view);
      view.hidden = false;
      area.hidden = true;
    };
    const edit = () => {
      area.value = ins.text || "";
      view.hidden = true;
      area.hidden = false;
      area.focus();
      autosize(area);
    };
    view.addEventListener("click", (e) => { if (!(e.target as Element).closest("a")) edit(); });
    const store = debounce(() => { ins.text = area.value; host.persist(section); }, 400);
    area.addEventListener("input", () => { autosize(area); store(); });
    area.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        e.stopPropagation();
        area.blur();
      }
    });
    area.addEventListener("blur", () => {
      ins.text = area.value;
      if (!ins.text.trim()) {
        remove(section, ins.id);
        return;
      }
      host.persist(section);
      show();
      host.changed();
    });
    card.edit = edit;
    if (ins.text) show();
    else view.hidden = true;
    return card;
  }

  function place(section: HTMLElement, ins: Insert, card: HTMLElement): void {
    const blocks = contentBlocks(section);
    let block: HTMLElement | undefined = blocks[ins.b];
    if (!block || (ins.bt && blockKey(block) !== ins.bt)) {
      block = blocks.find((b) => ins.bt && blockKey(b) === ins.bt) || block || blocks[blocks.length - 1];
    }
    if (!block) return;
    let ref: Element = block; // after the block and any notes already following it
    while (ref.nextElementSibling?.classList.contains("user-note")) ref = ref.nextElementSibling;
    ref.parentNode!.insertBefore(card, ref.nextSibling);
  }

  function add(section: HTMLElement, block: HTMLElement): void {
    const blocks = contentBlocks(section);
    const ins: Insert = {
      id: newId(), b: Math.max(0, blocks.indexOf(block)), bt: blockKey(block), text: "",
      created: new Date().toISOString(),
    };
    host.stateOf(section).inserts.push(ins);
    const card = makeCard(section, ins);
    place(section, ins, card);
    card.edit?.();
  }

  function remove(section: HTMLElement, id: string): void {
    const st = host.stateOf(section);
    st.inserts = st.inserts.filter((n) => n.id !== id);
    cardOf(id)?.remove();
    host.persist(section);
    host.changed();
  }

  function apply(sections: HTMLElement[]): void {
    for (const section of sections) {
      for (const ins of host.stateOf(section).inserts) {
        if (ins.text) place(section, ins, makeCard(section, ins));
      }
    }
  }

  /** The block a new note should follow: the selection's, else the one being read. */
  function targetBlock(): { section: HTMLElement; block: HTMLElement } | null {
    const sel = window.getSelection();
    const node = sel && sel.rangeCount ? sel.getRangeAt(0).endContainer : null;
    let section = sectionOf(node);
    if (section && node && bodyOf(section).contains(node)) {
      let b: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
      while (b && b.parentElement !== bodyOf(section)) b = b.parentElement;
      if (b && !b.classList.contains("user-note")) return { section, block: b };
    }
    section = host.currentSection();
    if (!section) return null;
    const blocks = contentBlocks(section);
    const block = blocks.find((b) => b.getBoundingClientRect().bottom > window.innerHeight * 0.4) || blocks[blocks.length - 1];
    return block ? { section, block } : null;
  }

  // "+" in the margin of the block under the pointer.
  const plus = el("button", {
    class: "add-note-btn hl-ignore", type: "button", title: "Add a note after this (a)",
    "aria-label": "Add a note after this paragraph", html: "+",
  });
  let plusTarget: { section: HTMLElement; block: HTMLElement } | null = null;
  plus.addEventListener("mousedown", (e) => e.preventDefault());
  plus.addEventListener("click", () => {
    if (plusTarget) add(plusTarget.section, plusTarget.block);
    plus.classList.remove("show");
  });

  function trackPlus(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (t === plus) return;
    const section = !body.classList.contains("drawing") ? t.closest<HTMLElement>("section.chapter") : null;
    const root = section && bodyOf(section);
    if (!section || !root || !root.contains(t)) {
      plus.classList.remove("show");
      return;
    }
    let b: HTMLElement | null = t;
    while (b && b.parentElement !== root) b = b.parentElement;
    if (!b || b.classList.contains("user-note")) {
      plus.classList.remove("show");
      return;
    }
    plusTarget = { section, block: b };
    const r = b.getBoundingClientRect(), sr = section.getBoundingClientRect();
    plus.style.top = r.bottom - sr.top - 14 + "px";
    if (plus.parentNode !== section) section.appendChild(plus);
    plus.classList.add("show");
  }

  return { add, remove, apply, targetBlock, trackPlus };
}
