# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

class __gen_ClassConstants():
    def __init__(self, dictionary: dict):
        self.dict = dictionary
    def getValue(self, date = None):
        keys = sorted(self.dict.keys())
        if(keys[0] == "empty"):
            return self.dict["empty"]
        for index, key in enumerate(keys):
            if key[0] == "s":
                if key.replace("s", "") <= date:
                    result = self.dict[key]
            if key[0] == "e":
                if date <= keys[len(keys)-1-index].replace("e", ""):
                    result = self.dict[keys[len(keys)-1-index]]
        return result

# Functions --------------------------------------------------------------------

def f(a: int, b: str):
    pass

def g()->int:
    pass

def test()->int:
    return x.getValue(date)

# Constants --------------------------------------------------------------------

xDict = {"s1999-01-01": 1, "s2000-01-01": 2, "s2003-01-01": 3}
x = __gen_ClassConstants(xDict)

y = __gen_ClassConstants({"empty": np.array([1, 2, 3, 4])})

z = __gen_ClassConstants({"empty": {"a": {"b": 1}, "c": {"d": 1}}})

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'g': g, 'test': test}

params = {'input':{'x': x.getValue(date), 'y': y.getValue(date), 'z': z.getValue(date)}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)