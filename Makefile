# Common tasks. The website is built by Marginalia (https://github.com/Soboku-Labs/marginalia),
# configured in marginalia.toml. COURSE limits a target to one course, e.g. make site COURSE="CS 246".
COURSE ?=
SITE_DIR := _site
only = $(if $(COURSE),--only "$(COURSE)")
force = $(if $(FORCE),--force)
MARGINALIA := npx --no-install marginalia
# MacTeX installs into /Library/TeX/texbin, which a terminal opened before the
# install does not have on PATH yet.
ifneq ($(wildcard /Library/TeX/texbin),)
export PATH := /Library/TeX/texbin:$(PATH)
endif
TOOLS := latexmk xelatex pdflatex pandoc pdftocairo pdfinfo node npm
# Same packages CI installs (Ubuntu/Debian); macOS uses Homebrew and MacTeX.
APT_PACKAGES := texlive-latex-base texlive-latex-recommended texlive-latex-extra \
  texlive-fonts-recommended texlive-pictures lmodern latexmk texlive-xetex \
  texlive-lang-cjk texlive-lang-chinese fonts-noto-cjk pandoc poppler-utils nodejs npm

.PHONY: tools no-course help deps pdfs site check build serve login deploy upload new-course clean

help:
	@echo "make deps        install TeX Live, pandoc, poppler, Node and the CJK fonts (Homebrew or apt)"
	@echo "make pdfs        compile every course book (checks errors/undefined refs)"
	@echo "make site        build the website into $(SITE_DIR), reusing the last PDFs"
	@echo "make build       PDFs + website + search: the full site, ready to deploy"
	@echo "make check       strict build + check every formula renders: what CI runs"
	@echo "make serve       serve the built site on http://localhost:8000"
	@echo "make login       log in to Cloudflare in the browser (once per computer)"
	@echo "make deploy      build everything and upload it to Cloudflare Pages"
	@echo "make upload      upload the already built site without rebuilding"
	@echo "make new-course  SUBJECT=Mathematics CODE=\"Math 237\" TITLE=\"Calculus 3\" (XELATEX=1 for CJK text)"
	@echo "make clean       remove build outputs"
	@echo "Add COURSE=\"CS 246\" to pdfs/site/build/check to work on one course."
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

# Stop early with a clear message when a build tool is missing.
tools:
	@missing=""; for t in $(TOOLS); do command -v $$t >/dev/null 2>&1 || missing="$$missing $$t"; done; \
	if [ -n "$$missing" ]; then echo "Missing:$$missing. Run make deps (then open a new terminal)."; exit 1; fi

node_modules: package.json package-lock.json
	npm ci --no-audit --no-fund
	touch node_modules

pdfs: tools node_modules
	$(MARGINALIA) pdf $(force) $(only)

site: tools node_modules
	$(MARGINALIA) build --no-pdf --strict $(only)

build: tools node_modules
	$(MARGINALIA) build $(force) $(only)

check: tools node_modules
	$(MARGINALIA) check $(force) $(only)

serve: node_modules
	$(MARGINALIA) serve

login: node_modules
	$(MARGINALIA) login

# A deploy replaces the whole site, so it must never be a one-course build.
no-course:
	@test -z "$(COURSE)" || { echo "Deploy the full site: run without COURSE=."; exit 1; }

deploy: no-course tools node_modules
	$(MARGINALIA) deploy $(force)

upload: no-course node_modules
	$(MARGINALIA) upload

new-course:
	python3 scripts/new_course.py $(if $(XELATEX),--xelatex) "$(SUBJECT)" "$(CODE)" "$(TITLE)"

clean:
	rm -rf $(SITE_DIR) .marginalia build
