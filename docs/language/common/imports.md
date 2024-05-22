# Imports

By default, only declarations in the same package as the current file or in a package whose name starts with `ttsl` [package][packages] are accessible. All other declarations must be imported first.

TTSL has two kinds of imports, namely a _qualified import_, which imports a single declaration, and a _wildcard import_, which imports everything in a [package][packages].

## Qualified Imports

A _qualified import_ makes a single declaration available. Here is an example that imports the ExampleDeclaration in the [package][packages] `ttsl.example`:

```ttsl
from ttsl.example import ExampleDeclaration
```

The syntax consists of the following parts:

- The keyword `from`.
- The name of the [package][packages] that contains the declaration (here `ttsl.example`).
- The keyword `import`.
- The name of the declaration (i.e. `ExampleDeclaration`).

Once the declaration is imported, we can refer to it by its name.

Multiple declarations can be imported from the same package in a single import statement by separating them with commas:

```ttsl
from ttsl.example import ExampleDeclaration1, ExampleDeclaration2
```

### Qualified Imports with Alias

Sometimes the name of the imported declaration can conflict with other declarations that are imported or that are contained in the importing file. To counter this, declarations can be imported under an alias:

```ttsl
from ttsl.example import ExampleDeclaration as TtslExampleDeclaration
```

Let us take apart the syntax:

- The keyword `#!ttsl from`.
- The name of the [package][packages] that contains the declaration (here `ttsl.example`).
- The keyword `#!ttsl import`.
- The name of the declaration (i.e. `ExampleDeclaration`).
- The keyword `#!ttsl as`.
- The alias to use (here `TtslExampleDeclaration`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number.

Afterwards, the declaration can **only** be accessed using the alias.

Multiple declarations can be imported with or without an alias in a single import statement by separating them with commas:

```ttsl
from ttsl.example import ExampleDeclaration1 as TtslExampleDeclaration1, ExampleDeclaration2
```

## Wildcard Imports

We can also import all declarations in a [package][packages] with a single import. While this saves some typing, it also increases the likelihood of name conflicts and can make it harder for readers of the code to determine where a declaration comes from. Therefore, this should be used with caution.

Nevertheless, let us look at an example, which imports all declarations from the [package][packages] `#!ttsl ttsl.example`:

```ttsl
from ttsl.example import *
```

Here is the breakdown of the syntax:

- The keyword `#!ttsl from`.
- The name of the [package][packages] to import (here `#!ttsl ttsl.example`).
- The keyword `#!ttsl import`.
- A star.

Afterward, we can again access declarations by their simple name.

[Aliases](#qualified-imports-with-alias) cannot be used together with wildcard imports.

Note that declarations in subpackages, i.e. packages that have a different name but the same prefix as the imported one, are **not** imported. Therefore, if we would instead write `#!ttsl from ttsl import *`, we could no longer access the `#!ttsl ExampleDeclaration`.

[packages]: packages.md
