# Statements

TTSL supports a variety of statements which can be divided into the following categories:

- [Expression Statements](#expression-statements), which are used to evaluate expressions and perform operations while discarding the result.
- [Assignments](#assignments), which are used to assign values to variables.
- [Conditional Expressions](#conditional-expressions), which are used to execute code based on conditions.
- [Loops](#loops), which are used to execute code repeatedly.

## Expression Statements

Expression Statements are Expressions like [function calls][Call] that just execute the function without returning a return value.

First, we show the code of the [function][functions] that we want to call.

```ttsl
function f(x: Int = 1){
    // ... do something ...
}
```

The [call][Call] for this function would either be `#!ttsl f();` or with another parameter instead of the default parameter `#!ttsl f(5)`.

## Assignments

In an assignment a statement is evaluated to assign the result to a variable.

### Declaring Variables

Variables can be declared using the `var` keyword. The type of the variable is inferred from the assigned value. It is also possible to give the variable a value at the time of declaration using the `=` sign. After decleration and assignment, the variable can be used as a placeholder for the value it stores.

```ttsl
var x = 10;
```

### Assigning Values

Variables that already have been [declared](#declaring-variables) can be assigned new values using the `=` operator. The value on the right side of the operator is assigned to the variable on the left side.

```ttsl
x = 20;
```

This snipped overwrites the value of `x` with `20`.

Similarly the result of a function can be assigned to a variable.

```ttsl
y = f();
```

## Conditional Expressions

Conditional expressions are used to execute code based on conditions. A condition can be checked with the `if` keyword followed by a condition in parantheses. If the condition is true, the code block following the condition is executed.

```ttsl
if(x > 10) {
    x = 10;
}
```

In the example above, the value of `x` is set to `10` if it is greater than `10`.

It is also possible to add an `else` block to the `if` statement. The code block following the `else` keyword is executed if the condition is false.

```ttsl
if(x > 10) {
    x = 10;
} else {
    x = 0;
}
```

In the example above, the value of `x` is set to `10` if it is greater than `10`, otherwise it is set to `0`.

## Loops

TTSL supports three types of loops: `while`, `for` and `foreach`. Each one of them is used to execute code repeatedly.

### While Loop

The `while` loop has a similar syntax to the [conditional expressions](#conditional-expressions). The code block following the condition is executed as long as the condition is true.

```ttsl
while(x > 0) {
    x = x - 1;
}
```

In the example above, the value of `x` is decremented by `1` as long as it is greater than `0`. As a result we can expect `x` to be `0` after the loop is finished.

### For Loop

The `for` loop is used to execute code a specific number of times. It consists of three parts: an initialization, a condition and an increment. The initialization is executed once at the beginning of the loop. The condition is checked before each iteration and the increment is executed after each iteration.

```ttsl
for(var i = 0; i < 10; i = i + 1) {
    x = x + 1;
}
```

In the example above, the value of `x` is incremented by `1` ten times.

### Foreach Loop

The `foreach` loop is used to iterate over a collection of elements. TTSL supports two kinds of collections:
[Lists][Lists] and [Dictionaries][Dictionaries].

<!--
    TODO: Links anpassen
-->
```ttsl
foreach(element in List) {
    element = element + 10;
}
```

In the example above, each element in the list is incremented by `10`.

[Lists]: types.md#Lists
[Dictionaries]: types.md#Dictionaries
[Call]: expressions.md#calls
[functions]: functions.md
