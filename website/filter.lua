-- Pandoc filter used by build.py when turning chapter LaTeX into site HTML.
-- Metadata: chapnum (chapter number in the book), imgprefix (relative path
-- to the course's image folder).

local chapnum = "1"
local imgprefix = ""

-- lstlisting style -> highlighting language understood by pandoc
local code_lang = {
  c = "c", cpp = "cpp", bash = "bash", racket = "scheme",
  mips = "mips", arm = "gnuassembler",
}

local theorem_like = {
  definition = true, example = true, theorem = true, lemma = true,
  corollary = true, proposition = true, remark = true,
}

local function escape_html(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
end

function Meta(meta)
  if meta.chapnum then chapnum = pandoc.utils.stringify(meta.chapnum) end
  if meta.imgprefix then imgprefix = pandoc.utils.stringify(meta.imgprefix) end
end

-- Pseudocode keeps $...$ math (mathescape) rendered by KaTeX, so it is emitted
-- as a pre-formatted div instead of <pre><code>, which KaTeX skips.
local function pseudo_block(text)
  local out, pos = {}, 1
  while true do
    local s, e = text:find("%$[^%$\n]+%$", pos)
    if not s then break end
    table.insert(out, escape_html(text:sub(pos, s - 1)))
    table.insert(out, '<span class="math inline">' ..
      escape_html(text:sub(s + 1, e - 1)) .. '</span>')
    pos = e + 1
  end
  table.insert(out, escape_html(text:sub(pos)))
  return pandoc.RawBlock("html",
    '<div class="code-block pseudo">' .. table.concat(out) .. '</div>')
end

function CodeBlock(el)
  local style = el.attributes["style"] or el.attributes["language"]
  el.attributes["style"] = nil
  el.attributes["language"] = nil
  if style then style = style:lower() end
  if style == "pseudo" then return pseudo_block(el.text) end
  if style and code_lang[style] then
    el.classes = { code_lang[style] }
  end
  el.attributes["data-lang"] = style or ""
  return el
end

function Image(el)
  local src = el.src
  local tikz = src:match("^@@TIKZ@@(.+)$")
  if tikz then
    el.src = imgprefix .. "tikz/" .. tikz .. ".svg"
    el.classes:insert("tikz")
  else
    el.src = imgprefix .. src
  end
  el.attributes["width"] = nil
  el.attributes["height"] = nil
  el.attributes["loading"] = "lazy"
  return el
end

-- "Definition 1.3" -> "Definition <chapnum>.3"; body of theorem-like
-- environments is shown upright like the PDF's definition style.
local function fix_theorem(div)
  local first = div.content[1]
  if not first or first.t ~= "Para" then return div end
  local inl = first.content
  if inl[1] and inl[1].t == "Strong" then
    local strong = inl[1].content
    for i, x in ipairs(strong) do
      if x.t == "Str" then
        local k = x.text:match("^1%.(%d+)$")
        if k then strong[i] = pandoc.Str(chapnum .. "." .. k) end
      end
    end
  end
  local out = pandoc.List()
  for _, x in ipairs(inl) do
    if x.t == "Emph" then out:extend(x.content) else out:insert(x) end
  end
  first.content = out
  return div
end

local function callout(div, kind)
  local title = nil
  local first = div.content[1]
  if first and first.t == "Para" and first.content[1]
      and first.content[1].t == "Strong" then
    local s = first.content[1].content
    if s[1] and s[1].t == "Str" and s[1].text:match("^@@T@@") then
      s[1] = pandoc.Str(s[1].text:gsub("^@@T@@", ""))
      title = pandoc.Plain(s)
      table.remove(div.content, 1)
    end
  end
  local blocks = pandoc.List()
  if title then
    blocks:insert(pandoc.Div({ title }, pandoc.Attr("", { "callout-title" })))
  end
  blocks:insert(pandoc.Div(div.content, pandoc.Attr("", { "callout-body" })))
  return pandoc.Div(blocks, pandoc.Attr("", { "callout", kind }))
end

function Div(el)
  local cls = el.classes[1]
  if cls == "important" then return callout(el, "important") end
  if cls == "aside" then return callout(el, "aside") end
  if cls and theorem_like[cls] then
    el = fix_theorem(el)
    el.classes:insert("thm")
    return el
  end
  if cls == "proof" then el.classes:insert("thm") return el end
  return nil
end

-- Pandoc runs Meta first when filters are given as a list of tables.
return {
  { Meta = Meta },
  { CodeBlock = CodeBlock, Image = Image, Div = Div },
}
