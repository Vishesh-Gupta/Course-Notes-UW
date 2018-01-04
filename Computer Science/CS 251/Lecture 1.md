# Lecture 1

Instructor: Rosina Kharilal
Class Room: RCH 305
Timings: 8:30 AM to 9:50 AM
Section: 001

Recommended Texts: 
1. Patterson and Hennessy: "Computer Organization & Design", 5th Edition, Morgan Kauffman, 2013. ISBN 0124077269
1. (Optional) Harris and Harris: "Digitial Design & Computer Architecture", 2nd Edition, Morgan Kauffman, 2012. ISBN 0123944244.

**Course Outline**
1. MIPS Basic Introduction (5 Instructions)
1. Digital Logic Design
1. Data Representation and Manipulation
1. Designing a Data Path
1. Simple-cycle datapath and multi-cycle datapath
1. Pipelines datapath and pipelined hazards
1. Memory hierarchies (Caches and Virtual Memory)
1. ARM: 32-Bit
NOTE: Major Part of the Final is the last part of the course.

Midterm: Feb 8, 2017
Final Exam: TBA

**Gist of the Course**
The curse is processor course. IT is on how to build a processor and how it works.

**Instruction Set Architecture**
We speak many high-level languages, but the processor speaks onnly one language. It is a low-level language.

Instructions are set of operations that the processor follows. Examples of operations: add, sub, branch, jump.

**Designing**
Hardware is based on certain principles. 

https://github.com/Vishesh-Gupta/Course-Notes-UW/blob/master/Computer%20Science/CS%20251/Computer%20Organization%20-%20Big%20Picture.png

Data Path  is a piece of hardware that comes together to execute an instruction.

**Assembly Language Such as MIPS (Instruction Set):**

Assembly Language: Low-level
First six bits of 32-bits are op code.

These opperations have different names and different formats

**MIPS (Microprocessor without Interlocked Pipelined Stages)**

It follows an architecture called RISC: Reduced Instruction Set (Computer).
1. Very Basic Operations
1. We look at a base of 32-bits
More advanced versions are available for MIPS , i.e., 64-bits, etc.

Hardware is divided into 5 steps.

```c
f = (g+h) - (i+j)
```

f, g, h, i, and j are assigned to different registers `$s1, $s2,..., $s5`.

A local storage unit is called a register which is a hardware component very similar to temporary variable.

https://github.com/vishesh-gupta/course-notes-uw/computer-science/CS-251/processor-data-path.png

Let us now look at some operation

0   `add $3 $2 $1 `
4   `sub                 `
8   `sub                 `
12 `sub                 `


32 bits of data

`$s1: f`     `$s2: g`     `$s3: h`     `$s4: i`     `$s5: j`

Data Dependancy
Overflow
Three general types of MIPS instructions
Format refers to how many and what type of operands
• R-Format:: `add $1,$2,$3` Adds contents of $2 to contents of $3; store result in $1. Often written as add rd,rs,rt, where rd is the destination register.
• I-Format: `addi $1, $2, 100` Adds immediate value 100 to contents of $2; store result in $1
• J-Format: `j 28 `Used for branching; discussed later

**Jump Bytes**
When we say Jump 40 we mean to instruction 40 but then pointer cointer moves to the position 160 as we tell it to move by 40 x 4 = 160. Every instruction in MIPS is 4 bytes.





