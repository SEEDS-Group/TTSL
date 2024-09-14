# Imports ----------------------------------------------------------------------

from tests.generator.differentPackage import function1InDifferentPackage, function2InDifferentPackage as g
from tests.generator.withPythonModule import function1InCompilationUnitWithPythonModule, function2InCompilationUnitWithPythonModule as h

# Functions --------------------------------------------------------------------

def f(param):
    pass

def test():
    f(function1InSamePackage())
    f(function1InSamePackage())
    f(function2InSamePackage())
    f(function2InSamePackage())
    f(function1InDifferentPackage())
    f(function1InDifferentPackage())
    f(g())
    f(g())
    f(function1InCompilationUnitWithPythonModule())
    f(function1InCompilationUnitWithPythonModule())
    f(h())
    f(h())

