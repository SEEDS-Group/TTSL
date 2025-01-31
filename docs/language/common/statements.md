# Statements

TTSL supports a variety of statements which can be divided into the following categories:

- [Expression Statements](#expression-statements), which are used to evaluate expressions and perform operations while discarding the result.
- [Assignments](#assignments), which are used to assign values to variables.
- [Conditional statements](#conditional-statements), which are used to execute code based on conditions.
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
var alter = 60;
```

### Assigning Values

Variables that already have been [declared](#declaring-variables) can be assigned new values using the `=` operator. The value on the right side of the operator is assigned to the variable on the left side.

```ttsl
alter = 20;
```

This snippet overwrites the value of `alter` with `20`.

Similarly the result of a function can be assigned to a variable.

```ttsl
var alter = calculateAge();
```

## Conditional statements

Conditional statements are used to execute code based on conditions. A condition can be checked with the `if` keyword followed by a condition in parantheses. If the condition is true, the code block following the condition is executed.

```ttsl
if(alter < 0) {
    alter = 0;
}
```

In the example above, the value of `alter` is set to `0` if it is less than `0` because it is not possible to have a negative age.

It is also possible to add an `else` block to the `if` statement. The code block following the `else` keyword is executed if the condition is false.

```ttsl
if (alter > 17):
    erwachsen = true;
else:
    erwachsen = false;
```

In the example above, the value of `erwachsen` is set to `true` if the value of `alter` is greater than `17`. Otherwise, the value of `erwachsen` is set to `false`.

## Loops

TTSL supports three types of loops: `while`, `for` and `foreach`. Each one of them is used to execute code repeatedly.

### While Loop

The `while` loop has a similar syntax to the [conditional statements](#conditional-statements). The code block following the condition is executed as long as the condition is true.

```ttsl
while(budget > 10) {
    budget = budget - 10;
}
```

In the example above, the value of `budget` is decremented by `10` as long as it is greater than `10`.

### For Loop

The `for` loop is used to execute code a specific number of times. It consists of three parts: an initialization, a condition and an increment. The initialization is executed once at the beginning of the loop. The condition is checked before each iteration and the increment is executed after each iteration.

```ttsl
for(var month = 0; month < 10; month = month + 1) {
    earnings = earnings + 100;
}
```

In the example above, the value of `earnings` is incremented by `100` ten times.

### Foreach Loop

The `foreach` loop is used to iterate over a collection of elements. TTSL supports two kinds of collections:
[Lists][Lists] and [Dictionaries][Dictionaries].

<!--
    TODO: Links anpassen
-->
```ttsl
var monthly_expenses = [100, 50, 25, 75]

foreach(expense in monthly_expenses) {
    budget = budget - expense;
}
```

In the example above, the value of `budget` is decremented by each element in the list `monthly_expenses`.

[Lists]: types.md#Lists
[Dictionaries]: types.md#Dictionaries
[Call]: expressions.md#calls
[functions]: functions.md
