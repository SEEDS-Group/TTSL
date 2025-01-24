# Imports ----------------------------------------------------------------------

from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)
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

def daytest(timeunit = None)->int:
    if timeunit != None:
        result = __gen_TimeUnitDay(100, timeunit)
    return result

def weektest(timeunit = None)->int:
    if timeunit != None:
        result = __gen_TimeUnitWeek(100, timeunit)
    return result

def monthtest(timeunit = None)->int:
    if timeunit != None:
        result = __gen_TimeUnitMonth(100, timeunit)
    return result

def yeartest(timeunit = None)->int:
    if timeunit != None:
        result = __gen_TimeUnitYear(100, timeunit)
    return result

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'daytest': daytest, 'weektest': weektest, 'monthtest': monthtest, 'yeartest': yeartest}

params = {'input':{}}

def simulate() -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)