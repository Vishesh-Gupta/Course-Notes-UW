// Handwriting: write on the page with an Apple Pencil (or mouse / finger in
// draw mode), plus a handwriting pad in the notes panel.
//
// A page stroke is anchored to the block (paragraph, list, figure...) it starts
// on: its points are relative to that block's top-left corner and scaled by the
// block's width, so writing stays next to its text when the page reflows.
import { blockKey, INK_PREFIX, type ChapterInk, type InkTool, type Stroke } from "./types";
import { body, emit, getJSON, isTyping, newId, removeKey, setJSON } from "./util";

type Point = [number, number, number];

const SVGNS = "http://www.w3.org/2000/svg";
const PENS: Record<string, string> = { ink: "#1f2937", blue: "#2563eb", red: "#dc2626", green: "#16a34a" };
const SIZES: Record<InkTool, number> = { pen: 2.2, highlighter: 14, eraser: 0 };

interface Prefs { tool: InkTool; color: string; finger: boolean }

const sections = Array.from(document.querySelectorAll<HTMLElement>("section.chapter"));
if (sections.length) init();

function init(): void {
  const prefs = getJSON<Partial<Prefs>>("cnuw:v1:inkprefs", {});
  let tool: InkTool = prefs.tool || "pen";
  let color = prefs.color || "ink";
  let fingerDraws = !!prefs.finger;
  let drawMode = false;
  const savePrefs = () => setJSON("cnuw:v1:inkprefs", { tool, color, finger: fingerDraws });

  // ------------------------------------------------------------ storage

  const data = new Map<string, ChapterInk>();
  function inkOf(section: HTMLElement): ChapterInk {
    const id = section.dataset.pageId!;
    let d = data.get(id);
    if (!d) {
      const saved = getJSON<Partial<ChapterInk>>(INK_PREFIX + id, {});
      d = { ...saved, strokes: saved.strokes || [], pad: saved.pad || [] };
      data.set(id, d);
    }
    return d;
  }
  const saveTimers = new Map<string, number>();
  function persist(section: HTMLElement): void {
    const id = section.dataset.pageId!;
    const d = inkOf(section);
    d.title = section.dataset.title;
    d.course = body.dataset.courseCode || "";
    window.clearTimeout(saveTimers.get(id));
    saveTimers.set(id, window.setTimeout(() => {
      if (!d.strokes.length && !d.pad.length) removeKey(INK_PREFIX + id);
      else setJSON(INK_PREFIX + id, d);
      emit("ink:changed", undefined);
    }, 250));
  }
  const round = (v: number, n: number) => Math.round(v * 10 ** n) / 10 ** n;

  // ------------------------------------------------------------ drawing primitives

  /** Smooth path through the points (midpoint quadratic curves). */
  function pathData(pts: number[][]): string {
    if (!pts.length) return "";
    if (pts.length < 3) {
      const p = pts[0], q = pts[pts.length - 1];
      return `M${p[0]} ${p[1]}L${q[0] + 0.01} ${q[1] + 0.01}`;
    }
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += `Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
    }
    const last = pts[pts.length - 1];
    return d + `L${last[0]} ${last[1]}`;
  }

  function strokeWidth(st: Pick<Stroke, "tool" | "pts">, scale: number): number {
    const base = SIZES[st.tool] || 2.2;
    if (st.tool === "highlighter") return base * scale;
    const avg = st.pts.length ? st.pts.reduce((s, p) => s + (p[2] ?? 0.5), 0) / st.pts.length : 0.5;
    return base * (0.65 + avg * 0.9) * scale;
  }

  function makePath(st: Pick<Stroke, "tool" | "color" | "pts"> & { id?: string }, pts: number[][], scale: number): SVGPathElement {
    const path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", pathData(pts));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-width", String(strokeWidth(st, scale)));
    if (st.tool === "highlighter") {
      path.setAttribute("stroke", "#facc15");
      path.setAttribute("stroke-opacity", "0.38");
      path.setAttribute("class", "ink-hl");
    } else {
      path.setAttribute("stroke", PENS[st.color] || PENS.ink);
      path.setAttribute("class", "ink-pen" + (st.color === "ink" ? " ink-default" : ""));
    }
    if (st.id) path.dataset.stroke = st.id;
    return path;
  }

  function sizeSvg(svg: SVGSVGElement, w: number, h: number): void {
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }

  // ------------------------------------------------------------ page layer

  /** Blocks strokes can anchor to: the chapter heading, then the chapter's own blocks. */
  function blocksOf(section: HTMLElement): HTMLElement[] {
    const head = section.querySelector<HTMLElement>(".chapter-head");
    const bodyEl = section.querySelector<HTMLElement>(".chapter-body");
    const own = bodyEl ? (Array.from(bodyEl.children) as HTMLElement[])
      .filter((c) => !c.classList.contains("user-note") && !c.classList.contains("add-note-btn")) : [];
    return (head ? [head] : []).concat(own);
  }

  /** The block a stroke belongs to, even if the chapter's blocks moved around. */
  function resolveBlock(blocks: HTMLElement[], st: Stroke): HTMLElement | null {
    const b = st.b != null ? blocks[st.b] : undefined;
    if (b && (!st.bt || blockKey(b) === st.bt)) return b;
    return blocks.find((x) => st.bt && blockKey(x) === st.bt) || b || null;
  }

  function existingLayer(section: HTMLElement): SVGSVGElement | null {
    return section.querySelector<SVGSVGElement>(":scope > svg.ink-layer");
  }
  function layerOf(section: HTMLElement): SVGSVGElement {
    let svg = existingLayer(section);
    if (!svg) {
      svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("class", "ink-layer");
      section.appendChild(svg);
    }
    return svg;
  }

  function renderSection(section: HTMLElement): void {
    const d = inkOf(section);
    if (!d.strokes.length && !existingLayer(section)) return;
    const svg = layerOf(section);
    const sr = section.getBoundingClientRect();
    sizeSvg(svg, sr.width, sr.height);
    svg.replaceChildren();
    const blocks = blocksOf(section);
    for (const st of d.strokes) {
      const block = resolveBlock(blocks, st);
      if (!block) continue;
      const r = block.getBoundingClientRect();
      const scale = st.w ? r.width / st.w : 1;
      const ox = r.left - sr.left, oy = r.top - sr.top;
      svg.appendChild(makePath(st, st.pts.map((p) => [round(ox + p[0] * scale, 1), round(oy + p[1] * scale, 1)]), scale));
    }
  }
  const renderAll = () => sections.forEach(renderSection);

  // ------------------------------------------------------------ pad (notes panel)

  let pad: HTMLElement | null = null;
  let padSvg: SVGSVGElement | null = null;
  let padSection: HTMLElement | null = null;

  function buildPad(): void {
    const slot = document.getElementById("ink-pad-slot");
    if (!slot || pad) return;
    pad = document.createElement("div");
    pad.className = "ink-pad";
    padSvg = document.createElementNS(SVGNS, "svg");
    padSvg.setAttribute("class", "ink-pad-svg");
    pad.appendChild(padSvg);
    const actions = document.createElement("div");
    actions.className = "ink-pad-actions";
    const more = Object.assign(document.createElement("button"), { className: "link-btn", type: "button", textContent: "More space" });
    more.addEventListener("click", () => {
      if (!padSection) return;
      const d = inkOf(padSection);
      d.padHeight = (d.padHeight || 320) + 240;
      persist(padSection);
      renderPad();
    });
    const clear = Object.assign(document.createElement("button"), { className: "link-btn danger", type: "button", textContent: "Clear pad" });
    clear.addEventListener("click", () => {
      if (!padSection || !inkOf(padSection).pad.length || !confirm("Clear the handwriting pad for this chapter?")) return;
      pushUndo(padSection, "pad", inkOf(padSection).pad.slice(), null);
      inkOf(padSection).pad = [];
      persist(padSection);
      renderPad();
    });
    actions.append(more, clear);
    slot.append(pad, actions);
    attachInput(padSvg, () => padSection, true);
  }

  function renderPad(): void {
    if (!pad || !padSvg) return;
    const d = padSection ? inkOf(padSection) : { pad: [] as Stroke[], padHeight: 320 };
    const w = pad.clientWidth || 320, h = d.padHeight || 320;
    sizeSvg(padSvg, w, h);
    padSvg.style.height = h + "px";
    padSvg.replaceChildren();
    for (const st of d.pad) {
      const scale = st.w ? w / st.w : 1;
      padSvg.appendChild(makePath(st, st.pts.map((p) => [round(p[0] * scale, 1), round(p[1] * scale, 1)]), scale));
    }
  }

  // ------------------------------------------------------------ undo

  interface Undo { section: HTMLElement; where: "page" | "pad"; removed: Stroke[] | null; added: Stroke | null }
  const undoStack: Undo[] = [];
  function pushUndo(section: HTMLElement, where: Undo["where"], removed: Stroke[] | null, added: Stroke | null): void {
    undoStack.push({ section, where, removed, added });
    if (undoStack.length > 100) undoStack.shift();
  }
  function undo(): void {
    const u = undoStack.pop();
    if (!u) return;
    const d = inkOf(u.section);
    const list = u.where === "pad" ? d.pad : d.strokes;
    if (u.added) {
      const i = list.indexOf(u.added);
      if (i !== -1) list.splice(i, 1);
    }
    u.removed?.forEach((st) => { if (!list.includes(st)) list.push(st); });
    persist(u.section);
    if (u.where === "pad") renderPad();
    else renderSection(u.section);
  }

  // ------------------------------------------------------------ input

  const wantsInk = (e: PointerEvent): boolean =>
    e.pointerType === "pen" || // Apple Pencil always writes
    (drawMode && (e.pointerType === "mouse" || (e.pointerType === "touch" && fingerDraws)));

  // Stop the Pencil from scrolling or selecting text, while fingers still scroll.
  const stylusTouch = (e: TouchEvent): boolean =>
    Array.from(e.touches).some((t) => (t as Touch & { touchType?: string }).touchType === "stylus");
  const inInkArea = (target: EventTarget | null): boolean =>
    !!(target as Element | null)?.closest?.("section.chapter, .ink-pad-svg");
  for (const type of ["touchstart", "touchmove"] as const) {
    document.addEventListener(type, (e) => {
      if (inInkArea(e.target) && (stylusTouch(e) || (drawMode && fingerDraws))) e.preventDefault();
    }, { passive: false });
  }

  interface Live {
    section: HTMLElement; host: SVGSVGElement; origin: DOMRect; pts: Point[];
    erasing: boolean; pointerId: number; path?: SVGPathElement;
  }

  /** Hook pointer input on a surface: the page content (section from the pointer) or the pad. */
  function attachInput(surface: HTMLElement | SVGSVGElement, sectionFor: (e: PointerEvent) => HTMLElement | null, isPad: boolean): void {
    let live: Live | null = null;

    surface.addEventListener("pointerdown", (ev) => {
      const e = ev as PointerEvent;
      if (e.button > 0) return;
      if (!isPad && !wantsInk(e)) return;
      const section = sectionFor(e);
      if (!section) return;
      if (!isPad && (e.target as Element).closest(".hl-toolbar, .hl-popover, .ink-toolbar, a, button, input, textarea, .user-note")) return;
      e.preventDefault();
      if (e.pointerType === "pen" && !drawMode) setDrawMode(true, true);
      (surface as Element).setPointerCapture?.(e.pointerId);
      const host = isPad ? padSvg! : layerOf(section);
      if (!isPad) renderSection(section);
      live = { section, host, origin: host.getBoundingClientRect(), pts: [], erasing: tool === "eraser", pointerId: e.pointerId };
      addPoint(e);
    });

    function addPoint(e: PointerEvent): void {
      if (!live) return;
      const events = e.getCoalescedEvents?.() || [];
      for (const ev of events.length ? events : [e]) {
        live.pts.push([
          round(ev.clientX - live.origin.left, 1),
          round(ev.clientY - live.origin.top, 1),
          round(ev.pointerType === "pen" ? ev.pressure : 0.5, 2),
        ]);
      }
      if (live.erasing) {
        eraseNear(live);
        return;
      }
      live.path?.remove();
      live.path = makePath({ tool, color, pts: live.pts }, live.pts, 1);
      live.host.appendChild(live.path);
    }

    surface.addEventListener("pointermove", (ev) => {
      const e = ev as PointerEvent;
      if (!live || e.pointerId !== live.pointerId) return;
      e.preventDefault();
      addPoint(e);
    });

    function finish(ev: Event): void {
      const e = ev as PointerEvent;
      if (!live || e.pointerId !== live.pointerId) return;
      const l = live;
      live = null;
      if (l.erasing) return;
      if (l.pts.length < 2) {
        l.path?.remove();
        return;
      }
      const d = inkOf(l.section);
      const st: Stroke = { id: newId(), tool, color, pts: l.pts };
      if (isPad) {
        st.w = Math.round(l.origin.width);
        d.pad.push(st);
        pushUndo(l.section, "pad", null, st);
        persist(l.section);
        renderPad();
        return;
      }
      // Anchor to the block under the stroke's first point.
      const blocks = blocksOf(l.section);
      const firstY = l.origin.top + l.pts[0][1];
      let best = 0;
      blocks.forEach((b, i) => { if (b.getBoundingClientRect().top <= firstY) best = i; });
      const br = blocks[best].getBoundingClientRect();
      const dx = l.origin.left - br.left, dy = l.origin.top - br.top;
      st.b = best;
      st.bt = blockKey(blocks[best]);
      st.w = Math.round(br.width);
      st.pts = l.pts.map((p): Point => [round(p[0] + dx, 1), round(p[1] + dy, 1), p[2]]);
      d.strokes.push(st);
      pushUndo(l.section, "page", null, st);
      persist(l.section);
      renderSection(l.section);
    }
    surface.addEventListener("pointerup", finish);
    surface.addEventListener("pointercancel", finish);
    surface.addEventListener("lostpointercapture", finish);
  }

  /** Stroke eraser: remove whole strokes the eraser passes over. */
  function eraseNear(l: Live): void {
    const p = l.pts[l.pts.length - 1];
    const x = p[0] + l.origin.left, y = p[1] + l.origin.top;
    const hits = new Set<string>();
    l.host.querySelectorAll<SVGPathElement>("path[data-stroke]").forEach((path) => {
      const box = path.getBoundingClientRect();
      if (x < box.left - 12 || x > box.right + 12 || y < box.top - 12 || y > box.bottom + 12) return;
      const len = path.getTotalLength(), ctm = path.getScreenCTM();
      if (!ctm) return;
      for (let s = 0; s <= len; s += 4) {
        const pt = path.getPointAtLength(s);
        const sx = ctm.a * pt.x + ctm.c * pt.y + ctm.e, sy = ctm.b * pt.x + ctm.d * pt.y + ctm.f;
        if (Math.abs(sx - x) < 10 && Math.abs(sy - y) < 10) {
          hits.add(path.dataset.stroke!);
          break;
        }
      }
    });
    if (!hits.size) return;
    const isPad = l.host === padSvg;
    const d = inkOf(l.section);
    const list = isPad ? d.pad : d.strokes;
    const removed = list.filter((st) => hits.has(st.id));
    if (!removed.length) return;
    const kept = list.filter((st) => !hits.has(st.id));
    if (isPad) d.pad = kept;
    else d.strokes = kept;
    pushUndo(l.section, isPad ? "pad" : "page", removed, null);
    persist(l.section);
    if (isPad) renderPad();
    else renderSection(l.section);
  }

  // ------------------------------------------------------------ toolbar

  const bar = document.createElement("div");
  bar.className = "ink-toolbar hl-ignore";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Handwriting tools");
  function button(label: string, title: string, onClick: () => void, cls = ""): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ink-btn" + (cls ? " " + cls : "");
    b.innerHTML = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.addEventListener("click", onClick);
    bar.appendChild(b);
    return b;
  }
  const separator = () => bar.appendChild(Object.assign(document.createElement("span"), { className: "ink-sep" }));

  const toolBtns: Record<InkTool, HTMLButtonElement> = {
    pen: button("&#9998;", "Pen", () => setTool("pen")),
    highlighter: button('<span class="ink-hl-icon"></span>', "Highlighter", () => setTool("highlighter")),
    eraser: button("&#9003;", "Eraser (removes whole strokes)", () => setTool("eraser")),
  };
  separator();
  const colorBtns: Record<string, HTMLButtonElement> = {};
  for (const c of Object.keys(PENS)) {
    colorBtns[c] = button(`<span class="ink-dot" style="background:${PENS[c]}"></span>`, "Colour", () => {
      color = c;
      if (tool !== "pen") tool = "pen";
      refreshBar();
      savePrefs();
    }, "ink-color");
  }
  separator();
  button("&#8630;", "Undo", undo);
  const fingerBtn = button("&#9757;", "Finger draws (otherwise fingers scroll)", () => {
    fingerDraws = !fingerDraws;
    refreshBar();
    savePrefs();
  });
  button("Clear", "Clear handwriting on this chapter", () => {
    const section = window.currentChapter;
    if (!section || !inkOf(section).strokes.length || !confirm("Clear the handwriting on this chapter?")) return;
    pushUndo(section, "page", inkOf(section).strokes.slice(), null);
    inkOf(section).strokes = [];
    persist(section);
    renderSection(section);
  }, "ink-text");
  button("Done", "Stop drawing (d)", () => setDrawMode(false), "ink-text ink-done");
  body.appendChild(bar);

  function setTool(t: InkTool): void {
    tool = t;
    refreshBar();
    savePrefs();
  }
  function refreshBar(): void {
    (Object.keys(toolBtns) as InkTool[]).forEach((k) => toolBtns[k].classList.toggle("active", k === tool));
    Object.keys(colorBtns).forEach((k) => colorBtns[k].classList.toggle("active", tool === "pen" && k === color));
    fingerBtn.classList.toggle("active", fingerDraws);
    body.dataset.inkTool = tool;
  }

  function setDrawMode(on: boolean, quiet = false): void {
    drawMode = on;
    body.classList.toggle("drawing", on);
    bar.classList.toggle("open", on);
    document.getElementById("draw-toggle")?.classList.toggle("active", on);
    if (on && !quiet) window.getSelection()?.removeAllRanges();
  }

  // ------------------------------------------------------------ wiring

  const content = document.querySelector<HTMLElement>("main.content")!;
  attachInput(content, (e) => document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("section.chapter") || null, false);

  document.getElementById("draw-toggle")?.addEventListener("click", () => setDrawMode(!drawMode));
  document.addEventListener("keydown", (e) => {
    if (isTyping(e)) return;
    if (e.key === "d") {
      e.preventDefault();
      setDrawMode(!drawMode);
    } else if (e.key === "Escape" && drawMode) setDrawMode(false);
    else if (drawMode && (e.key === "z" || e.key === "u")) undo();
  });

  document.addEventListener("notes:chapter", (e) => {
    padSection = e.detail.chapter;
    buildPad();
    renderPad();
  });
  document.addEventListener("notes:panel", () => window.setTimeout(renderPad, 220));

  // Layout changes (resizing, fonts, images, added notes) move the text: redraw.
  let pending = false;
  const scheduleRender = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      renderAll();
      renderPad();
    });
  };
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(scheduleRender);
    sections.forEach((s) => ro.observe(s));
  }
  window.addEventListener("resize", scheduleRender);
  window.addEventListener("load", () => {
    buildPad();
    padSection = window.notesChapter?.() || sections[0];
    renderAll();
    renderPad();
    document.fonts?.ready.then(scheduleRender);
  });
  refreshBar();
}
