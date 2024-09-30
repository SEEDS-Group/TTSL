# Imports ----------------------------------------------------------------------

import pandas as pd
from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
from typing import TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_aggregation(dataFrame: pd, data, id, function: str) -> pd | None:
    dataFrame = dataFrame.join(dataFrame[id])
    dataFrame[data] = dataFrame.groupby(id)[data].transform(function)
    return dataFrame

# Functions --------------------------------------------------------------------

def testFunction(timeunit = None, groupedBy = None, date = None, ):
    __gen_aggregation(dataframe, testData, testID, 'sum')
