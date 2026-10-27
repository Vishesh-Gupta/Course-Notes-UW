// Globals provided by the page (KaTeX and Pagefind from their own scripts, the
// rest set by build.py or shared between our scripts).

interface KatexOptions {
  displayMode?: boolean;
  macros?: Record<string, string>;
  throwOnError?: boolean;
}

declare const katex: { render(tex: string, element: HTMLElement, options?: KatexOptions): void } | undefined;
declare const PagefindUI: (new (options: Record<string, unknown>) => unknown) | undefined;

interface Window {
  KATEX_MACROS?: Record<string, string>;
  /** The chapter section being read on a course page (set by app.ts). */
  currentChapter?: HTMLElement | null;
  /** The chapter the notes panel shows (set by notes.ts). */
  notesChapter?: () => HTMLElement | null;
}

/** Events our scripts use to talk to each other, and what they carry. */
interface AppEventDetail {
  chapterchange: { chapter: HTMLElement | null };
  "notes:chapter": { chapter: HTMLElement | null };
  "notes:panel": { open: boolean };
  "ink:changed": undefined;
}

interface DocumentEventMap {
  chapterchange: CustomEvent<AppEventDetail["chapterchange"]>;
  "notes:chapter": CustomEvent<AppEventDetail["notes:chapter"]>;
  "notes:panel": CustomEvent<AppEventDetail["notes:panel"]>;
  "ink:changed": CustomEvent<AppEventDetail["ink:changed"]>;
}
