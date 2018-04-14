## CS 246 - Object-Oriented Software Development

Notes for CS 246 as taken in Winter 2018 with Nomair Naeem, typeset in LaTeX.
The original per-lecture Markdown files (`Lecture N.md`, `Tutorial N.md`,
`Course Outline.md`) and the StarUML sources (`*.mdj`) are kept alongside.

### Building

```bash
latexmk -pdf main.tex     # produces main.pdf
latexmk -C                # clean up build files
```

`main.tex` inputs the shared preamble in `../common/preamble.tex`; chapters live in
`chapters/`, images in `figures/`.

### Chapters

- Course Outline
- Lecture 1: The Linux Shell and File System
- Tutorial 1: Getting Set Up
- Tutorial 2: Shell Commands, Streams, grep and Vim
- Lecture 2: Redirection, Globbing, Pipes and egrep
- Lecture 3: Regular Expressions, Permissions, Variables and Scripts
- Lecture 4: Shell Scripting, Testing and Intro to C++
- Lecture 5: Input/Output in C++ and Strings
- Lecture 6: File and String Streams, Overloading, References
- Lecture 7: Pass by Reference, Dynamic Memory, Operator Overloading
- Lecture 8: Preprocessor, Separate Compilation and Make
- Lecture 9: Classes, Constructors and Member Initialization Lists
- Lecture 10: Copy Constructor, Destructor and Copy Assignment
- Lecture 11: Copy-and-Swap, Rvalues and Move Semantics
- Lecture 12: Elision, Rule of Five, Const Methods and Encapsulation
- Lecture 13: Iterator Pattern, Friends and Static Members
- Lecture 14: System Modelling, UML and Inheritance
- Lecture 15: Method Overriding, Virtual Methods and Polymorphism
- Lecture 16: Abstract Classes, Templates, Vectors and Exceptions
- Lecture 17: Exceptions and Design Patterns
- Lecture 18: Observer and Decorator Patterns, Big Five Revisited
- Lecture 19: Abstract Base Classes, Factory Method, Template Method, NVI, Maps
- Lecture 20: Visitor Continued, Compilation Dependencies and Pimpl (reconstructed; original notes missing)
- Lecture 21: Exception Safety, RAII and Smart Pointers
- Topic: Exception Safety Guarantees
- Topic: Coupling, Cohesion and MVC
- Topic: Template Functions, STL Iterators and Algorithms
- Topic: Casting and Run-Time Type Information
- Topic: How Virtual Methods Work (Vtables and Object Layout)
- Topic: Multiple Inheritance
