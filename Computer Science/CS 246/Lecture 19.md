# Lecture 19
March 15, 2018
## Partial/Mixed Assignment, Design Patterns
```cpp
Text a {};
Text b {};
Book *pa{&a};
Book *pb{&b};
*pa = *pb;    //causes partial assignment
```

Could we make `operator= `virtual?
    - must implement
```cpp
Text &Text::operator=(const Book &);    //casuses mixed assignment
```

```cpp
AbstractBook *pa1{&a};
AbstractBook *pb1{&b};
*pa1 = *pb2;            //won't compile
```



**Factor Method Pattern**

```cpp
Player *p = 
Level *l = 
Enemy *e = nullptr;
while (p->notDead()) {
    //generate enemy
    e = e->createEnemy();
    
    //attack player
}

class Level {
    public:
        virtual Enemy *createEnemy() = 0;
}

class Normal: public Level {
    Enemy *createEnemy() override {// more turtles here {they are easier to kill}}
}

class Castle: public Level {
    Enemy *createEnemy() override {// more bullets }
}
Thed
```

Also called the **Virtuall Constructor Pattern.**
    - Make ctor private or protected
    - Provide Factory method that creates the desired object
    eg. Lists::addToFront
          List::begin/ List::end

**Template Method Pattern**
Want to allow subclass to override some aspects of the superclass behaviour, bt other aspects must remain the same

UML - TMP
```cpp
class Turtle {
    public:
        void draw() {
            drawHead();
            drawShell();
            drawFeet();
        }
    private:
        void drawHead() {
            ...
        }
        void drawFeet() {
            ...
        }
        virtual void drawShell() = 0;
}

class RedTurtle : public Turtle {
    void drawShell() override {
        //red Shell
    }
}

class GreenTurtle : public Turtle {
    void drawShell() override {
        //green Shell
    }
}
```

**Non-Virtual Interface**
Think about __public virtual___ methods

public  ________  class provides a pre-defined behaviour.
virtual  ________ invitation to subclasses to change behaviour

We cannot guarantee the behaviour if subclasses can change that behaviour.

**NVI Idiom**
    - all public methods should be non-virtual (except dtor)
    - all virtual methods must be private.

```cpp
class DigitalMedia {
    public:
        virtual void play() = 0;
};    //Not following NVI

//Using NVI;
class DigitalMedia {
    public:
        void play() {
            doPlay();
        }
    private:
        checkCopyright();
        virtual void doPlay() = 0;
}
```

**STL Map class**
A map class is a generalization of an array where the key/index and the value can be of any type. (Key must support < opertator)

Tempate class parameterized on two types

```cpp
#include <map>
...
map<string, int> m;
m["abc"] =  1;
cout << m["abc"] << endl; //prints 1
cout << m["def"] << endl; //prints 0   -> default construct a value for the key "def"

//for lookup

if (m.count("def")) {
    //0 if no key/value pair exists
    //1 if found
}

//Another STL class multimap, we should look at it on our own time

m.erase("abc");
```

Surprise Surprise, an interator has been pre defined 

```cpp
for (auto &p : m) {
    // p has trype std::pair<string, int> it is a struct in the STL
    cout << p.first << p.second << endl // Notice first and second are fields not methods.
}
```

iteration in sorted key order.

**Visitor Design Pattern**
Used for __double dispathc___
Want to choose which method to call based on the runtime type of two objects

Enenemy (thats not how you spell an enemy) - Nomair
```cpp
void Enemy::strike(Rock &) = 0;
void Enemy::strike(Stick &) = 0;
```

This assumes the exact type of the weapon selected

Doesn't look like that in the gameplay
```cpp
Enemy *e = l->createEnemy();
Weapon*w = p->chooseWeapon();
e->strike(*w);
```
C++ does not dynamically dispatch on argument types

Visitor Design Pattern (V.D.P) is a clever combination of overrideing and overloading.
```cpp
class Enemy {
    public:
    virtual void strike(Weapon &) = 0;
};

class Turtle : public Enemy {
    void strike(Weapon &w) override {w.useOn(*this)};    //*this -> Turtle
}
class Bullet : public Enemy {
    void strike(Weapon &w) override {w.useOn(*this)};    //*this -> Bullet
}

//Code reuse is a very bad idea in this case. The parameter this has a known type

class Weapon {
    public:
        virtual void useOn(Turtle &) = 0;
        virtual void useOn(Bullet &) = 0;
}

class Stick : public Weapon {
    void useOn(Turtle &) override { //stick on turtle};
    void useOn(Bullet &) override { //stick on bullet};
};

class Rock : is similar to class Turtle
```

```cpp
Enemy *e = ...... //Assume it is a turtle
Weapon *w =  .... //Assume it is a stick
e->stick(*w);
```
