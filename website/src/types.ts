// Shapes of what is saved in localStorage (per chapter).

export type HighlightColor = "yellow" | "green" | "blue" | "pink";
export const HIGHLIGHT_COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

/** A highlight, found again by its text and a little context on either side. */
export interface Highlight {
  id: string;
  exact: string;
  prefix: string;
  suffix: string;
  color: HighlightColor;
  comment: string;
  created: string;
}

/** A note typed into the page after a block (paragraph, list, figure...). */
export interface Insert {
  id: string;
  /** Index of the block it follows, among the chapter's blocks. */
  b: number;
  /** Start of that block's text, to find it again if blocks move. */
  bt: string;
  text: string;
  created: string;
}

/** "cnuw:v1:page:<chapter id>" */
export interface ChapterNotes {
  title?: string;
  course?: string;
  note: string;
  highlights: Highlight[];
  inserts: Insert[];
  updated?: string;
}

export type InkTool = "pen" | "highlighter" | "eraser";

export interface Stroke {
  id: string;
  tool: InkTool;
  color: string;
  /** Points [x, y, pressure]; page strokes are relative to their block. */
  pts: [number, number, number][];
  /** Page strokes: the block they start on (see Insert.b / Insert.bt). */
  b?: number;
  bt?: string;
  /** Width of the block (or pad) when drawn, to scale when it reflows. */
  w?: number;
}

/** "cnuw:v1:ink:<chapter id>" */
export interface ChapterInk {
  title?: string;
  course?: string;
  strokes: Stroke[];
  pad: Stroke[];
  padHeight?: number;
}

export const PAGE_PREFIX = "cnuw:v1:page:";
export const INK_PREFIX = "cnuw:v1:ink:";

/** Text identifying a block: the start of its text. */
export function blockKey(block: Element): string {
  return (block.textContent || "").replace(/\s+/g, " ").trim().slice(0, 24);
}
