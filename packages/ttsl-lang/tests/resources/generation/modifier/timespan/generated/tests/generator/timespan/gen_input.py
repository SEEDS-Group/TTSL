# Imports ----------------------------------------------------------------------

from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

class __gen_ClassConstants():
    def __init__(self, dictionary: dict):
        self.dict = dictionary
    def getValue(self, date = None):
        keys = sorted(self.dict.keys())
        if(keys[0] == "empty"):
            return self.dict["empty"]
        for index, key in enumerate(keys):
            if key[0] == "s":
                if key.replace("s", "") <= date:
                    result = self.dict[key]
            if key[0] == "e":
                if date <= keys[len(keys)-1-index].replace("e", ""):
                    result = self.dict[keys[len(keys)-1-index]]
        return result

# Constants --------------------------------------------------------------------

myConstantDict = {"s2000-01-01": 1, "s2001-01-01": 2}
myConstant = __gen_ClassConstants(myConstantDict)

myConstant2Dict = {"s1999-01-01": 0, "s2001-01-01": 0, "s2003-01-01": True}
myConstant2 = __gen_ClassConstants(myConstant2Dict)

myConstant3Dict = {"s1999-01-01": 0, "s2001-01-01": "a", "s2003-01-01": "b", "s2004-01-01": 2}
myConstant3 = __gen_ClassConstants(myConstant3Dict)