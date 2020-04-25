// Render every formula of the built site with KaTeX and fail on parse errors
// (KaTeX in the browser would otherwise show them in red).
// Usage: node website/check_math.mjs [website/_site]   (needs `npm install katex`)
import fs from "node:fs";
import path from "node:path";
import katex from "katex";

const siteDir = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), "_site");

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };
const unescape = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return entities[e] ?? m;
  });

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "pagefind" && entry.name !== "assets") yield* htmlFiles(p);
    } else if (entry.name.endsWith(".html")) yield p;
  }
}

let formulas = 0;
const failures = [];
for (const file of htmlFiles(siteDir)) {
  const html = fs.readFileSync(file, "utf8");
  const mm = html.match(/window\.KATEX_MACROS = (\{.*?\});<\/script>/);
  const macros = mm ? JSON.parse(mm[1].replace(/<\\\//g, "</")) : {};
  const re = /<span class="math (inline|display)">([\s\S]*?)<\/span>/g;
  let m;
  while ((m = re.exec(html))) {
    formulas++;
    const tex = unescape(m[2]);
    try {
      katex.renderToString(tex, { displayMode: m[1] === "display", macros: { ...macros }, throwOnError: true, strict: "ignore" });
    } catch (e) {
      failures.push(`${path.relative(siteDir, file)}: ${e.message.split("\n")[0]}\n    ${tex.slice(0, 160)}`);
    }
  }
}

console.log(`checked ${formulas} formulas`);
if (failures.length) {
  console.error(failures.slice(0, 50).join("\n"));
  console.error(`${failures.length} formula(s) failed to render`);
  process.exit(1);
}
