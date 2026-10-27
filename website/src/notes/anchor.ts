// Finding a highlight's text in a chapter again and wrapping it in <mark>s.
import type { Highlight } from "../types";

export const CONTEXT = 32;

interface IndexedNode { node: Text; start: number }
export interface TextIndex { nodes: IndexedNode[]; text: string }

/** The chapter's text nodes, skipping KaTeX's hidden MathML copy and our own UI. */
export function textIndex(root: Element): TextIndex {
  const nodes: IndexedNode[] = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || p.closest(".katex-mathml, script, style, .hl-ignore, .ink-layer")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    nodes.push({ node: n as Text, start: text.length });
    text += (n as Text).nodeValue || "";
  }
  return { nodes, text };
}

/** Offset in the index text of a DOM point (as in a Range boundary). */
export function offsetOf(index: TextIndex, container: Node, offset: number): number {
  if (container.nodeType !== Node.TEXT_NODE) {
    // A point between elements maps to the start of the first text node after it.
    const point = document.createRange();
    point.setStart(container, offset);
    point.collapse(true);
    for (const entry of index.nodes) {
      if (point.comparePoint(entry.node, 0) >= 0) return entry.start;
    }
    return index.text.length;
  }
  const entry = index.nodes.find((e) => e.node === container);
  return entry ? entry.start + offset : -1;
}

function similarity(a: string, b: string, fromEnd: boolean): number {
  const len = Math.min(a.length, b.length);
  let n = 0;
  for (let i = 0; i < len; i++) {
    const x = fromEnd ? a[a.length - 1 - i] : a[i];
    const y = fromEnd ? b[b.length - 1 - i] : b[i];
    if (x !== y) break;
    n++;
  }
  return n;
}

/** Where a highlight's text is now: the occurrence whose context matches best. */
export function locate(index: TextIndex, hl: Highlight): number {
  let best = -1, bestScore = -1, from = 0, at: number;
  while ((at = index.text.indexOf(hl.exact, from)) !== -1) {
    const before = index.text.slice(Math.max(0, at - CONTEXT), at);
    const after = index.text.slice(at + hl.exact.length, at + hl.exact.length + CONTEXT);
    const score = similarity(before, hl.prefix || "", true) + similarity(after, hl.suffix || "", false);
    if (score > bestScore) {
      best = at;
      bestScore = score;
    }
    from = at + 1;
  }
  return best;
}

export function wrap(index: TextIndex, start: number, end: number, hl: Highlight): HTMLElement[] {
  const marks: HTMLElement[] = [];
  for (const entry of index.nodes) {
    const value = entry.node.nodeValue || "";
    const s = entry.start, e = s + value.length;
    if (e <= start || s >= end) continue;
    const a = Math.max(start, s) - s, b = Math.min(end, e) - s;
    if (!value.slice(a, b).trim()) continue;
    let target = entry.node;
    if (a > 0) target = target.splitText(a);
    if (b - a < (target.nodeValue || "").length) target.splitText(b - a);
    const mark = document.createElement("mark");
    mark.className = "hl hl-" + hl.color + (hl.comment ? " has-comment" : "");
    mark.dataset.hl = hl.id;
    target.parentNode!.insertBefore(mark, target);
    mark.appendChild(target);
    marks.push(mark);
  }
  return marks;
}

export function marksOf(id: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>(`mark.hl[data-hl="${id}"]`);
}

export function unwrap(id: string): void {
  marksOf(id).forEach((m) => {
    const parent = m.parentNode!;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
}
