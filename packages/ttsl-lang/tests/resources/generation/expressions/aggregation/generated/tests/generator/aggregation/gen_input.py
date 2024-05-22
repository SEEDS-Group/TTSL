# Imports --------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
import pandas as pd

# Utils --------------------------------------------------------------------

def aggregation(dataFrame: pd, data, id, function: str) -> pd | None:
    dataFrame = dataFrame.join(dataFrame[id])
    dataFrame[data] = dataFrame.groupby(id)[data].transform(function)
    return dataFrame

# Functions --------------------------------------------------------------------

def testFunction(timeunit, groupedBy, date):
    aggregation(dataframe, testData, testID, 'sum')
    
# Data --------------------------------------------------------------------

testData = int()
testID = int()