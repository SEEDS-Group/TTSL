# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers)
import pandas as pd
import numpy as np
# Functions --------------------------------------------------------------------

def myPublicFunction():

    pass

def myPrivateFunction():

    pass

def myPackagePrivateFunction():

    pass

# Simulation --------------------------------------------------------------------

dataFrame = pd.read_csv("dataFile.csv")

date = "2000-01-01"

functions = {'myPublicFunction': myPublicFunction}

params = {'input':{}}

aggregation_functions = {}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = dataFrame, targets = ['target1', 'target2'], functions = functions, params = params, aggregation_specs = aggregation_functions)