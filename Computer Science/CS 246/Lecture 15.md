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

Object Slicing is not gonna occur if a subclass ovject is pointer to by a superclass pointer.

```cpp
Comic c{title, author, 40, "hero"}
Compic *cp = &c;     //Comic *cp{&c};
cout << cp->isHeavy()
```
