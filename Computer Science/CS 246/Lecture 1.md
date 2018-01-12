# Lecture 1
## January 4, 2018
## Module 1: Linux Shell

**What is a shell?**
**Shell **is just an interface with your OS.
OS communicates with the hardware. 
Shell helps in 
1. Manipulate files
1. Run programs.

**Types of Shell**
There are two kinds of shells.
**Graphical Shell**
Windows, Mac, and Linux all three have this shell.
1. Point of click, drag and drop.
1. Intuitive to use.
*The big disadvantage of Graphical Shell is it is not so powerful. Every feature in a graphical shell had to be implemented in some way or the other. Eg. A folder has a lot files. The extension is .c file. The file extension is .cc. *
    
**Command-Line Shell**
Type commands on a prompt. A prompt is basically a blinking cursor. 
*The biggest disadvantage of command line shell is a steep learning curve and the big advantage is that It is very powerful.Eg. You do not need somebody to support some featrure and you can use them to do some feature.*

The `.dos `was used in early times but it has just got Stale. 

**Linux Command Line Shell**
It is a descendent of the original unix shell. (70s)
It was called the Shell. Written by Stephen Bourne. Had about a dozen or two of the commands.

At some point we had a lot of shells, of which some are as follows:-
1.  Korn Shell (KSh)
1. C Shell (CSh) which became L Turbo C shell (TCSH).

By this time the original shell was called Bourne Shell which became **Bourne Again Shell (**Bash).

**Linux File System**
The File System is very similar to what it is in windows. In linux, there are files which have the capability of having files in side them

A ***directory ***is a file that can contain other files. (Other than that linux does not distinguish between file and directory). It is not a standard terminology.

The **Linux File System **is a **tree-like structure..**
**    -**Root of the tree is a directory called the `root directory` 
    
A ***path ***specifies the location of any file in the file system.
    
In most Linux system, there is a location /usr/share/dict/words is an example of path, where `/` in the starting is the root directory. This is an absolute path.

***An absolute path ***is a path which begins at the root directory. 

**Linux Commands:**

`clear: clears the screen`

`ls: lists all the non-hidden files`
    `ls -a is a list command with the argument(options or flag) which displays all the files`
`pwd (Present Working Directory): What is the current directory`
`cd <path>: Stands for Change directory`
    `cd /Users/nanaeem/cs246/a/`

The path mentioned above is an absolute path as we start with the root directory

***A Relative Path ***starts from the current directory. If `pwd` is `/Users/nanaeem`, then the absolute path is `/Users/nanaeem/cs246/a1` which is the same as the relative path `cs246/a1`.

Aside:
1. `..` refers to the parent directory
1. `../..` refers to the grandparent directory.
1. `.` refers to the current directory.

The way to check if we are in the bash environent:
```bash
echo $0
--bash
```
