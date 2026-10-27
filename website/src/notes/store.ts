// Loading and saving chapter notes, and listing everything saved.
import { INK_PREFIX, PAGE_PREFIX, type ChapterInk, type ChapterNotes } from "../types";
import { removeKey, rootUrl, setJSON, storage } from "../util";

export interface SavedChapter {
  id: string;
  data: Partial<ChapterNotes>;
  ink: ChapterInk | null;
}

export function loadNotes(id: string): ChapterNotes {
  let data: Partial<ChapterNotes> | null = null;
  try {
    data = JSON.parse(storage()?.getItem(PAGE_PREFIX + id) || "null");
  } catch {
    data = null;
  }
  return { note: "", ...(data || {}), highlights: data?.highlights || [], inserts: data?.inserts || [] };
}

export function saveNotes(id: string, data: ChapterNotes): void {
  if (!data.note && !data.highlights.length && !data.inserts.length) removeKey(PAGE_PREFIX + id);
  else setJSON(PAGE_PREFIX + id, data);
}

/** Every chapter with typed notes, highlights, added notes or handwriting. */
export function allSaved(): SavedChapter[] {
  const s = storage();
  const byId = new Map<string, SavedChapter>();
  if (!s) return [];
  for (let i = 0; i < s.length; i++) {
    const key = s.key(i);
    if (!key) continue;
    const isInk = key.startsWith(INK_PREFIX);
    if (!isInk && !key.startsWith(PAGE_PREFIX)) continue;
    const id = key.slice((isInk ? INK_PREFIX : PAGE_PREFIX).length);
    const entry = byId.get(id) || { id, data: {}, ink: null };
    byId.set(id, entry);
    try {
      if (isInk) entry.ink = JSON.parse(s.getItem(key) || "null");
      else entry.data = JSON.parse(s.getItem(key) || "null") || {};
    } catch {
      /* skip unreadable entries */
    }
  }
  return Array.from(byId.values()).sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** "cs-246/10-lecture10.html" -> the chapter inside the course page. */
export function chapterHref(id: string): string {
  const m = id.match(/^(.*\/)([^/]+)\.html$/);
  return new URL(m ? m[1] + "index.html#" + m[2] : id, rootUrl).href;
}

export function chapterMarkdown(id: string, d: Partial<ChapterNotes>): string {
  const out = ["## " + (d.title || id), "", "<" + chapterHref(id) + ">", ""];
  if (d.note) out.push(d.note.trim(), "");
  for (const n of d.inserts || []) {
    if (n.text) out.push("**Note after “" + (n.bt || "") + "…”**", "", n.text.trim(), "");
  }
  for (const h of d.highlights || []) {
    out.push("> " + h.exact.replace(/\s+/g, " ").trim());
    if (h.comment) out.push("", h.comment.trim());
    out.push("");
  }
  return out.join("\n");
}
