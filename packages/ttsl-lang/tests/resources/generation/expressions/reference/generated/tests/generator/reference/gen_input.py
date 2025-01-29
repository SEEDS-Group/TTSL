# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def f(param):
    pass

def explainModel()->int:
    pass

def test():
    f(explainModel())

def g(param: int):
    pass

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'explainModel': explainModel, 'test': test, 'g': g}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = ['target1', 'target2'], functions = functions, params = params)