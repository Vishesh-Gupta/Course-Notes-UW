# Lecture 13
February 15, 2018

## Iterator Pattern, More Visibility

The encapsulatoed class has O(n^2) traversal time. We are looking to bring it down to O(n)

**Design Patterns**
Commonly ovvuring good strategies and good solutions to problems.

**Iterator Design Pattern**
We will need to keep track of how much of the list we have traversed.
Without exposing the node class.

Let's create an iterator class to which we will give access to nodes
    - Will keep track of where we are in the traversal.
    - Will act as a pointer to the list

**Inspiration**
```cpp
for (int *p = array; p != array + arraySize; ++p) {
    *p;
}
```

Iterator should support the following methods: !=, unary prefix plus, *
    - need to create a new iterators
    - a way to tell that I have reached the end

```cpp
class List {
    struct Node;
    Node *theList = nullptr;
    public:
        class Iterator {
            Node *curr;
            public:
                explicit Iterator(Node *curr) : curr{curr}{}
                int &operator*() const {
                    return curr->data
                }
                Iterator &operator++() {
                    curr = curr->next;
                    return *this;
                }
                bool operator!=(const Iterator &other) const {
                    return curr != other.curr;
                }
        };    //end of Iterator class
        Iterator begin() {return Iterator{theList};}
        Iterator end() {return Iterator{nullptr};}
}    //end List

List l;
l.addToFront(1);
l.addToFront(2);
l.addToFront(3);
for (List::Iterator it = l.begin; it != l.end(); ++it) {    //->  for (auto it = l.begin; it != l.end(); ++it)
    cout << *it << endl;    
    //Output:
    //3
    //2
    //1
}
```

As of C++11, auto keyword has been defined which.
`auto x = y;`  //define x to the same type as y (automatic type declaration)

C++11 has a built in support for Iterator pattern.
1. Range based for loop.
```cpp
for (auto n : l) {                //type of n is by value type of operator*
    cout << n << endl;
}

for (auto &n : l) {               //type of n is by reference type of operator*
    n+=1;
}
```
```none


```
1. C has methods begin() & end() return objects from some class D.
1. D ahs methods operator*, operator++, operator!=

Range based for loop is a semantic system which is just making programmers job easier.

We should make client code use begin() and end()
    - ctor should be made private.
But then the list class would be able to call the iterator ctor either

The Iterator class can give access to its provate members to the list class.
Iterator class can make list class a **friend**.

```cpp
class List {
    struct Node;
    Node *theList = nullptr;
    public:
        class Iterator {
            Node *curr;
            public:
                explicit Iterator(Node *curr) : curr{curr}{}
                int &operator*() const {                                        // by reference to curr->data. Client code can read/write
                    return curr->data
                }
                Iterator &operator++() {                                        // return Iterator since ++ is an assignment
                    curr = curr->next;
                    return *this;
                }
                bool operator!=(const Iterator &other) const {   
                    return curr != other.curr;
                }
                friend class List;
        };    //end of Iterator class
        Iterator begin() {return Iterator{theList};}
        Iterator end() {return Iterator{nullptr};}
}    //end List

```
        
Friendship breaks encapsulation
    -have as few friends as possible

**ADVICE: KEEP FIELDS PRIVATE**

To provide read/write access input accessors (getters) and mutators(setters)

```cpp
class Vec {
    int x, y;
    public:
        int getX() const {return x;}
        int getY() const {return y;}
        void setX(int v) {x = v;}
        void setY(int v) {y = v;}
}
```
```none

```
**I/O Operators**
    - implemented as stand alone functions
if fields are private & there are no accessors & mutators, we can make these functions friends..

```cpp
class Vec {
    int x, y;
    friend std::ostream operator<<(std::ostream &out, Vec &v);
}
```
```none

```
Note that this does not make operator<< a method.

```cpp
std::ostream  &operator<<(const &out, Vec &v) {
    out << v.x << " " << v.y;
    return out;
}
```
```none

```
**Static Fields and Static Methods**
A static field is associated with its class and not individual objects.
    - think of it is per a class global
    
```cpp
struct Student {
    static int objCount;
    Student() {        //If there are other fields implement a proper MIL
        ++objCount;
    }
}
```
```none

```
**C++ rule: Static fields must be defined as a external to .cc file**

```cpp
//Student.cc

int Student::objCount = ;
```
```none

```
**Static Member Functions**
    - a static member function is associated with a class
    - does need an objecct to call this function on
    - because of this, static member functions (s.m.f) do not have a "this" pointer

S.M.F can only call other static member function and can only access static fields.

```cpp
struct Student {
    static int objCount;
    static void printObjCount() {
        cout << Student::objCount <<endl;
    }
}

Student Billy{...}, Bobby{...};
Student::printObjCount(); // outputs: 2
```
