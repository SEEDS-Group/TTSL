# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers)
import pandas as pd
import numpy as np
from typing import TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_aggregation(data: str, id: str, function: str):
    aggregation_functions.update({function + "_" + data + "_" + id: {'source_col': data, 'aggr': function}})

# Functions --------------------------------------------------------------------

def myFunction(myID_id: int, myData: int, ):

    x = __gen_aggregation('myData', 'myID', 'sum')

# Simulation --------------------------------------------------------------------

dataFrame = pd.read_csv("dataFile.csv")

date = "2000-01-01"

functions = {'myFunction': myFunction}

params = {'input':{}}

aggregation_functions = {}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = dataFrame, targets = ['target1', 'target2'], functions = functions, params = params, aggregation_specs = aggregation_functions)