# Lecture 11

## Big 5 Ctor's (contd.)

**Last Time:**

```cpp
Node &Node::operator=(const Node &other) {
    if (this==&other) return *this;
    data = other.data;
    delete next;
    next = other.next ? (new Node (*other.next)) : nullptr;
    return *this;
}
```

Q. What if new fails?

Points: next will not be assigned as the prof is truing to recover from this error. next is now a dangling pointer.

Soln.
```cpp
Node &Node::operator=(const Node &other) {
    if (this==&other) return *this;
    node *tmp = next;
    next = other.next ? (new Node (*other.next)) : nullptr;
    data = other.data;
    delete tmp;
    return *this;
}
```

**Copy & Swap Idion**
```cpp
//node.h

struct Node {
    void swap(Node &);
    Node &operator=(const Node &);
}

//node.cc
#include <utility>

void Node::swap(Node &other) {
    using std::swap;
    swap(data, other.data);
    swap(next, next.data);
}

Node &Node::operator=(const Node &other) {
    Node tmp = other;    //deep copy ctor
    swap(tmp);
    return *this;        //also relies on correctly implemented dtor
}
```
```none

```
**Member functions vs Standalone functions**

operator= is implemented as a method. LHS is represented by *this.

eg. Implement operator on Vec as methods
```cpp
//Vec.h
struct Vec {
    int x,y;
    Vec operator+(const Vec &);
    Vec operator*(int k, const Vec &);
}

//Vec.cc

#include "vec.h"
Vec Vec::operator+(const Vec &v) {
    return {x+v.x, y+v.y};
}

Vec Vec::operator*(const Vec &v, int k) {
    return {x*k, y*k};
}

ostream &Vec::operator<<(ostream &out) {
    out << v.x << " "  << v.y;
    return &out;
}
```
```none

```
This will compile
```cpp
Vec v;
v<<coout;
```

io operator should be implemented as standalone functions always.

rvalue takes a `reference to const.`

Let us trace through this code
```none

```
```vim
mainline
    n 1->2 (basic ctor)
    plus one (n)
        pass by value
            1->2
            2->3
Node tmp = n (plus one's stack frame) (2 copy ctor)
    tmp in main stack frame
    n2 <- tmp                         (2 copy ctor)
g++14 node.cc ##results in 4 copy ctor implementations
              -f -elid-...    node.cc  
```

n2 is being constructed through copy ctor by copying from a temporary.
    the temporary value will be destroyed as soon as it has been used to construct n2


When we are about to copy from something that is a temporary it makes sense to not copy but take over/steal it.

Q. How do you represent tmp values?

An **Rvalue** is used to represent tmp values and it is defined as values that are not lvalues.

C++11 introduced "rvalue references" that are references to tmp objects (that are about to be destroyed).

**Move Constructor**

It takes a single rvalue reference as a parameter. 

```cpp
Node &&mynode; //mynode is a rvalue reference
Node::Node(Node &&other) : data{other.data}, next{other.next} {
    other.next=nullptr;    //remember other is about to be destroyed, its dtor will run  so we need to make sure we steal and not share
}
```
```none

```
other =Node -> Node ->Node /
                          ^
this     = Node -|

**Move Assignment Operator**
This has been implemented in file called node move assign.cc

```cpp
Node m{10, new Node{20, nullptr}};
m=plusone(n);    //rvalue
Node &operator=(Node &other) {
    swap(data, other.data);
    swap(next, other.next);
    //The above two lines can be replaced with
    swap(tmp);
}
```

**Copy/Move Elision**
Implemented in file called c++/elision/vec.cc

```cpp
Vec makeAVec() {return {0,0};}
Vec v = makeAVec();
```

Theoretically (1 basic + 1 cpy ctor/move)

The vec{0,0} is created directly in the space for v. 