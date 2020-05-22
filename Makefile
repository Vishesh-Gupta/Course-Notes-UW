# Common tasks. COURSE limits a target to one course, e.g. make site COURSE="CS 246"
COURSE ?=
PDF_DIR := build/pdfs
SITE_DIR := website/_site
course_arg = $(if $(COURSE),"$(COURSE)")
site_course_arg = $(if $(COURSE),--course "$(COURSE)")
PAGES_PROJECT ?= course-notes-uw
WRANGLER := npx -y wrangler@4.20.0
# Same packages CI installs (Ubuntu/Debian); macOS uses Homebrew and MacTeX.
APT_PACKAGES := texlive-latex-base texlive-latex-recommended texlive-latex-extra \
  texlive-fonts-recommended texlive-pictures lmodern latexmk texlive-xetex \
  texlive-lang-cjk texlive-lang-chinese fonts-noto-cjk pandoc poppler-utils nodejs npm

.PHONY: no-course help deps pdfs js typecheck site math search check build serve login deploy upload new-course clean

help:
	@echo "make deps        install TeX Live, pandoc, poppler, Node and the CJK fonts (Homebrew or apt)"
	@echo "make pdfs        compile every course book (checks errors/undefined refs) into $(PDF_DIR)"
	@echo "make js          bundle the TypeScript page scripts (website/src -> website/dist)"
	@echo "make typecheck   type-check the TypeScript"
	@echo "make site        build the website into $(SITE_DIR) (strict: fails on warnings)"
	@echo "make math        check every formula on the site renders with KaTeX"
	@echo "make search      build the Pagefind search index for the site"
	@echo "make check       pdfs + typecheck + site + math: what CI runs"
	@echo "make build       pdfs + site + search: the full website with PDFs, ready to deploy"
	@echo "make serve       serve the built site on http://localhost:8000"
	@echo "make login       log in to Cloudflare in the browser (once per computer)"
	@echo "make deploy      build everything and upload it to Cloudflare Pages ($(PAGES_PROJECT))"
	@echo "make upload      upload the already built site without rebuilding"
	@echo "make new-course  SUBJECT=Mathematics CODE=\"Math 237\" TITLE=\"Calculus 3\" (XELATEX=1 for CJK text)"
	@echo "make clean       remove build outputs"
	@echo "Add COURSE=\"CS 246\" to pdfs/site/check to work on one course."
	@echo "Only courses whose files changed are recompiled; add FORCE=1 to rebuild every PDF."

deps:
ifeq ($(shell uname),Darwin)
	brew install pandoc poppler node
	brew install --cask mactex-no-gui font-noto-serif-cjk font-noto-sans-cjk
	@echo "Open a new terminal so the MacTeX binaries are on PATH."
else
	sudo apt-get update
	sudo apt-get install -y --no-install-recommends $(APT_PACKAGES)
endif

pdfs:
	python3 scripts/check_latex.py --pdf-dir $(PDF_DIR) $(if $(FORCE),--force) $(course_arg)

website/node_modules: website/package.json website/package-lock.json
	cd website && npm ci --no-audit --no-fund
	touch website/node_modules

js: website/node_modules
	cd website && npm run build

typecheck: website/node_modules
	cd website && npm run typecheck

site: js
	python3 website/build.py --strict --pdf-dir $(PDF_DIR) --out $(SITE_DIR) $(site_course_arg)

math: website/node_modules
	node website/check_math.mjs $(SITE_DIR)

search:
	npx -y pagefind@1.1.1 --site $(SITE_DIR)

check: pdfs typecheck site math

build: pdfs site search

serve:
	python3 -m http.server -d $(SITE_DIR) 8000

login:
	$(WRANGLER) login

deploy: no-course build upload

upload: no-course
	@test -f $(SITE_DIR)/index.html || { echo "No site in $(SITE_DIR); run make deploy (or make build) first."; exit 1; }
	$(WRANGLER) pages project create $(PAGES_PROJECT) --production-branch=main 2>/dev/null || true
	$(WRANGLER) pages deploy $(SITE_DIR) --project-name=$(PAGES_PROJECT) --branch=main --commit-dirty=true

# A deploy replaces the whole site, so it must never be a one-course build.
no-course:
	@test -z "$(COURSE)" || { echo "Deploy the full site: run without COURSE=."; exit 1; }

new-course:
	python3 scripts/new_course.py $(if $(XELATEX),--xelatex) "$(SUBJECT)" "$(CODE)" "$(TITLE)"

clean:
	rm -rf build $(SITE_DIR) website/.cache website/dist
