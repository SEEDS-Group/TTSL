# Comments

Comments are mostly used to add explanations to the code for future readers — which is often yourself. They can also be
used to "comment out" code that you want to keep but that should not be run right now, since comments are ignored by the
compiler.

TTSL has three types of comments, namely

* [_line comments_](#line-comments), which end at a linebreak, and
* [_block comments_](#block-comments), which can cover multiple lines.

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

