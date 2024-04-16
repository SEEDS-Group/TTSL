# Comments

Comments are mostly used to add explanations to the code for future readers — which is often yourself. They can also be
used to "comment out" code that you want to keep but that should not be run right now, since comments are ignored by the
compiler.

TTSL has two types of comments, namely

* [_line comments_](#line-comments), which end at a linebreak, and
* [_block comments_](#block-comments), which can cover multiple lines.
* [_documentation comments_](#documentation-comments), which are used to document declarations.

## Line Comments

Line comments stop at the end of a line:

```ttsl
# This is a comment.
```

They start with `#!ttsl #`. Everything after the # in the same
line is the text of the comment.

To use line comments to "comment out" code you edit in VS Code, select the code and press ++ctrl+slash++ on your
keyboard. This will add `#!ttsl #` to the beginning of each selected line. You can also trigger this functionality by
using the `Toggle Line Comment` command in the command palette. To remove the line comments, select the commented code
and press ++ctrl+slash++ again.

## Block Comments

Block comments have a start and end delimiter, which allows them to cover multiple lines:

```ttsl
/*
This
is
another
comment
*/
```

They start with `#!ttsl /*` and end at the inverted delimiter `#!ttsl */`. There must be no space between the slash
and the star. Block comments cannot be nested. Everything in between the delimiters is the text of the comment.

To use block comments to "comment out" code you edit in VS Code, select the code and press ++ctrl+shift+slash++ on your
keyboard. This will surround the selected code with `#!ttsl /*` and `#!ttsl */`. You can also trigger this functionality
by using the `Toggle Block Comment` command in the command palette. To remove the block comment, select the commented
code and press ++ctrl+shift+slash++ again.

## Documentation Comments

Documentation comments are special [block comments](#block-comments) that are used to document declarations[^1]. The
documentation is used in various places, e.g. when hovering over a declaration or one of its usage in VS Code. Here is
an example:

```ttsl
/**
 * This is a documentation comment.
 */
function f() { ...
```

They start with `#!ttsl /**` and end with `#!ttsl */`. There must be no spaces inside the delimiters. Documentation
comments cannot be nested. Everything in between the delimiters is the text of the comment, except an optional leading
asterisk in each line, which is ignored. Documentation comments are attached to the declaration that follows them. If
there is no declaration following the documentation comment, it is treated as a normal [block comment](#block-comments),
with no special meaning.

### Markdown

Documentation comments support [Markdown](https://www.markdownguide.org/) to format the text. Here is an example:

```ttsl
/**
 * This is a documentation comment with **bold** and *italic* text.
 */
function f() { ...
```

### Tags

Documentation comments can contain tags to provide structured information.

#### `{@link}`

`{@link}` is an **inline** tag that can be used to link to another declaration. It takes the name of the declaration as
an argument:

```ttsl
/**
 * Computes the sum of two {@link Int}s.
 */
function sum(x: Int, y: Int): Int { ...
```

#### `@param`

Use `@param` to document a [parameter](function.md) of a callable declaration. This tag takes the name of the parameter
and its description as arguments. Since a callable can have multiple parameters, this tag can be used multiple times.

```ttsl
/**
 * ...
 *
 * @param x The first integer.
 * @param y The second integer.
 */
function sum(x: Int, y: Int): Int { ...
```

#### `@result`

Use `@result` to document a [result](functions.md) of a callable declaration. This tag takes the name of the result and its
description as arguments. Since a callable can have multiple results, this tag can be used multiple times.

```ttsl
/**
 * ...
 *
 * @result sum The sum of `x` and `y`.
 */
function sum(x: Int, y: Int): Int { ...
```

#### `@since`

The `@since` tag can be used to specify when a declaration was added. It takes the version as argument and should be
used only once.

```ttsl
/**
 * ...
 *
 * @since 1.0.0
 */
function sum(x: Int, y: Int): Int { ...
```

[^1]: Except [parameter](function.md) and [results](functions.md), which are documented with
the [`@param`](#param) and [`@result`](#result) tags on the containing declaration,
respectively.
