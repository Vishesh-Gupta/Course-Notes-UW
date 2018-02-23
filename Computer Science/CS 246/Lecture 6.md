# Lecture 6
January 23, 2018
# C++ Streams, Short Topics

Stream abstraction can be used on other sources of data.
```c
#include <fstream>
```

ifstream - reading files
ofstream - write to files


```cpp
//Source Code: io/readFile.css
#include <string>
#include <iostream>
#include <fstream>
int main() {
    ifstream filestream{"myfile.txt"}; //myfile.txt is a path
    string s;
    while(filestream>>s){
        cout<<s<<endl;
    }
}
```

file is opened during intialization
Q. When is it closed?

Ans. We will look into it 5 weeks from now approximately
closed when the filestream variable goes out of scope, that means the function is done in this case.

C++ parameters for appending are available and other properties

Anything that we can do with an istream(ostream) variable  (cin) we can do with an ifstream(ofstream) variable.

Another interesting thing is to attach streams to strings to read/write

```cpp
#include <sstream>
```
 istringstream - reads from string
 ostringstream - write to a string
 
```cpp
int low = (somevalue);
int high = (somevalue);
ostringstream ss;
ss<<"Enter value btw"<<low<<"and"<<high;
string s = ss.str()
```

```cpp
//SourceCode: io/getNum.cc
#include <sstream>
int n;
while(true){
    string s;
    cin>>s;                                //always succeeds(other than in EOF)
    istringstream ss{s};
    if (ss>>n) {
        break;    
    }
    cout<<"Enter a number"<<endl;
}

```
Benefits: Anything user types can be read into a string
This attempted to read if the user gives up meaning EOF.
Even if disread fails we need not use ignore and fail. Because we just make a new variable everytime.
This is a preferred way of doing so.

Compare readInts5.cc vs. readIntsSS.cc

(Not for marks:)Homework: Run the two programs and give the input hello123abc45

**Default Arguments in functions (C++)**
```cpp
void printFile(string name="myfile.txt"){
    ifstream filestream{name};
    string s;
    while(filestream>>s){
        cout<<s<<endl;
    }
}
```
Uses:
```cpp
printFile("other.txt"); //works if we want to call another file
printFile();            //will automatically take in default arguments
```

Default args. must always appear at last
```cpp
void test(int x =5, string str){} //is a mistake and will not compile. 
```
Breaks the rule of default arguments being last

```cpp
void foo(int x = 5, string str = "Hello") {}; //O
```
When you call a function and omit an argument, you are omitting the last one(or the last n)

```cpp
foo(10, "World");
foo(10);
foo();
//All the above three are legal 
foo("World");
//The last one doesn't work either
```

Q. Can functions have the same name?

Ans.NO in C, but YES in C++ and it is known as **Function Overloading** or **Overloading**

**Function Overloading**
C++ allows writing functions with the same name as long as the number and types of parameters have some difference. Cant just be different return types

```cpp
int neg(int x){
    return -x;
}

bool neg(bool b){
    return !b;
}
```

Can I implement void foo(int x){}?
Ans. Suppose you are allowed to do this then foo(10) is considered an ambiguos grammar.

```cpp
int a = 21;
int b = 3;
a>>b;            //Legal
cin>>x;          //Legal
```

C++ implements all operators as functions.
When we call a>>b, then the function is called operator>>

"Now we have a big NOTE in my NOTES" -Nomair Naeem

const int *p means p is a pointer to an int and int is constant.

So start from right and move left.
```cpp
int n = 5;
const int *p = &n;
p=&x; //is perfectly fine
*p = 10; //illegal
n = 10

int * const p = &n;
p=&x; //illegal
*p = 10;
```

**Structures in C++**
```cpp
struct Node {
    int data;
    struct Node *next; //-> Node *next
};
Struct Node n = {3, NULL} // -> Node n = {3, NULL} 
//Not to use NULL in C++11. A nullptr was introduced
```

"Use nullptr as I sometimes tend to go back to old habits - Nomair Neeem"

**Parameter Passing**
```cpp
void inc(int n){
    n+=1;
}
int x = 5;
inc(x);
cout<<x<<endl;    //prints x=5
```

C/C++ the default arguments are passed by value.

```c
void inc(int *n) {
    *n+=1;
}
int x =5;
inc(&x);
cout<<x<endl
```

```c
scanf("%d", &x)
```

In C++, we use cin>>x; and why not cin>>&x;??

C++ has a reference type &.

**C++ LValue References**
```cpp
int x = 10
int &z = x; //z is a L-Value reference to x and z is like a constant ptr to x.
int * const p = x;

*p = 5 or z = 5 //(NOT *Z = 5)
```

A L-Value reference is like a constant tr with automatic dereferencing
At x =10
z points to x.
p points to 10

To reead more about it read about Aliision (I suppose thats what he called it)
If you take the address of z, upi get the adress of x. Z itself has no identity, and is only a name for x.

**Restrictions on referencing **
References must be initialized. You cannot say int &z; 
Refernences must be initialized to a lvalue.
    - a lvalue represents a storage location (on address)
        int &z = x;
        int &z = y+y; // the expression does not have an address.
Cannot create ptrs to references
Cannot create a reference to a reference.
Cannot create an array of references.

```cpp
void inc(int &n) {
    n = n+1;
}
int x = 5;
inc(x);
cout<<x<<endl; //printxs x=6;;
```
