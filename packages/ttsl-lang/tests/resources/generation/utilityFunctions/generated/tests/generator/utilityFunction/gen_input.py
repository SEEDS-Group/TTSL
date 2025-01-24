# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_len(list):
    return len(list)

def __gen_keys(dict):
    return list(dict.keys())

def __gen_values(dict):
    return list(dict.values())

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

def testFunction():
    x = __gen_len(testList)
    y = __gen_keys(testDict)
    z = __gen_values(testDict)

# Constants --------------------------------------------------------------------

testList = __gen_ClassConstants({"empty": np.array([1, 2, 3])})

testDict = __gen_ClassConstants({"empty": {"a": 1, "b": 2, "c": 3}})

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'testFunction': testFunction}

params = {'input':{'testList': testList.getValue(date), 'testDict': testDict.getValue(date)}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)