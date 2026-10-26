# CS 350 --- Operating Systems

LaTeX study notes for CS 350 (University of Waterloo), following the module order of the
OS/161-based course as taught 2016-2021 (topic list checked against the archived W18 and F20
term pages on student.cs.uwaterloo.ca).

## Building

Requires a TeX Live installation with `latexmk`. From this directory:

```
latexmk -pdf main.tex
latexmk -C   # clean build outputs
```

The shared preamble lives in `../common/preamble.tex`.

## Chapters

1. Introduction (what an OS is, kernel, execution environment, OS/161)
2. Threads and Concurrency
3. Synchronization
4. Processes, the Kernel, and System Calls
5. Virtual Memory
6. Scheduling
7. Devices and I/O
8. File Systems
9. Virtual Machines
