# Lecture 3
## January 11, 2018

**Linux Shell (contd.)**

Last time:
egrep pattern file(s)
eg. egrep "(cs|CS)246" index.html
it is not the same as "(c|C)(s|S)246" which can also be written as "[cC][sS]246"

**Regular Expressions**
*[abc] *     - one character from this set (a | b | c)

*[^abc]*    -  one character not from this set

*?*             - 0 or 1 occurences of the preceeding expression.
eg. "cs ?246" matches "cs246" and "cs 246"
    (cs)?246 just shows cs246 or 246.
        
***            - 0 or more of the preceeding expressions

*+*            - 1 or more of the preceeding expressions

*.*            -  match any one character

*.**           - match any number of any characters

To escape the meaning of a special symbol use *\* - eg. \. ->matches a .

To force the regular expression to match starting at the start of the line use *^*

To match till the end of the line use the *$* symbol.
eg. "^cs246" - lines starting with cs246
"^cs246$" - lines only containing cs246

**Eg. Print all words from /usr/share/dict/words that start with an e and have a lenth of 5?**
*Ans. egrep "^e....$"    /usr/share/dict/words*

**Eg. Lines with even length?**
*egrep "^(..)*$" filename*

NOTE: If we are trying to force the counting we need ^$

**Eg. List file names in the current directory whose name contains exactly one a?**
*ls -a | egrep "^[^a]*a[^a]$"*

**File Permissions**
ls -l  - long form of listing
Filename
last modified date
size
group
owner
number of links to the file
- if ordinary file, d if directory
|--- | --- | --- |
|----|-----|----|
| rwx |r_x | r__ |
|user | group | other |
|permissions for the owner| users in the same group as rhe file| all other users|

r - read
w - write
x - execute -> means can we run this file as a prog
                    -> permission to enter (cd)
                    
Only the owner can change file permissions.

Change file permissions  - chmod (pronounced as shamod)  mode  file(s)
mode is made of three things. 
ownership class (*u*ser *g*roup *o*ther *a*ll) operator (+ - =) permissions (rwx)

chmod a+r final.pdf give all read permission
g - rw    remove read and write from the group
o=rx set others to read/execute

**Shell Variables**
x = 1 variables store strings

echo $x

When you write to a variable we dont' use a $ - symbol but when we read we use a $ - symmbol.

Recommended approach is ${x}  - GOOD TO USE CURLY BRACES AROUND VARIABLE NAMES

You are allowed operations on the variables

Single quotes suppress variabels to expand two values

These values stay in the memory for a current session. To setup for always then we need to set it up in bash profile

`echo ${PATH}`    a bunch of paths seperated by colon. It helps linux or shell to search for commands
Update Path Variable

PATH=mypath:${PATH}
PATH=${PATH}:mypath

**Shell Script**

It is a text file containing a sequence of commands which can be executed as a program.

First line should be `#!/bin/bash` -  Hash Bang line <- Shebang line.

It just tells that the script is a bash script

-Give a script Executable(x) permission using chmod command
-Run script using ./<script>

**Arguments to a script**

./script arg1 arg2 ...

$0    $1      $2
 
Eg. Is a given word a valid word in the dictionary?
```bash
#!/bin/bash
egrep "^$1$" /usr/share/dict/words
```

**Status Quote**

Linux commands set a status code ($?) 
0 - success
non-zero -failure
 
NOTE: To throw away the output we send the output to /dev/null

**Evaluate conditions**
Use the test program.
Test Program is called [ ]

eg. A good password is not in the dictionary. Is a given word a good password?
 
```bash
#!/bin/bash
egerp "^$1$" /usr/share/dict/words >  /dev/null
[$? -eq 0]
```
 
# to represent comments

[ -e  basic ] checks for file name basic exists or not.
