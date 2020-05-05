# Common tasks. COURSE limits a target to one course, e.g. make site COURSE="CS 246"
COURSE ?=
PDF_DIR := build/pdfs
SITE_DIR := website/_site
course_arg = $(if $(COURSE),"$(COURSE)")
site_course_arg = $(if $(COURSE),--course "$(COURSE)")

.PHONY: help pdfs site math search check serve new-course clean

help:
	@echo "make pdfs        compile every course book (checks errors/undefined refs) into $(PDF_DIR)"
	@echo "make site        build the website into $(SITE_DIR) (strict: fails on warnings)"
	@echo "make math        check every formula on the site renders with KaTeX"
	@echo "make search      build the Pagefind search index for the site"
	@echo "make check       pdfs + site + math: what CI runs"
	@echo "make serve       serve the built site on http://localhost:8000"
	@echo "make new-course  SUBJECT=Mathematics CODE=\"Math 237\" TITLE=\"Calculus 3\""
	@echo "make clean       remove build outputs"
	@echo "Add COURSE=\"CS 246\" to pdfs/site/check to work on one course."

pdfs:
	python3 scripts/check_latex.py --pdf-dir $(PDF_DIR) $(course_arg)

site:
	python3 website/build.py --strict --pdf-dir $(PDF_DIR) --out $(SITE_DIR) $(site_course_arg)

website/node_modules/katex:
	npm install --no-save --no-audit --no-fund --prefix website katex@0.16.9

math: website/node_modules/katex
	node website/check_math.mjs $(SITE_DIR)

search:
	npx -y pagefind@1.1.1 --site $(SITE_DIR)

check: pdfs site math

serve:
	python3 -m http.server -d $(SITE_DIR) 8000

new-course:
	python3 scripts/new_course.py "$(SUBJECT)" "$(CODE)" "$(TITLE)"

clean:
	rm -rf build $(SITE_DIR) website/.cache
