# Common tasks. COURSE limits a target to one course, e.g. make site COURSE="CS 246"
COURSE ?=
PDF_DIR := build/pdfs
SITE_DIR := website/_site
course_arg = $(if $(COURSE),"$(COURSE)")
site_course_arg = $(if $(COURSE),--course "$(COURSE)")

.PHONY: help pdfs js typecheck site math search check serve new-course clean

help:
	@echo "make pdfs        compile every course book (checks errors/undefined refs) into $(PDF_DIR)"
	@echo "make js          bundle the TypeScript page scripts (website/src -> website/dist)"
	@echo "make typecheck   type-check the TypeScript"
	@echo "make site        build the website into $(SITE_DIR) (strict: fails on warnings)"
	@echo "make math        check every formula on the site renders with KaTeX"
	@echo "make search      build the Pagefind search index for the site"
	@echo "make check       pdfs + typecheck + site + math: what CI runs"
	@echo "make serve       serve the built site on http://localhost:8000"
	@echo "make new-course  SUBJECT=Mathematics CODE=\"Math 237\" TITLE=\"Calculus 3\""
	@echo "make clean       remove build outputs"
	@echo "Add COURSE=\"CS 246\" to pdfs/site/check to work on one course."

pdfs:
	python3 scripts/check_latex.py --pdf-dir $(PDF_DIR) $(course_arg)

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

serve:
	python3 -m http.server -d $(SITE_DIR) 8000

new-course:
	python3 scripts/new_course.py "$(SUBJECT)" "$(CODE)" "$(TITLE)"

clean:
	rm -rf build $(SITE_DIR) website/.cache website/dist
