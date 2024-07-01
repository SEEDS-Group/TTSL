# Imports ----------------------------------------------------------------------

import TTSL_runner
from typing import Any, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_null_safe_member_access(receiver: Any, member_name: str) -> __gen_T | None:
    return getattr(receiver, member_name) if receiver is not None else None

# Pipelines --------------------------------------------------------------------

def test():
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.g", g, [], []))
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.h", h, [], [])[0])
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.h", h, [], [])[1])
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C", C, [], []).a)
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C", C, [], []).c)
    f(__gen_null_safe_member_access(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.factory", factory, [], []), 'a'))
    f(__gen_null_safe_member_access(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.factory", factory, [], []), 'c'))
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C.i", lambda *_ : 1.i(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C", C, [], [])), [1], []))
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C.j", C.j, [TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C", C, [], []), 123], []))
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C.k2", C.k2, [TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C", C, [], []), 'abc'], []))
    f(TTSL_runner.memoized_call("tests.generator.memberAccessWithRunnerIntegration.C.from_csv_file", C.from_csv_file, ['abc.csv'], [TTSL_runner.file_mtime('abc.csv')]))
