# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers)
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
        result = "no entry"
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

def myFunction()->int:

    x = 0
    for elm in list.getValue(date):
        x = (x) + (elm)
    return x

# Constants --------------------------------------------------------------------

list = __gen_ClassConstants({"empty": np.array([1, 2, 3])})

# Simulation --------------------------------------------------------------------

dataFrame = pd.read_csv("dataFile.csv")

date = "2000-01-01"

functions = {'myFunction': myFunction}

params = {'input':{'list': list.getValue(date)}}

aggregation_functions = {}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = dataFrame, targets = ['target1', 'target2'], functions = functions, params = params, aggregation_specs = aggregation_functions)