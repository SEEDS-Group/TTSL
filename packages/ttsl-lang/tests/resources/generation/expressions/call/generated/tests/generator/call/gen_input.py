# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
from typing import Any, Callable, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_null_safe_call(receiver: Any, callable: Callable[[], __gen_T]) -> __gen_T | None:
    return callable() if receiver is not None else None

# Functions --------------------------------------------------------------------

def f(param: bool):
    pass

def g(param1: int, param2: int = 0)->bool:
    pass

def h(param1: int, param2: int = 0)->bool:
    pass

def i(param: str):
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

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'g': g, 'h': h, 'i': i, 'test': test}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = ['target1', 'target2'], functions = functions, params = params)