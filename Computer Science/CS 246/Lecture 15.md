# Lecture 15
March , 2018
## Method Overriding, Virtual

Want to define a kind of book `isHeavy`.
    Book > 200
    Text > 500
    Comic > 30

```cpp
class Book {
    int numPages;
    public:
        int get Pages() const {return numPages;}
        bool isHeavy() const {return numPages > 200;}
}

class Text : public Book {                                 //Same for Libraries
    public:
        bool isHeavy() const {return getPages() > 500;}    //method overloading
}

Book b{title, author, 50};
cout << b.isHeavy() << endl; //Book::isHeavy() returns false
Comic c{title, author, 40, "heroes"};
cout << c.isHeavy() << endl; //Comic::isHeavy() returns true
Book b1 = Comic {title, author, 40, "hero"};
cout << b1.isHeavy() << endl; //will compile, Book::isHeavy runs
```

Method Overloading: replacing the implementation of an inherited method.

If a subclass object is placed in a superclass variable, the objects is sliced. This is called object slicing. This is also known as Object Coercion (other professor uses it, I do not even know if I spelt it right).

Object Slicing is not gonna occur if a subclass object is pointer to by a superclass pointer.

```cpp
Comic c{title, author, 40, "hero"}
Compic *cp = &c;          //Comic *cp{&c};
cout << cp->isHeavy();    //Comic::isHeavy runs, true
Book *bp = {&c};          //Book *bp{&c}; Comic IS-A Book
cout << bp->isHeavy();    //Book::isHeavy() runs, false
```

The comic object only acts as a comic pointer if a comic pointer points to it.

The compiler looks at the declatred type of the pointer and decides which method to run.

But most of the time this is not what we want. 
```cpp
Book *myCollection[100];
for (...) {
    cout << myCollection[i]->isHeavy();
}
```

I want the "most specific" isHeavy function to run.

Make isHeavy virtual
```cpp
class Book {
    ...
    public:
    virtual bool isHeavy() const {...};
}

class Comic : public Book {                // Same in Text
    ...
    public:
    bool isHeavy() const overrride {...};
}
```

Suppose while writing the override you forgot it, then it won't compile.

```cpp
Comic c{title, authors, 40, "hero"};
Comic *cp{&c};
Book *bp{&c};
Book &rb{c};
cout << cp->isHeavy();    //Comic::isHeavy() runs
cout << bp->isHeavy();    //Comic::isHeavy() runs
cout << rb.isHeavy();     //Comic::isHeavy() runs
```

**Virtual: **
The method to call is chosen while the program is running using the run time type of the object.
    - DYNAMIC DISPATCH: Abitlity of OOP to deicde which method to run on run time type of object not the declared type of the object.
    - it has added run-time cost.
    
C++ default is STATIC DISPATCH

```cpp
Book *bp;
if () bp = &c;
else bp = &t;
Book *myBooks[100];
...    //Store Books/Comics/Texts

for(int i = 0; i < 100; ++i) {
    cout << myBooks[i]->isHeavy() << endl;
}     
```

The myBook array is called "polymorphism" array.

**Polymorphism**(multiple forms):  The ability of a container to accomadate multiple types.

```cpp
ostream &operator(ostream &out, const Vec &v) {    //ostream & is the polymorphic parameter
    cout<<v;
    ofstream file{};
    file<<v;
}
```

**Destructor (revisited)**

Object destruction is the reverse of object construction
    -  If a subclass obj is being destroyed
    1. subclass dtor runs
    2. fields of the subclass that are objects are destroyed
    3. destror the superclass part of the object
    4. space is released.
    
Whena subclass obj is destroyed it automatically calls the dtor of the superclass

```cpp
//c++/inheritence/exaample5

class X {
    int *x;
    public:
        X(int n) : X{new int[n]} {};
        ~X() {delete [] X;}
};

class Y : public X {
    int y;
    public:
        Y(int n, int m) : X{n}, y{new int[m]} {};
        ~Y() {delete [] y};
};

Y myY{10,20};
X *myX = new Y{10,20};    //Y IS-A X
delete myX;    //ccompiler calls ~X();
```

The Y destructor never runs, thus y is leaked.

Make the base class dtor virtual.
    - it makes all subclass dtors virtual as well.

Always make the base class dtor virtual ever if the dtor body is empty.
If a class will never be the base class, i.e, never be subclassed, make the class *final*
```cpp
class Y final : public X {
    ...
}    //Y is a final class

class Z : public Y {}     //won't compile
```

{C++ gotta love it}

final and override at certain places are keywords

![Virtual Class UML](/L15-2.mdj)
