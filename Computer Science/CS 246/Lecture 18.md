# Lecture 18
March 13, 2018
## Design Patterns, Big 5 (Revisited)
**Last Time: Observer Pattern**

[UML Observer pattern]()

```cpp
class Subject {
    vector<Observer *> observer;
    public:
        void attach(Observer *o) { ... }
        void detach(Observer *o) { ... }
        void notifyObserver() {
            for (auto &o : observer) {
                o..notify();
            }
        }
        virtual ~Subject() = 0;
};
```

We want the subject to be abstract 
    - no obvious Pure Virtual method
    - make the dtor Pure Virtual

**Problem: **The dtor of the subclass of Subject will call the base classs' dtor.

**Solution: **Implement Subjects' dtor.

```cpp
//In subject.cc
Subject::~Subject(){}
```

A pure virtual must be implemented by a subclass for it to be concrete.

```cpp
class Observer {
    public:
        virtual void notify() = 0;
        virtual ~Observer() {}
};
```

**Decorator Pattern**
The idea is that you have an object with some behaviour. While the program is running we want to add to the behaviour of that object.

Decorator `HAS - A`component
Decorator `IS - A` component

```cpp
Window *w = new BasicWindow{};
w = new Menu{w};
w = new Scroll{w};
```

Decorator Pattern: add/enhance behaviour to an existing object at the runtime

**Big 5 Revisited**
```cpp
class Book {
    ...
};
class Text : public Book {
    ...
};

Text b{"TheFlu", "Nomair", 50, "Medicine"};
Text c = b;
```

Calls Text's copy ctor
    - remember you get one for free
Default copy ctor calls Books' copy ctor & then copy the topic field

```cpp
Text::Text(const Text &other) : Book{other}, Topic{other.topic}{}
```

Assignment operator for Text : assign the Book part, then the subclass fields

```cpp
Text &Text::operator=(const Text &other) {
    Book::operator=(other);
    topic=other.topic;
    return *this;
}

//Move Ctor
Text::Text(Text &&other) : Book{other}, topic{other.topic}{}    //They are incorrect
//The code above is correct in the sense it won't crash but it is copying not stealing
```
How to check? If they look the same copy and move it is wront.

ASIDE:
```cpp
int *p = ...
p is a pointer
p is an lvlalue
```

other is an rvalue reference
    - constant pointer to a rvalue
    - other is an lvalue

The above code was copying but not stealing

Need a way to treat an lvalue as an rvalue C++ std library implements std::move allows treating an lvalue as an rvalue.

```cpp
Text::Text(Text &&other) : Book{std::move(other)}, topic{std::move(other.topic)} {};

Text &Text::operator=(Text &&other) {
    Book::operator=(std::move(other));
    topic  std::move(other.topic);
    return *this;
}
```

More on operator=
```cpp
Text b1{"TheFlu", "Nomair", 50, "Medicine"};
Text b2{"C++ISEasy", "Brad", 500, "CS"};
Book *pb1 = &b1;
Book *pb2 = &b2;
*pb1 = *pb2;    //object assignment through ptrs
Book::operator= runs (non virtual)
```

b1 becomes "C++IsEasy", "Brad", 500, "Medicine"

Partial Assignment Problem: only Book part is assigned

Possible Solution: makes operator=virtual?

```cpp
class Book {
    ...
    public:
        virtual Book &operator(const Book &other)
};

class Text : public Book {
    ...
    public:
        Text &operator=(const ~~Text~~ Book &other) override {
            ...
        }
}   
//Does not compile as the parameters don't match
//    - Change parameter to Book
//        - makes it a valid override
```

Problem: But not all Books are Texts! This is called a mixed assignment problem

Mixed assignment problem   
    -will fix later
    
Alternate Solution
    Disable assignment through base class ptrs
        - could make books assignment operator private    //won't  compile as the subclass don't get access to it)
            - hence make it protected
But book is not abstract: will never be able to assign one book to another
(My hierarchy to begin with, poor design)

Make an abstract base class with protected assignment operator


