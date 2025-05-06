# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers)
import pandas as pd
import numpy as np
from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_TimeUnitDay(value, timeunit):
    if(timeunit == 'week'):
        return value * 7
    if(timeunit == 'month'):
        return value * 30
    if(timeunit == 'year'):
        return value * 365
    return value

def __gen_TimeUnitWeek(value, timeunit):
    if(timeunit == 'day'):
        return value / 7
    if(timeunit == 'month'):
        return value * 4
    if(timeunit == 'year'):
        return value * 52
    return value

def __gen_TimeUnitMonth(value, timeunit):
    if(timeunit == 'day'):
        return value / 30
    if(timeunit == 'week'):
        return value / 4
    if(timeunit == 'year'):
        return value * 12
    return value

def __gen_TimeUnitYear(value, timeunit):
    if(timeunit == 'day'):
        return value / 365
    if(timeunit == 'week'):
        return value / 52
    if(timeunit == 'month'):
        return value / 12
    return value

# Functions --------------------------------------------------------------------

def daytest()->int:
    timeunit = "day"
    result = 100
    if timeunit != None:
        result = __gen_TimeUnitDay(result, timeunit)
    return result

def weektest()->int:
    timeunit = "week"
    result = 100
    if timeunit != None:
        result = __gen_TimeUnitWeek(result, timeunit)
    return result

def monthtest()->int:
    timeunit = "month"
    result = 100
    if timeunit != None:
        result = __gen_TimeUnitMonth(result, timeunit)
    return result

def yeartest()->int:
    timeunit = "year"
    result = 100
    if timeunit != None:
        result = __gen_TimeUnitYear(result, timeunit)
    return result

# Simulation --------------------------------------------------------------------

dataFrame = pd.read_csv("dataFile.csv")

date = "2000-01-01"

functions = {'daytest': daytest, 'weektest': weektest, 'monthtest': monthtest, 'yeartest': yeartest}

params = {'input':{}}

aggregation_functions = {}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = dataFrame, targets = ['target1', 'target2'], functions = functions, params = params, aggregation_specs = aggregation_functions)