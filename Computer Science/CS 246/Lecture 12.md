# Lecture 12
February 13, 2018

## Short Topics, Visibility, Invariants, Encapsulation

**Copy/Move Elision (Elision means Evaporation/Disappearance)**

```cpp
Vec makeVec() {return {0, 0};}
...
Vec v = makeVec();
```

Since we are returning, we call the basic ctor and since this is copy by value, there is an rvalue implementation then there will be a call also to the move ctor (If the move ctor is not available, then we see copy ctor call).

What actually happens is only the basic ctor runs! The object is beign created directly at the space reserved for v. 

Compilers are allowed (though not required) to elliminate copy or move contruction. 
    -even if copy/move ctor had side effect.
    
```bash
-f no-elide-constructors
```
```none

```
```cpp
void f(Vec v) {...}
f(makeVec());
```
```none

```
**Rule of Five**
If you need to write one of 
    - copy ctor
    - copy assignment operator,
    - dtor,
    - move ctor
    - move assignment operator
then you usually need to implement all of them.

### Short Topics:
**Arrays of Objects**
```cpp
struct Vec{
    int x;
    int y;
    Vec(int x, int y) : x{x}, y{y}{}
};

Vec vectors[3];    //stakc array of 3 vec objects
Vec *vectors1 = new Vec[3];    //heap array of 3 vec objects
```
It won't compile as there is no way to default contruct the objects. 


*How to fix this?*
1. provide a default ctor
1. for a stack array use array initialization syntax
```cpp
Vec vectors[3] = {Vec{0,0}, Vec{0,1}, Vec{0,2}}
```
1. Use array of pointers to objects
```cpp
Vec *vp[3]; //stack array of 3 vec pointers
Vec **vp1 = new Vec*[3];
vp1[0] = new Vec{0,0};
vp1[1] = new Vec{0,0};
vp1[2] = new Vec{0,0};

for (int i = 0; i<3; ++i) {
    delete vp1[i];
}
delete [] vp1;
```
```none

```
**Const Methods**
```cpp
struct Student {
    int assns, mt, final;
    float grade() const {return 0.4*assns + 0.2 * mt + 0.4 * final}; //right after the name of the modifier (the keyword) const does this.
};

const Student billy{80, 50, 75};
```
    - cannot change billy's fields.
    
Q. Can I call billy.grade()?
No, as grade did not promise to not change fields.
    - even if it does not actually change the fields.
To make this promise, declare the method const.

The const objects can only call const methods.
```cpp
struct Student {
    int assn, mt, final;
    mutable int counter;
    float grade() const {
        ++counter;
        return ...;
    }
}
```
```none

```
Won't compile as grade() is no longer a const method
    -but perhaps O should be allowed to modify counter;
and to do this add mutable keyword.

Marking a field mutable allows that fiels to be modified for a const object or by a const method.

### Visibility/Invariants & Encapsulation
```cpp
struct Node {
    int data;
    Node *next;
    Node(int data, Node *next) : data{data}, next{next}{ }
    ~Node() {delete next;}
};

Node n1{1, new Node{2, nullptr}};
Node n2{1, nullptr};
Node n3{1, &n2};
```
The program is likely to crash since &n2 is a stack address.

**Invariant : **a statement/assumption that must be true for a class to function correctly.

Node class invariant: either next is a nullptr or pts to the heap.

**Stack: **The Last thing you oush is the first thing we pop. //This is an invariant
    - Easy to break invariant here as well, by reordering the stack array using the sort order.
    
Users'/Client code should not be given unrestricted acces to implementation.

Results in program crashing and undefined behaviour.

**Encapsulation**
    - classes should be treated as black boxes/capsules
    - client code provided limited access through methods (interface)

```cpp
struct Vec {
    Vec(int x, int y);    //is public as default is public
    private:
        int x, y;
    public:
        Vec operator+(const Vec&v) {
            return {x+v.x, y+v.y};
        }
};

int main() {
    Vec v{1,2};    //as Vec(int, int) is public
    Vec v1 = v+v;  //legal as operator+ was public
                   //The big 5 (free ones) are public
    cout << v.x << v.y << endl; //Won't compile: fields are private    
}
```

**ADVICE: Fields should be private. Select methods should be public (interface)**

New Keyword: class

```cpp
class Vec {
    int x, y;    //default is private
    public:
        Vec(int, int);
        Vec operator+(const Vec &);
}
```

The only difference between `struct` and `class` is that od fefault visibility

**Node Invariant**
Encapsulation Node to guarantee the invariant

The key is to create a wrapper class `List` that has exclusive access to Node object
```cpp
//list.h
class List {
    struct Node;    //private Nested class of the List
    Next *theList = nullptr;
    public:
        void addToFront(int n);
        int ith(int i);
        ~List();    
};

///list.cc
struct List::Node {
    int data;
    Node *next;
    Node(int data, Node *next) : data{data}, next{next}{}
    ~Node() {delete next;}
};

List::~List() {
    delete theList;
}

void List::addToFront(int n) {
    theList = new Node{n, theList};
}

//Requires: index to be a valid index in theList
int List::ith(int index) {
    Node *curr = theList;
    for (int j = 0; j<index &&curr; ++j, curr=curr->next);
    return curr->data;
}
```

No one outside the List class would know about Node structure and hence we put it in our .cc file

We now have a guarantee that the invariant is maintained. 

The loss is to traverse the list is O(n^2)
