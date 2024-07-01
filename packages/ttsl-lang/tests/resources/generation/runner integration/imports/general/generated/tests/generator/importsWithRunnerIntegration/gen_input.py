# Imports ----------------------------------------------------------------------

import TTSL_runner
from special_location import function1InCompilationUnitWithPythonModule, function2InCompilationUnitWithPythonModule as h
from tests.generator.differentPackageWithRunnerIntegration import function1InDifferentPackage, function2InDifferentPackage as g
from tests.generator.importsWithRunnerIntegration.gen_context_same_package import segment1InSamePackage, segment2InSamePackage

# Pipelines --------------------------------------------------------------------

def test():
    f(segment1InSamePackage())
    f(segment1InSamePackage())
    f(segment2InSamePackage())
    f(segment2InSamePackage())
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWithRunnerIntegration.function1InDifferentPackage", function1InDifferentPackage, [], []))
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWithRunnerIntegration.function1InDifferentPackage", function1InDifferentPackage, [], []))
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWithRunnerIntegration.function2InDifferentPackage", g, [], []))
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWithRunnerIntegration.function2InDifferentPackage", g, [], []))
    f(TTSL_runner.memoized_call("special_location.function1InCompilationUnitWithPythonModule", function1InCompilationUnitWithPythonModule, [], []))
    f(TTSL_runner.memoized_call("special_location.function1InCompilationUnitWithPythonModule", function1InCompilationUnitWithPythonModule, [], []))
    f(TTSL_runner.memoized_call("special_location.function2InCompilationUnitWithPythonModule", h, [], []))
    f(TTSL_runner.memoized_call("special_location.function2InCompilationUnitWithPythonModule", h, [], []))
