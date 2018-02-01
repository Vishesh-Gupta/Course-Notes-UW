<h1>Lecture 9</h1>

February 01, 2018

<h2>Include Guards, C++ Classes</h2>

Last Time: 
<b>Seperate Compiations</b>

<bah>
#lecture/seperate/example3
</bash>
<br>
lectures/seperate/example4 includes Include Guard

<ol>
<li> All .h files should have an include guard
<li> Never compile .h files
<li> Never include .cc files
</ol>

Never put "using namespace std;" in header files.
In a header, file refer to std::string, std::istream & std::ostream etc. with their full names.

<b>C++ Classes</b>
Big OO Inovation: we can put functions inside a struct 

[Student Script](72a815fba67abe705740-774cdf15c04acfab5f5e)

:: is called the scope resolution operator.

Student:: int the scope of the student class there is a function.

In OOP a class is a struct type that can possibly contain functions.

<ul>
<li>C++ allows all struct to contain functions 
<li>C++ struct are classes
</ul>

An instance of a class is called an ovhect e.g. a value of type student is a Student object billy is an object.

A function inside a class is a `member function` or `method`.

A method can only be called sign an object of class. A method has access to the fields od the ovject on which the method was called.