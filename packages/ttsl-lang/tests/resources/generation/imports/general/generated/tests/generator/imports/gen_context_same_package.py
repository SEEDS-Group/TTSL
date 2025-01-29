# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
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

date = "2000-01-01"

functions = {'impureFunction': impureFunction, 'function1InSamePackage': function1InSamePackage, 'function2InSamePackage': function2InSamePackage}

params = {'context same package':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = ['target1', 'target2'], functions = functions, params = params)