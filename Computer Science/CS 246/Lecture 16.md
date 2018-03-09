# Lecture 16
March 06, 2018
## Virtual, Pure Virtual, Templates, Exceptions

```cpp
class Student {
    ...
    public:
        virtual int fees() = 0;    //Pure Virtual Method
};

class Regular : public Student {
    ...
    int fees() override { ... }
}
```

**Pure virtual Methods**
A method that does not have an implementation

classes containing pure virual methods cannot be instantiated.

```vim
Student s; //Will not compile
```

Such classes are called *abstract classes.*
A subclass inherits all the members (including pure virtual methods)
A subclass must implement all pure virtual methods to be considered concrete.

Uses of abstract classes:
    - Organize subclasses. 
    - Represent common fields/methods
    - Can still use pointers of type student. (It will either point to a Regular student or Co-op Student but not to a student as there is not student object)
    e.g. for polymorphism to work.
    
**UML**
In UML, the types virtual and pure virtual method names are in italics and also abstract class names are also in italics.
For any static member, it is underlined.

(Omnigraph)

**Templates**
```cpp
class Stack {
    int size;
    int cap;
    int *contents;
    public:
        Stack();
        void push(int x);
        void pop();
        int top() const;
        ~Stack();
}

Stack s;
s.push(1);
s.push(2);
s.top();
s.top();
```

Template class
A class that is parameterized on one or more of the types.

```cpp
template <typename T> 
class Stack {
    int size;
    int cap;
    T *contents;
    public:
        Stack();
        void push(T x);
        void pop();
        T top() const;
        ~Stack();
}

Stack<int> sInts;        //Template specialization
sInts.push(1);
int x = sInts.top();

Stack<Expression*> sExpr;
sExpr.push(new BinExp());
```

Takes the type and duplicates it.

```cpp
//Template for our iterator class;
template <typename T> class List {
    struct Node {
        T data;
        Node *next;
    }
    Node *theList = nullptr;
    public:
        class Iterator {
            Node *curr;
            explicit Iterator() {...};
            public:
                T &operator*() {}
                Iterator &operator++() {}
                bool operator!=() {}
                friend class List<T>;
        }; //end of Iterator class
        T ith(int index) {}
        void addToFront(const T &n) {}
} // end of List<T> class
```

```cpp
List<int> l;
l.addToFront(1);

List<List<int>> l2;
l2.addToFront(l);

for(auto m : l2) {
    for (auto n : m) {
        cout << n << endl;
    }
}
```

**STL: Standard Template Library**

**Dynamic Length Arrays**
```cpp
#include <vector> 
    // - guaranteed to be implemented as an array
    // - automatically resizes
```

```cpp
#include <vector>

using namepsace std;

int main() {
    vector<int> v{4,5};   //stack allocated. A heap array was created behind the scenes.
    v.emplace_back(6);    //[4, 5, 6]
}

vector<int> v(4,5);    // create an array of 4 elements, each of them being valued at [5, 5, 5,5];

//Three waya to write a for ... loop;
for (int i = 0; i < v.size(); ++i) {
    cout<< v[i] << endl;       //overloading the [] (square bracket operator);
}

for (vecctor<int>::iterator it = v.begin(); it != v.end(); ++it) {
    
}

for (auto m : v) { ... }

for (vector<int>::reverse_iterator it = v.rbegin(); it != v.rend(); ++it)    //rbegin() != v.end()

for (auto it = v.rbegin(); ....) { ... }
```

Highly recommended to read the vector reference

```cpp
v.pop_back(); //removing the last
```

The STL makes a lot of use of iterators.
    eg. vector::erase takes an iterator as a parameter

```cpp
v.erase(v.begin());    // removes the first element
```

This is an O(n) operation.
    - returns an iterator to the next element after the one just erased.
    
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Assignment 4 prohibits you from using heap arrays.
```cpp
new Abc[];
```

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

In C++, v[i] is accessing the ith element of the array.
This is an unchecked access in C++.
    - unchecked access
    - program does not check if it is within bounds.
Accesssing out of bounds behaviour is undefined.

`v.at(i)` is called the checked access. (Apparently Java uses checked access to begin with)

**Q. What happens if the argument to at() is not in range?**

**Ans. Exception thrown/raised.**

**C++ Exceptions **
```cpp
client code

vector<int> v;
v.at(i); // -> vector::at } ERROR
```

**Q. How should vector::at report the error to the client?**

In C, 
    - return an errvalue        // -1
    - set a global error variable eg. errno
    Bad
    - awkward to code with `if stmts`
    - programmers are lazy
        - error might go undetected

You are to stop being lazy right of the bat