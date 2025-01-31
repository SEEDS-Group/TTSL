# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_null_safe_indexed_access(receiver: Any, index: Any) -> __gen_T | None:
    return receiver[index] if receiver is not None else None

# Functions --------------------------------------------------------------------

def test(param1: list[int], param2: list[int]):
    x = param1[0]
    y = __gen_null_safe_indexed_access(param2, 0)

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'test': test}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = ['target1', 'target2'], functions = functions, params = params)