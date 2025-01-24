# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def function1InDifferentPackage()->int:
    pass

def function2InDifferentPackage()->int:
    pass

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'function1InDifferentPackage': function1InDifferentPackage, 'function2InDifferentPackage': function2InDifferentPackage}

params = {'context different package':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)