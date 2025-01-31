# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
from typing import Any, Callable, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_eager_or(left_operand: bool, right_operand: bool) -> bool:
    return left_operand or right_operand

def __gen_eager_and(left_operand: bool, right_operand: bool) -> bool:
    return left_operand and right_operand

def __gen_null_safe_call(receiver: Any, callable: Callable[[], __gen_T]) -> __gen_T | None:
    return callable() if receiver is not None else None

def __gen_eager_elvis(left_operand: __gen_T, right_operand: __gen_T) -> __gen_T:
    return left_operand if left_operand is not None else right_operand

# Functions --------------------------------------------------------------------

def f(param):
    pass

def g()->bool:
    pass

def h()->int:
    pass

def i()->int:
    pass

def test():
    f(__gen_eager_or(g(), g()))
    f(__gen_eager_and(g(), g()))
    f((h()) == (h()))
    f((h()) != (h()))
    f((h()) is (h()))
    f((h()) is not (h()))
    f((h()) < (h()))
    f((h()) <= (h()))
    f((h()) >= (h()))
    f((h()) > (h()))
    f((h()) + (h()))
    f((h()) - (h()))
    f((h()) * (h()))
    f((h()) / (h()))
    f(__gen_eager_elvis(__gen_null_safe_call(i, lambda: i()), __gen_null_safe_call(i, lambda: i())))

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'g': g, 'h': h, 'i': i, 'test': test}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = ['target1', 'target2'], functions = functions, params = params)