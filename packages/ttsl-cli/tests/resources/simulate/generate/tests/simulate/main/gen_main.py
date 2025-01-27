# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def f(a: int):
    return a

def g(b: str):
    return b

# Simulation --------------------------------------------------------------------

date = "1999-05-01"

functions = {'f': f, 'g': g}

params = {'main':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("C:\\Users\\tatam\\Documents\\Uni\\Bachelor\\TTSL\\packages\\ttsl-cli\\tests\\resources\\simulate\\data.csv"), targets = ['f', 'g'], functions = functions, params = params)