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
	std::unique_ptr<MyClass> p{new MyClass};  //auto p = std::make_unique<MyClass>(<args to my class ctor(if any)>); (Recommended) 
	MyClass mc;
	g();
}
```

```cpp
unique_ptr<c> p{new c}; //auto p = std::make_unique<c>();
unique_ptr<c> q = p;	//copy ctor
```

Copying operations are disabled for unique_ptr. Move still works (Stealing still is acceptable in C++ society).

```cpp
template <typename T> class unique_ptr {
		T *ptr;
	public:
		unique_ptr(T *p) : ptr{p} {};
		~unique_ptr() {
			delete ptr;
		}
		unique_ptr(const unique_ptr<T> &other) = delete;	//copy ctor
		unique_ptr<T> &operator=(const unique_ptr<T> &other) = delete;	//copy assignment operator
		unique_ptr<T>(const unique_ptr<T> &&other) : ptr{other.ptr} {
			other.ptr = nullptr;
		}			//move operator
		unique_ptr<T> &operator=(const unique_ptr<T> &&other) :  {
			using std::swap;
			swap(ptr, other.ptr);
			return *this;
		}

}
T &operator*() {return *ptr;}
T *operator->() {return ptr;}
```

```cpp
	std::shared_ptr
	void f() {
		auto p1 = make_shared<c>();
		if() {
			auto p2 = p1;	//copy ctor, both p1 and p2 are point to same heap object. Sharing it
			...
		}//p2 goes out of scope, dtor p2 runs
		...
		...
	}//p1 goes out of scope, dtor p1 runs, heap obj deallocated
```	

shared pointers use reference counting to keep track of how many ptrs point to the same object.


