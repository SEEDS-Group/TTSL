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
    z = 0
    if "1999-01-01" <= date < "2000-01-01":
        z = (a) + (x.getValue(date))

    if "2000-01-01" <= date < "2003-02-01":

        return x.getValue(date)
    if "2003-02-01" <= date < "2023-01-01":

        return 2
    return z

# Constants --------------------------------------------------------------------

x = __gen_ClassConstants({"empty": 2})

# Simulation --------------------------------------------------------------------

date = "2000-05-01"

functions = {'f': f}

params = {'main':{'x': x.getValue(date)}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("C:\\Users\\tatam\\Documents\\Uni\\Bachelor\\TTSL\\packages\\ttsl-cli\\tests\\resources\\commands\\data.csv"), targets = ['f'], functions = functions, params = params)