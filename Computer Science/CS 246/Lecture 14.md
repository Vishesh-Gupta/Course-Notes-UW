# Lecture 14
February 27, 2018
## System Modelling
It is a good idea to sketch out a design before you code.

**Designing a Program**
    - identify key entities /classes
    - relationship between classes    // this is the most important thing.

**UML **:** **which stands for Unified Modelling Language.

A class in UML.
A box with three sections.

**Relatioship 1: Composition**
```cpp
class Vec {
    int x, y;
    public:
        Vec(int x, int y) : x{x}, y{y} {}
};
```

```cpp
class Basis {
    Vec v1, v2;
}

Basis b; //won't compile as Vec does not have a default ctor
```

To compile it
1. Provide a ctor
2. Use the MIL to call a non-default ctor
```cpp
Basis::Basis() : v1{1,0}, v2{0,1} {};
Basis b; //would compile
```

Embedding an object within an object is called composition.
This is called `OWNS-A` relationship.

Basis is a OWNS-A relationship

If A OWNS-A B then, typically,
    1. B has identity/existence outside A
    2. If A is destroyed B is destroyed.
    3. If A is copy, then B is copied

Car OWNS-A Wheels
UML

**Relatioship 2: Aggregation**
Parts in a Catalog
Catalog `HAS-A` parts
If A HAS-A B, then typically
    1. B exists independently of A
    2. Destroying A does not destroy B.
    3. Copying A does not copy B. (Shallow Copy)

```cpp
class Catalog {
    Parts *parts[100];
};
```

eg. Ducks in pool
UML

**Realtionship 3: Inheritence**
The classes don't capture any relationships between Book, Text, Comic

**Q.  How do you create an array that can hold all these?**
    1. Array of void *
    2. array of `union` type
    very make line a struct.
```cpp
UNION Booktype {
    Book *b;
    Comic *c;
    Text *t;
}

Booktype books[100];
```

Text is a book with a topic field
Comic is a Book with a hero field
UML

```cpp
class Book {
    String title, author;
    int numPages;
    public:
        Book(string t, string a, int n) : title{t}, author{a}, numPages{n} {}
};
        
class Text :  public Book {
    string topic;
};
```

A derived class inherits all the members the members of a base class .
Any method that you can call on a book object, you can also call on a Text/Object.

Anything you can do with istream, you can do with istringstream.
    eg.  it is because of inheritence.
        istring stream/ifstream behaviour like istream object.
        
**Inheriting Privagte Members**
Text has inherited private titlle, author, numPages
UML

```cpp
int main() {
    Text t;
    t.author = _____;    //author is private
}
```

Private really does mean private to class. 

```cpp
Text::Text(string t, string a, int n, string topic) : title{t}, author{a}, numPages{n}, topic{topic} {};
//Won't compile
```

1. title, author, numpages are private in Book.
2. MIL can nlly refer to fields that were declared in the class.
3. Object construction
    a) allocate space
    b) default ctor the fields     (Super class part is constructed)
    c) field initializes or MIL
    d) ctor body runs

In Step 2, the book part must be default ctor.
    - but there is no default ctor 
Option 1. provide default ctor
              2. call non-default ctor in MIL
```cpp
Text::Text(string t, string a, string topic) : Book{t, a, n}, topic{topic} {};
```

**Visibility Modifier : Protected**
    - a protected member is accessible by a class & all of its subclasses
    - breaks encapsulation.
        - comes down to invariants
        - a sub class may end up breaking the base class invariant

**ADVICE: Keep fieldds private, give protected accessors/mutators**

```cpp
class Book {
    string author;
    protected: 
        void AddAuthor(string a) {author += a;}
};

class Text : public Book {
    addAuthor();
};

int main() {
    Text = ____;
    t.addAuthor(Text);
}
```
