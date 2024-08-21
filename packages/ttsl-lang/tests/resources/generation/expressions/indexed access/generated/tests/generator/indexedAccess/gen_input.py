# Imports ----------------------------------------------------------------------

from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_null_safe_indexed_access(receiver: Any, index: Any) -> __gen_T | None:
    return receiver[index] if receiver is not None else None

# Functions --------------------------------------------------------------------

def test(one, two):
    x = one[0]
    y = __gen_null_safe_indexed_access(two, 0)

