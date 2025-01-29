# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd
import numpy as np
import pandas as pd
from typing import TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_aggregation(dataFrame: pd.Dataframe, data, id, function: str) -> pd.Dataframe | None:
    dataFrame = dataFrame.join(dataFrame[id])
    dataFrame[data] = dataFrame.groupby(id)[data].transform(function)
    return dataFrame

# Functions --------------------------------------------------------------------

def testFunction(testID: int, testData: int, ):
    __gen_aggregation(dataframe, testData, testID, 'sum')

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'testFunction': testFunction}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = ['target1', 'target2'], functions = functions, params = params)