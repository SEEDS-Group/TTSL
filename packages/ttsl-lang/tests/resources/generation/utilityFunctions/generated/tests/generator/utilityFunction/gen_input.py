# Imports ----------------------------------------------------------------------

from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_len(list):
    return len(list)

def __gen_keys(dict):
    return list(dict.keys())

def __gen_values(dict):
    return list(dict.values())

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

# Functions --------------------------------------------------------------------

def testFunction():
    x = __gen_len(testList)
    y = __gen_keys(testDict)
    z = __gen_values(testDict)


# Constants --------------------------------------------------------------------

testList = __gen_ClassConstants({"empty": [1, 2, 3]})

testDict = __gen_ClassConstants({"empty": {"a": 1, "b": 2, "c": 3}})