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
*.*             -  match any one character
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
| rwx |r_x | r__ |
|user | group | other |
|permissions for the owner| users in the same group as rhe file| all other users|

r - read
w - write
x - execute 