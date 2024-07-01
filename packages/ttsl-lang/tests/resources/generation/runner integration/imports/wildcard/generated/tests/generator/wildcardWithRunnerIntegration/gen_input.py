# Imports ----------------------------------------------------------------------

import TTSL_runner
from special_location import function1InCompilationUnitWithPythonModule, function2InCompilationUnitWithPythonModule
from tests.generator.differentPackageWildcardWithRunnerIntegration import function1InDifferentPackage, function2InDifferentPackage

# Pipelines --------------------------------------------------------------------

def test():
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWildcardWithRunnerIntegration.function1InDifferentPackage", function1InDifferentPackage, [], []))
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWildcardWithRunnerIntegration.function1InDifferentPackage", function1InDifferentPackage, [], []))
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWildcardWithRunnerIntegration.function2InDifferentPackage", function2InDifferentPackage, [], []))
    f(TTSL_runner.memoized_call("tests.generator.differentPackageWildcardWithRunnerIntegration.function2InDifferentPackage", function2InDifferentPackage, [], []))
    f(TTSL_runner.memoized_call("special_location.function1InCompilationUnitWithPythonModule", function1InCompilationUnitWithPythonModule, [], []))
    f(TTSL_runner.memoized_call("special_location.function1InCompilationUnitWithPythonModule", function1InCompilationUnitWithPythonModule, [], []))
    f(TTSL_runner.memoized_call("special_location.function2InCompilationUnitWithPythonModule", function2InCompilationUnitWithPythonModule, [], []))
    f(TTSL_runner.memoized_call("special_location.function2InCompilationUnitWithPythonModule", function2InCompilationUnitWithPythonModule, [], []))
