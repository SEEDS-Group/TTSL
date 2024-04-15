# Parameters

_Parameters_ define the expected inputs of some declaration that can be [called][calls]. We refer to such declarations as _callables_. We distinguish between

- [required parameters](#required-parameters), which must always be passed, and
- [optional parameters](#optional-parameters), which use a default value if no value is passed explicitly.

## Required Parameters

_Required parameters_ must always be passed when the declaration is [called][calls]. Let us look at an example:

```ttsl
requiredParameter: Int
```

Here are the pieces of syntax:

- The name of the parameter (here `#!ttsl requiredParameter`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!Tsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the parameter (here `#!ttsl Int`).

## Optional Parameters

_Optional parameters_ have a default value and, thus, need not be passed as an [argument][calls] unless the default value does not fit. Here is an example:

```ttsl
optionalParameter: Int = 1
```

These are the syntactic elements:

- The name of the parameter (here `#!ttsl optionalParameter`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!Tsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the parameter (here `#!ttsl Int`).
- An equals sign.
- The default value of the parameter (here `#!ttsl 1`). This must be a constant expression, i.e. something that can be evaluated by the compiler. Particularly [calls][calls] usually do not fulfill this requirement.

## Complete Example

Let us now look at a full example of a [function][functions] called `#!ttsl doSomething` with one [required parameter](#required-parameters) and one [optional parameter](#optional-parameters):

```ttsl
function doSomething(requiredParameter: Int, optionalParameter: Boolean = false) {
    // ...
}
```

The interesting part is the list of parameters, which uses the following syntactic elements:

- An opening parenthesis.
- A list of parameters, the syntax is as described above. They are separated by commas. A trailing commas is permitted.
- A closing parenthesis.

## Restrictions

Several restrictions apply to the order of parameters and to combinations of the various categories of parameters:

- After an [optional parameter](#optional-parameters) all parameters must be optional.


[calls]: expressions.md#calls
[types]: types.md
[functions]: functions.md
