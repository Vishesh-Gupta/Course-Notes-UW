# Lecture 10

February 06, 2018

## Copy ctor, dtor

Last Time: 
Members Initialization List 
    - must use to initialize const & reference
    - can be used for all fields
    - initializing occurs in declaration order
    - can be more efficient than initializing objects in the ctor body
    
```cpp
Student::Student (int id, int assns, int mt, int final):
    id{id}, assns{assns}, mt[mt], final{final}{
    
}
```
Where the int outside of {} is the field and the snippet inside the {} is value.

**Creating Copies of an object**
```cpp
Student billy{80, 50, 75};
Student bobby{billy}; //or Student bobby = billy;
```
Objects are copied by calling the Copy Constructor

You get a copy ctor for free.

Every class comes with the following
    - Default Ctor
    - Copy Ctor
    - Destructor
    - Copy assignment operator
    - Move constructor (C++ 11)
    - Move assignment operator (C++ 11)
(They are called the Big 5)

"There will be a question about them and I have already made that question an hour ago" - N.Naeem

The free copy ctor does a field for field copy
```cpp
Student::Student (const Student &other) : assns {other.assns}, mt{other.mt}, final{other.final} {}
```
    
    "Beggars can't be choosers" - N.Naeem
    
    Sometimes the free copy ctor might not do the right thing
    
```cpp
//node.h
//Include Guard is assumed

struct Node {
    int data;
    Node *next;
    Node(int data, Node *next);
    Node(const Node &other);
}

//node.cc
Node::Node(int data, Node *next) : data{data}, next{next}{}

Node::Node(const Node &other) : data{other.data}, next{other.next}{}

Node *np = new Node{1, new Node{2, new Node{3, nullptr}}};

Node m{*np}; //calls the copy ctor. This is in stack

Node *m2 = new Node{*np}; //calls the copy ctor. This is in heap though
```

Stack
np -> {1, .} -> {2, .} -> {3, /}
                           ^
m{1,.} ------------|

Not really a copy of a linked lisy. This is known as **Shallow Copy**

For a ptr, we might want to copy the ovject the ptr points to. This is called **Deep Copy**

```cpp
//This is a recursive call to the copy ctor

Node::Node(const Node &other) : data{other.data}, next{new Node{*other.next}}; //*other.next could be null

Node::Node(const Node &other) : data{other.data}, next{other.next ? new Node{other->next} : nullptr} {}
```

A copy ctor is used 
1. to create a copy of an object
2. when passing an argument by value    
3. when returning by value
    
#2 says when passing an argument by value, the parameter of the copy ctor must be passed by reference

The language forces you to send it by reference.

**Single paramater ctor**
```cpp
Node::Node(int data) : data{data}, next{nullptr}{}

Node n{4};
Node n = 4;
void foo(Node n){};
foo(4);
```

One parameter ctors create implicit or automatic conversion

```cpp
String s = "hello";
```

The C++ string class has a 1 param ctor with type ctor const char*

To disable automatic conversions, use the keyword explicit.

```cpp
struct Node {
    explicit Node(int data);
}

Node n = 4;
Node n{4};
foo(4);
```

**Destructor**
When an object is destroyed, a method is called the destructor runs.
1. Stack allocated object foes out of scope
1. explicit delete of a heap object

**Steps for object destruction**
1. dtor body runs
1. fields are destroyed: calls the dtorsfor fields that are objects
1. space is reclaimed
A class can only have one dtor
Name: ~ClassName()
    -no return type

The free dtor has an empty dtor body
    -> calls dtor on fields that are objects 
But this might not be what we want
```cpp
Node *np = new Node{1, new Node{2, new Node{3, nullptr}}};
```
When we write 
```cpp
delete np; //calls the dtor for Node with value 1
```
```none

```
This only frees the first Node. Node 2 and 3 are leaked lets write our own dtor 
```cpp
Node::~Node(){
    delete next;
}
```
```none

```
**Copy Assignment Operator**
```cpp
Student billy{80, 50, 75};
Student bobby{billy}; //copy ctor
Student jane;
jane = billy; // jane.operator=(billy);         //copy assignment operator
```

The free copy operator= does a field for firld copy.

The moment we have heap memory allocation then we need to create the new ctor.

implement operator= for node.
```cpp
int a = b = c = 0;
```

The assignment associates to the right.

This first assigns the c= 0, produces c and then b is assigned to c produces b which is assigned to a.

```cpp
n1 = n2 = n3;    //it is the same as n1.operator=(n2.operator=(n3));
```

Return tyoe must be a Node to do cascaded assignments

```cpp
Node &Node::operator=(const Node &other) {
    if (this == &other) return *this;    //explained at the last paragraph.
    data = other.data;
    delete next;    //This is important as next might already be pointing to heap memory
    next = other.next ? new Node{*other.next} : nullptr;
    return *this;
}
```
```none

```
The MIL cannot be used as it is only available for ctors

```cpp
Node n{1, new Node{2, nullptr}};
n = n;    n.operator=(n);
```
```none

```
other.next is the same as next. We deleted nextm which makes other.next as a dangling ptr. Ptr to memory  you should not be accessing.

Solution = check for self assignment

What happens if next was not assigned if the memory was not allocated. New fails.

[Previous Lecture](https://github.com/Vishesh-Gupta/Course-Notes-UW/blob/master/Computer%20Science/CS%20246/Lecture%209.md)
