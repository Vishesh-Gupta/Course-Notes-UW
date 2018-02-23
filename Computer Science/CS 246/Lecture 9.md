#Lecture 9

February 01, 2018

#Include Guards, C++ Classes

Last Time: 

**Seperate Compiations**

```bash
#lecture/seperate/example3

lectures/seperate/example4 includes Include Guard


1. All .h files should have an include guard
2. Never compile .h files
3. Never include .cc files

Never put "using namespace std;" in header files.
In a header, file refer to std::string, std::istream & std::ostream etc. with their full names.

<b>C++ Classes</b>
Big OO Inovation: we can put functions inside a struct 

```cpp
//student.h
#ifndef _STUDENT_H_
#define _STUDENT_H
struct student {
  int assns, mt, final;
  Strudent (int assns, int mt, int final);
  float grade();
}

//student.cc
#include "student.h"
/*
float Student::grade(){
  return  assns*0.4 + mt*0.2 + final*0.4;
}
*/
float Student::grade(){  
  return this->assns*0.4 + this->mt*0.2 + this->final*0.4;
}

Student billy{80, 50, 75};
cout<<billy.grade()<<endl;


:: is called the **scope resolution operator**.

Student:: int the scope of the student class there is a function.

In OOP a class is a struct type that can possibly contain functions.

- C++ allows all struct to contain functions 
- C++ struct are classes

An instance of a class is called an ovhect e.g. a value of type student is a Student object billy is an object.

A function inside a class is a `member function` or `method`.

A method can only be called sign an object of class. A method has access to the fields od the ovject on which the method was called.

All methods have a hidden parameter -> name is "this", which points to the object on which the method was called.

billy.grade() inside grade this == &billy

I like to use `this` when I need to use `this` - Nomair Naeem.

this is a contant pointer

**Initializing objects**

Student billy{80, 50, 75} where these values need to be compile time constants.

In C++, you can write special methods called constructors to initialize objects.

