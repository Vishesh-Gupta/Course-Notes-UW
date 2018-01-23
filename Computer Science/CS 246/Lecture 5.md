# Lecture 5 
# Input / Output in C++
January 18, 2018

using namespace std;

```cpp
#include <iostream>

using namespace std;

int main() {
    cout<<"Hello World!"<<endl;
    return 0;
 } 
```

g++ -std=c++14 hello.c 

a.out

g++ -std=c++14 hello.c  -o myprog

Compiled C++ file and 

When you include iostream you are importing 3 global variables

std::cout      (type ostream)
- used to write to std out
- use the "output operator": << eg. `cout << "Bla"` 
 std::cin        (type istream)
-  used to read fro std input
- use the input operator: >> eg. `cin>>x;`

std::cerr    (type ostream)
    -write to std. error eg. `cerr << "Error Messaged";`
    
Std::cout is buffered and std::err is not buffered as usual

Eg. Add two numbers?
```cpp
#include <iostrseam>
using namespace std;
int main() {
    int x, y;
    cin>>x>>y;
    cout<<x + y<<endl;
    return 0;
}
```
The input read at the start and ends at the first whitespace. Std input ignores white spaces

If the first read fails then subsequent read fails too

CTRL + D is EOF
CTRL + C is Kill Process


cin>>x>>y  is waiting to read in two ints, ignoring whitespace
- if a read fails, the program keeps going with alll subsequent reads automatically failing.
- after a read we should check whether it succeeded
- after a read the expression `cin.fail()` will be true if the read failed.
- if a read fails because of EOF, then the expressions `cin.fail()` & `cin.eof()` are both true.

eg. Read all ints from stdin & echo them to stdout one per line. Stop if read fails.

```cpp
#include <iostream>
using namespace std;
int main() {
    int i;
    while(true){
        cin>>i; -> -> //cin>>i;
        if (cin.fail()) -> { //if (!cin) { -> // if (!(cin>>i)) {
            break;        
        }
        cout<<i<<endl;
    }
}
```

C++ defines an automatic conversion between istream (e.g. cin) & bool and will convert it to boolean.
cin is true if the last read did not fail.

In C, `int a = 21;` , we can write a>>3; This is called Right bit shift. Ai represented in binary in memory and then we say move the bits three times to the right whereas << is the left bit shift.

cin>>i;

In c++, operators can have multiple meaning and this is called operator overloading.

**Expressions produce values**
cin>>i, the expression produces cin.

The side effect is updating and producing cin;

eg. Read all ints and echo to stdout untill eof. Skip over for non-int inputs.

```cpp
#include <iostream>
using namespace std;
int main() {
    int i;
    while (true) {
        if (cin>>i) {
            cout<<i<<endl;
        } else { //read failed
            if (cin.eof()) {
                break;
            } else { //read failed due to bad input
                cin.clear(); //this acknowledges that a read failed. (In other words lower the failed flag)
                cin.ignore(); //ignores 1 character from stdin
            }
        }
    }
}
```

Cascading

Lookup how you can ignore all of hello in one go.

We have a string type in C++ (What no clappings, you do not feel the power of string type - Nomair)

**C++ Strings**
In C, strings were simulated using null terminated character arrays .
- error prone
- memory management
It has a "string" type which is not built in but we need to include a header `#include <string>` 
string s = "hello"
String is a C++ string and hello is a c string;

C Strings are automatically converted to c++ strings but reverse is not true..

Lookup std::string for more information.

Function | C | C++
equality  | strcmp | ==
inequality| strcmp | !=, <, >
length | strlen | str.length()
concatenation | strcat(s1,s2) | +
Individual elements | s[0],... | s[0], ...


```cpp
#include <iostream>
#include <string>
using namespace std;
int main () {
    string s;
    cin>>s;
    cout<<"s";
}   
```
  
**Format Specifiers**
%d - int
%s - char *
%x - int in hexadecimal
  
In C++, we can use I/O Manipulators to do the same.
eg. 
```cpp
int i = 95
cout<<i; //prints 95 in decimal
cout<<hex<<i; //prints 95 in hex
cout<<dec<<;
```

Side Effect: The internal stage is changed
We call hex, dec a sticky manipulator

Lookup more of these in iomanip header file

Some of the useful ones
boolalpha, showpoint, setprecision(3), skip ws/ not

getline(cin, s) // read into s everything untill a newline is encountered

The stream abstraction can be used to read write from other sources of data. 

#include <fstream>
if stream - input file stream
of stream - output file stream
Absolutely no difference

