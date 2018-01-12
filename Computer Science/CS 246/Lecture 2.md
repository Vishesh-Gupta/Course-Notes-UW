# Lecture 2
## January 9, 2018

**cat** - concatenation
      - display the contents of a file      
**Ctrl + C **- Kill a program
**Ctrl + D** - Send end of file (EOF) signal
**Output Redirection: **
Direct the output produced by a program to a file.
Syntax: Command arg1 arg2 ... `>`  filename

**Input Redirection:**
Direct the contents of a file into a program.
Syntax:  command arg1 arg2 ... `<` filename

**cat sample.txt Vs. cat < sample.txt**
The program cat opens the file, when given a filename just display the content, whereas otherwise the shell opens the file and send the content to cat.

Can use input and output redirection once.

NOTE: wc sample.txt vs wc < sample.txt

General Case:
cmd arg1 arg2 ... < inputfilename > outputfilename
eg. cat -n < in.txt > out.txt
(cp command)

Behind the scenes:
Each linux process has three streams associated with it.

**Process (ls / cat / c / c++):**

|stdin (Input Stream) | Standard Output) | Standard Error|
|-----------------------------|---------------------------|-----------------------|
| Default: Keyboard   |  Default: Screen | Default: Screen |
| Use input redirection to change to a file | Use output redirection to change | Use error redirection (`2>`) |
||Uses Bufferring|Not Buffered|

**Buffer: Writing in Block is faster (CS 350)**

cmd >> out.txt
>> - Append to end

cmd < in 1> out 2> &1
&1 just means write to as the same place stdout.

**Wildcards (*)**
1. *****
ls *.txt
*.txt is a globbing pattern
List all the files but end with .txt
The shell intercepts this pattern
- finds the files that match the pattern.
- places these file names where the globbing pattern was
ls sameple.txt sample2.txt
- We can use globbing patterns with other commands

cat *.txt
echo *.txt
rm *.txt

rm -rf *.cc
rm -rf *

Single quotes/ Double quotes suppress globbing patterns

We can send the output (stdout) to the input of another program.
    - Use a linux Pipe
    cmd1 | cmd 2
    
Eg. How many words occur in the fiest 20 lines of sample.txt?
    wc -w
    head -20 sample.txt
         or 
    head -20 sample.txt | wc - w

Eg. Suppose files words*.txt contain lists of words one per line? Print a duplicate free of list of words in all files.

Uniq - 

cat words*.txt | sort | uniq

Use $(cmd) to embed a command within another command
echo "Today is $(date)"
SIDE Note: Single Quotes suppress the embedded commands

Without double quotes each string is an argument

**Command: egrep pattern file(s) **
 -returns lines that contain a string that matches the given pattern

egrep cs246 index.shtml | wc -l

egrep "cs246|cs246" index.shtml | wc -l

"cs246|CS246"
-use double quotes when using characters with special meanings.
