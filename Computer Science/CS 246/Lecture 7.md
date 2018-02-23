# Lecture 7
January 25, 2018

Last time
```cpp
void inc(int &n) {
    n+=1;
}
int x = 5;
inc(x);
cout<<x<<endl;        //prints 6
```

```cpp
cin>>x ?
operator>>(cin, x);
std::istream&operator>>(std::istream &in, int &data);
```
**Pass by value | Pass by Reference**
```cpp
struct reallyBig{};
void f(reallyBig rb){}
reallyBig b;
f(b);            //this results in a copy of b to be created within f.
```
To avoid the copy, in C we would pass a pointer to b
    - same for C++
    
```cpp
void g(reallyBig &rb){}          //rb is another name for b
g(b);                            //avoids the copy
void h(const reallyBig &rb){}    //avoids the copy
h(b);                            //rb cannot change the values within b
```
rb is a const reference (Technically it is not a correct term), whereas the correct way of reading is rb is a reference to a const.

**ADVICE: Whenever possible prefer to pass by a reference to const for anything bigger than an int. Another benefit to passing by reference to const.**
```cpp
void foo(int &x) {}
foo(5);           // illegalizes because this leads to 5 = 10 when we change x = 10
foo(y+y);         // illegalizes because then y+y is being change not y and hence it is false
```

```cpp
void bar(const int &x) {}
bar(5);
bar(y+y);
```
C++ allows initialization of a reference to const from a value that is not an lvalue.

**Dynamic Memory Allocation (Heap Allocation)**

In C, 
```c
int *p = malloc(...);
.
.
.
free(p);
```
Works perfectly fine in C++, but we have a restriction in CS 246.

In C++, we use new/delete to allocate and deallocate respectively.

New is typeaware - knows the size of different types.
```cpp
struct Node {
    int data;
    Node *next;
}

Node *np = new Node;    //no need to specify how much space is needed
.
.
.
delete np;              //free something that you must have heap allocated earlier. always safe to delete nullptr.
```

```cpp
Node n;
Node *np = new Node;
// has n and np in the stack and some heap memory.
```

When n and np go out of scope, the memory for these is reclaimed. The heap value continues to live on.

Forgetting to deallocate heap memory causes **memory leaks. **Memory leaks are bad and earns you 0 marks on marmoset if you leak even 1 byte of memory.


**Allocating heap arrays**
```cpp
Node &narr = new Node[10];
.
.
.
delete [] narr;            //why we need [] is talked about in last week of CS 241
```

**Returning Values**
```cpp
Node getMeANode() {
    Node n;
    return n;
}
```
Returning by value, which means there is a copy of n.
This can be expensive   (*)        This is one thing we come back to in the later time of the course.

```cpp
------- DONT DO IT -----
/*
Node *getMeANode(){
    Node n;
    return &n;
} 
*/
------- DONT DO IT -----
```
The pointer is called a **dangling pointer** becuase the pointer is pointing to memory no longer yours to access.

Never return a pointer or a reference to a stack allocated memory (*). Will talk more in detail.

```cpp
Node *getMeANode() {
    Node *np = new Node;
    return np;
}
```



**Operator Overloading**
C++ allows giving meaning to C++ operators for types we have created.

```cpp
struct Vec {
    int x;
    int y;
};
```

In C,
```c
//to add
posn add(posn p1, posn p2);
```
  
  In C++,
```cpp
Vec operator+(const Vec &v1, const Vec &v2){
    Vec v{v1.x + v2.x, v1.y + v2.y};
    return v;
}

Vec operator*(const Vec &v1, const int &k){
    return {v1.x*k, v1.y*k};
}

Vec operator*(const int &k, const Vec &v1){
    return operator*(v1, k);
}
```

```cpp
struct Grade{
    int theGrade;
}
//implement the >> & << operator.

Grade g;
cout<<g

std::ostream &operator<<(std::ostream &out, const Grade &y){
    out<<g.theGrade<<"%";
    return out;
}

std::istream &operator>>(std::istream &in, Grade &y){
    in>>g.theGrade;
    if(g.thegrade < 0){
        g.theGrade = 0;
    } else if (g.theGrade > 100) {
        g.theGrade = 100; 
    }
    return in;
}
```

**The Preprocessor**

A program that runs before the compiler actually sees your code.
    - Changes your code
    
Every time we did `#include <>` .
`#` means preprocessor directive
`#include` means copy and paste header right here
`#include ""`, the quotes are for headers which are not in std. library.

To see the output of the preprocessor use -E -P
```bash
g++ -E -P file.cc
```

**Define Directive**

`#define VAR VALUE`

Searches and replaces VAR with VALUE

```cpp
#define MAX 10
...
int array[MAX];
```
