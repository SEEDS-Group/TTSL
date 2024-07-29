# Imports ----------------------------------------------------------------------

import TTSL_runner
from typing import Any, Callable, TypeVar

# Type variables ---------------------------------------------------------------

__gen_T = TypeVar("__gen_T")

# Utils ------------------------------------------------------------------------

def __gen_null_safe_call(receiver: Any, callable: Callable[[], __gen_T]) -> __gen_T | None:
    return callable() if receiver is not None else None

# Segments ---------------------------------------------------------------------

def segment_a(a):
    __gen_yield_result = (a) * (2)
    return __gen_yield_result

# Pipelines --------------------------------------------------------------------

def test():
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.g", lambda *_ : g(1, param2=2), [1, 2], []))
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.g", lambda *_ : g(2, param2=1), [2, 1], []))
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.h", lambda *_ : h(1, param_2=2), [1, 2], []))
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.h", lambda *_ : h(2, param_2=1), [2, 1], []))
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.h", h, [2, 0], []))
    'abc'.i()
    'abc'.j(123)
    k(456, 1.23)
    __gen_null_safe_call(f, lambda: f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.g", lambda *_ : g(1, param2=2), [1, 2], [])))
    __gen_null_safe_call(f, lambda: f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.g", lambda *_ : g(2, param2=1), [2, 1], [])))
    __gen_null_safe_call(f, lambda: f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.h", lambda *_ : h(1, param_2=2), [1, 2], [])))
    __gen_null_safe_call(f, lambda: f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.h", lambda *_ : h(2, param_2=1), [2, 1], [])))
    __gen_null_safe_call(f, lambda: f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.h", h, [2, 0], [])))
    __gen_null_safe_call(i, lambda: 'abc'.i())
    __gen_null_safe_call(j, lambda: 'abc'.j(123))
    __gen_null_safe_call(k, lambda: k(456, 1.23))
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.readFile", readFile, [], [TTSL_runner.file_mtime('a.txt')]))
    f(l(lambda a: segment_a(a)))
    f(l(lambda a: (3) * (segment_a(a))))
    f(l(lambda a: TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.m", m, [(3) * (segment_a(a))], [])))
    f(l(lambda a: (3) * (TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.m", m, [TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.m", m, [(3) * (segment_a(a))], [])], []))))
    def __gen_block_lambda_0(a):
        __gen_block_lambda_result_result = segment_a(a)
        return __gen_block_lambda_result_result
    f(l(__gen_block_lambda_0))
    def __gen_block_lambda_1(a):
        __gen_block_lambda_result_result = TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.m", m, [segment_a(a)], [])
        return __gen_block_lambda_result_result
    f(l(__gen_block_lambda_1))
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.l", l, [lambda a: (3) * (a)], []))
    def __gen_block_lambda_2(a):
        __gen_block_lambda_result_result = (3) * (TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.m", m, [a], []))
        return __gen_block_lambda_result_result
    f(TTSL_runner.memoized_call("tests.generator.callWithRunnerIntegration.l", l, [__gen_block_lambda_2], []))
