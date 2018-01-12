# Tutorial 2
## January 10, 2018

**List of Commands**

Change Directory (cd) - cd with not argument gets you back to home
                                        (minus)- gets back to previous directory you were on

Clear Screen (clear) - Clears the screen

List (ls) - lists the files
    eg. - ls ../.
          - ls -l
          - ls -a

Touch (touch) -  Makes an empty file

Present Working Directory (pwd) - Displays the present working directory

Cat (cat) - Prints out contents of the file

Tail (tail) - Prints out the last 10 ten lines of the file

Head (head)  - Prints out the first 10 lines by defualt

Sort (sort)  - Sorts in lexicographical order

Unique (uniq ) - Prints out all the  unique values

Output Redirection Program as a black box.

**Input and Output Direction Streams**
At default it is an input (stdin) and when we work with c++ we will solidify these concepts. IT has two forms of output which are stdout and stderr.

stdout is buffered it wont actually print out everthing as it is expensive for many

stderr is not bufferef so it can actually be very important. 
Eg.  Nuclear Reactor going ot explode and then we need it to present the error to us.

g++ printer.c -o print

./print

**Stream Numbers:**
&> - All Streams
2> &1 - Redirect stderr to the same stream as stdout.

| - Pipelining a command

Shuffle (shuf) - Generates a random permutaion

Tac (tac) -  

**Embedded command:**
$()
eg. $(cat patter) 

.

Grep (grep) - Grep is command for pattern recognition.
eg. egrep  "int" in word collection

**Regular Expressions for grep**
1. ^ - match the begininng of the line
1. $ match the end of the line
1. . - match any character
1. ? - 0 or 1 time
1. [ ] - looks for one of these things


**Vim commands:**
1. Esc + :wq - Is Write and Quit
1. Esc + :x    - Save and Quit for changes if there are changes, else quit as it is.
1. Esc + :xa  - Close All Vim tabs using :x command
1. Undo in Vim
1. Redo