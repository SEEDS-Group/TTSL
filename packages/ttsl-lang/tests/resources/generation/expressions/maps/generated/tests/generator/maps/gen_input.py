# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def g2(param: dict[str, float]):
    pass

def g3(param: dict[float, str]):
    pass

def h1()->float:
    pass

def h2()->str:
    pass

def test():
    g2({"a": 1.2, "b": 1})
    g2({h2(): -(0.5), "b": h1()})
    g3({1.2: "a", 1: "b"})
    g3({5.6: "c", h1(): h2()})

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'g2': g2, 'g3': g3, 'h1': h1, 'h2': h2, 'test': test}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)