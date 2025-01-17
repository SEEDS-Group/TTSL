# Imports ----------------------------------------------------------------------

from tests.generator.differentPackage import function1InDifferentPackage, function2InDifferentPackage as g
from tests.generator.withPythonModule import function1InCompilationUnitWithPythonModule, function2InCompilationUnitWithPythonModule as h
from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def f(param):
    pass

def test():
    f(function1InSamePackage())
    f(function1InSamePackage())
    f(function2InSamePackage())
    f(function2InSamePackage())
    f(function1InDifferentPackage())
    f(function1InDifferentPackage())
    f(g())
    f(g())
    f(function1InCompilationUnitWithPythonModule())
    f(function1InCompilationUnitWithPythonModule())
    f(h())
    f(h())


# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'test': test}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)