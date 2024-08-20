# Imports ----------------------------------------------------------------------

from typing import Any, Callable, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_null_safe_call(receiver: Any, callable: Callable[[], __gen_T]) -> __gen_T | None:
    return callable() if receiver is not None else None

# Functions --------------------------------------------------------------------

def f(param):
    pass

def g(param1, param2=0):
    pass

def h(param1, param2=0):
    pass

def i(param):
    pass

def test():
    f(g(1, param2=2))
    f(g(2, param2=1))
    f(h(1, param2=2))
    f(h(2, param2=1))
    f(h(2))
    i("abc")
    __gen_null_safe_call(f, lambda: f(g(1, param2=2)))
    __gen_null_safe_call(f, lambda: f(g(2, param2=1)))
    __gen_null_safe_call(f, lambda: f(h(1, param2=2)))
    __gen_null_safe_call(f, lambda: f(h(2, param2=1)))
    __gen_null_safe_call(f, lambda: f(h(2)))
    __gen_null_safe_call(i, lambda: i("abc"))

