# Imports ----------------------------------------------------------------------

from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_TimeUnitDay(value, timeunit):
    if(timeunit == "per week"):
        return value * 7
    if(timeunit == 'per month')
        return value * 30
    if(timeunit == 'per year')
        return value * 365
    return value

# Functions --------------------------------------------------------------------

def test(timeunit, groupedBy, date):

    if timeunit != None:
        __gen_TimeUnitDay(2, timeunit)
    return 2
