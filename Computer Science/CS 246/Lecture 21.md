# Lecture 21

March 22, 2018

## Exception Safety

```cpp
void f() {
	MyClass *p = new MyClass;
	MyClass mc;		// The class was held in MC
	g();			//g does not leak memory
	delete p;
}
```

if g throws an exception, then delete p is never executed. f leaks memory

Want to write exception safe code (Which means not not to use exceptions)
	- Exceptions are meant to be recovered from
	- exceptions should not cause memory leaks, dangling ptrs, broken class invariants

In C++, we are provided the following guarantee
**C++ Exception Guarantee**
	- During stack unwinding all stack allocated memory is reclaimed (dtors run)
	- Nothing about heap memory
		- ptr p leaks, but mc is reclaimed

Given a ptr, the program shouldn't (on its own) call delete on it.

Re-factor the code:
```cpp
void f() {
	MyClass *p = new MyClass;
	try{
		MyClass mc;
		g();
	}
	catch(...){
		delete p;
		throw;
	}
	delete p;
}
```

Writing such code is tedious / error prone

We would like the ability to run some code irrespectively of whether an exception has occurred or not.

* Java has "finally"
* Scheme has dynamic-wind

C++ has neither. We don't need anything because C++ has Exception Guarantee

C++ only has a guarantee for stack objects.
1. Maximize your use of stack
2. Q. But what if you do need to use the heap?

**C++ Idiom: RAII** (made by Bjarne Stroustrup)
RAII stands for Resource Acquisition Is Initialization.

Every resource should be wrapped within inside a stack allocated object whose dtors job is to free the resource.

We have been talking about it since second lecture of C++. 

```cpp
{
	ifstream f{"hello.txt"};	//file is opened/acquired
}	<- dtor runs -> releasing the file
```

Heap memory is a resource!!
Idea: wrap the heap object within a stack object.
The stack destructor obj's dtor will delete the heap object.

C++ standard library provides a template class.
```cpp
Unique_ptr<T>
```
	- ctor takes a ptr if type T
	- dtor calls delete on the given ptr

The unique_ptr object can be treated exactly like the ptr to the heap object. 
	- can use \*, -> (overloaded)

```cpp
#include <memory>

void f() {
	std::unique_ptr<MyClass> p{new MyClass};	//auto p = std::make_unique<MyClass>(<args to my class ctor(if any)>); (Recommended) 
}
```