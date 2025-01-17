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

def myFunction():
    x = 0
    if "1999-01-01" <= date < "2000-01-01":
        x = 1

    if "2000-01-01" <= date :
        x = 2



# Constants --------------------------------------------------------------------

myConstantDict = {"s2000-01-01": 1, "s2001-01-01": 2}
myConstant = __gen_ClassConstants(myConstantDict)

myConstant2Dict = {"s1999-01-01": 0, "s2001-01-01": 0, "s2003-01-01": True}
myConstant2 = __gen_ClassConstants(myConstant2Dict)

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'myFunction': myFunction}

params = {'input':{'myConstant': myConstant.getValue(date), 'myConstant2': myConstant2.getValue(date)}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)