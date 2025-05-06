# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def impureFunction()->int:

    pass

def function1InSamePackage()->int:

    return impureFunction()

def function2InSamePackage()->int:

    return impureFunction()

# Simulation --------------------------------------------------------------------

dataFrame = pd.read_csv("dataFile.csv")

date = "2000-01-01"

functions = {'impureFunction': impureFunction, 'function1InSamePackage': function1InSamePackage, 'function2InSamePackage': function2InSamePackage}

params = {'context same package':{}}

aggregation_functions = {}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = dataFrame, targets = ['target1', 'target2'], functions = functions, params = params, aggregation_specs = aggregation_functions)