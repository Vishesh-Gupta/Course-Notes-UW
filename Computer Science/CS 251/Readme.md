# CS 251 -- Computer Organization and Design

LaTeX notes for CS 251 at the University of Waterloo (Winter 2017, instructor Rosina Kharal).
Textbooks: Patterson & Hennessy, *Computer Organization and Design* (5th ed.); Harris & Harris,
*Digital Design and Computer Architecture* (2nd ed., optional).

## Build

From this directory (uses the shared preamble in `../common/preamble.tex`):

    latexmk -pdf -interaction=nonstopmode main.tex
    latexmk -C    # clean up build outputs

## Chapters

1. `chapters/01-introduction.tex` -- course information, ISA, big picture, MIPS overview
2. `chapters/02-mips-basics.tex` -- the five-instruction MIPS subset (add, sub, lw, sw, beq)
3. `chapters/03-combinational-logic.tex` -- Boolean algebra, gates, K-maps, mux, decoder, adders, ALU
4. `chapters/04-sequential-logic.tex` -- latches, flip-flops, registers, register file, FSMs, memory
5. `chapters/05-data-representation.tex` -- unsigned/two's complement, overflow, IEEE 754, characters
6. `chapters/06-mips-isa.tex` -- MIPS formats, encoding, addressing, branches, procedures and the stack
7. `chapters/07-single-cycle-datapath.tex` -- single-cycle datapath and control, performance
8. `chapters/08-multi-cycle-datapath.tex` -- multi-cycle datapath, FSM control
9. `chapters/09-pipelining.tex` -- pipelining, hazards, forwarding, stalls, branch prediction
10. `chapters/10-caches.tex` -- memory hierarchy, direct-mapped and set-associative caches, write policies
11. `chapters/11-virtual-memory.tex` -- page tables, page faults, TLB
12. `chapters/12-arm.tex` -- ARM 32-bit, ARMv8 (AArch64), comparison with MIPS

The original Markdown notes (`Lecture 1.md`) are kept alongside; the big-picture image is copied to
`figures/big-picture.png`.
