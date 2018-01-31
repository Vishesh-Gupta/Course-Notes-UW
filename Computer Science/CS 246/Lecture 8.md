# Lecture 8
January 30, 2018
# Preprocessor, Seperate Compilations

**Last Time: **
```cpp
#include <>
```

```bash
g++ -E -P <file.cc>
```
To see the processor output

**Today's Class:**
```cpp
#define VAR VALUE
```
e.g. 
```cpp
#define MAX 10
...
int arr[MAX];
```

**Conditional compilation**
```cpp
#define IOS 1
#define BBOS 2
#define OS IOS
#if OS == BBOS
    long long int key;
#elif OS == IOS
    int key;
#endif
```

*NOTE: This requires manually changing the defination for OS to target IOS/BBOS*

Let's use Preprocessor directives as arguments to the compiler
```bash
g++ -DVAR=VALUE <file.cc>
```

```cpp
#if 0 
    {
        //Block of Code
    }
#endif
```

#define VAR
    - value is an empty string
    
#ifdef - if this variable been defined VAR
#ifndef - if this variable has 

preprocess/debug.cc

**Seperate Compilations**
One common way to divide your code into header (.h) file - type definitions, forward declarations of functions - whereas the implementation goes in a implementation (.cc) file - implementation of functions.
 
```cpp
// lectures/seperate/example1
// vec.h contains definition of vec & forward declaration of operator+
// vec.cc implements operator+
```

**How to compile**
1.
```bash
g++ *.cc
#only works if  all files in pwd are part of the project
```
NOTE: .h files are meant to be included **NEVER **compiled 
2. List all the files
```cpp
g++ vec.cc main.cc
```
3. Seperate compilations
```bash
g++ vec.cc
g++ main.cc
#compiled but does not link
```
By default tries to prodce an executable
To tell g++ to just compile(and not link) use the -c option. 
```bash
g++ -c vec.cc
g++ -c main.cc
#produces object (.o) files
g++ main.o vec.o
#produces a.out
```

-c produces .o files (object files)
    -contain compiled binary code
    -also contain what is needed
    -To merge run  g++ <all your files>
    
**NOTE: -o <filename> outputs the executable with the filename**

The Problem: keeping track of which file(s) need to be recompiled.
    -Tool: Make
    
Create a Makefile
    -contains the layout of your program
    -conatins dependencies between files
myprog depends on main. and vec.o
vec.o depends on vec.cc & vec.h
main.o depends on main.cc & vec.h

```bash
# tools/make/example1/makefile
#targets
myprog: main.o vec.o
     g++ main.o vec.o -o myprog
vec.o:    vec.cc vec.h
     g++ -std=c++14 -c vec.cc
main.o:  main.cc vec.h
    g++ -std=c++14 main.cc
.PHONY: clean
clean:
    rm *.o myprog
```
Make 
    - when executed the first time it will compile all targets

If vec.cc is changed, make determines that the timestamp on vec.cc is newer than vec.o
    =>recompile
Now timestamp on vec.o is newer than myprog
    =>recompile myprog

The clean target enables you to delete all binaries to start fresh.
    .phony tells make that "clean" is ont a file

NOTE: make/example2 => use arguments to generalize the makefile

For a rule of the form
```makefile
x.o: x.cc a.h b.h
```
    
We can leave ut the compile command make wil infer
```makefile
${CXX}, ${CXXFLAGS}, -c x.c
```

g++ knows how to figure out dependencies

-Wall

example 3

```makefile
g++ -MMD -c vec.cc
#-MMD produce vec.d contains vec.o: vec.cc vec.h
#-c produce vec.o
```

-include ${Depends}

**Include Guard**

```bash
# seperate/example3
g++ -c main.cc
causes an error redefinition of struct vec
```

```cpp
#ifndef _VECTOR_H_
#define _VECTOR_H_
    old content vec.h
#endif
```
**NOTE: ALWAYS PUT INCLUDE GUARDS IN ALL .H FILES**