# Imports ----------------------------------------------------------------------

from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_TimeUnitDay(value, timeunit):
    if(timeunit == "per week"):
        return value * 7
    if(timeunit == 'per month'):
        return value * 30
    if(timeunit == 'per year'):
        return value * 365
    return value

def __gen_TimeUnitWeek(value, timeunit):
    if(timeunit == 'per day'):
        return value / 7
    if(timeunit == 'per month'):
        return value * 4
    if(timeunit == 'per year'):
        return value * 52
    return value

def __gen_TimeUnitMonth(value, timeunit):
    if(timeunit == 'per day'):
        return value / 30
    if(timeunit == 'per week'):
        return value / 4
    if(timeunit == 'per year'):
        return value * 12
    return value

def __gen_TimeUnitYear(value, timeunit):
    if(timeunit == 'per day'):
        return value / 365
    if(timeunit == 'per week'):
        return value / 52
    if(timeunit == 'per month'):
        return value / 12
    return value

# Functions --------------------------------------------------------------------

def daytest(timeunit = None, groupedBy = None, date = None):

    if timeunit != None:
        result = __gen_TimeUnitDay(100, timeunit)
    return result

def weektest(timeunit = None, groupedBy = None, date = None):

    if timeunit != None:
        result = __gen_TimeUnitWeek(100, timeunit)
    return result

def monthtest(timeunit = None, groupedBy = None, date = None):

    if timeunit != None:
        result = __gen_TimeUnitMonth(100, timeunit)
    return result

def yeartest(timeunit = None, groupedBy = None, date = None):

    if timeunit != None:
        result = __gen_TimeUnitYear(100, timeunit)
    return result