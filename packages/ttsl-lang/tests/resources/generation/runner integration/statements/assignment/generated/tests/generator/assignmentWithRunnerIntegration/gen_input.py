# Imports ----------------------------------------------------------------------

import TTSL_runner

# Segments ---------------------------------------------------------------------

def testSegment():
    g()
    a, _, __gen_yield_c = g()
    x, _, _ = g()
    f1(a)
    f1(x)
    return __gen_yield_c

# Pipelines --------------------------------------------------------------------

def testPipeline():
    g()
    a, _, _ = g()
    TTSL_runner.save_placeholder('a', a)
    x, _, _ = g()
    TTSL_runner.save_placeholder('x', x)
    f1(a)
    f1(x)
    l, m, n = g()
    TTSL_runner.save_placeholder('l', l)
    TTSL_runner.save_placeholder('m', m)
    TTSL_runner.save_placeholder('n', n)
    f1(l)
    f1(m)
    f1(n)
    def __gen_block_lambda_0():
        g()
        a, _, __gen_block_lambda_result_c = g()
        x, _, _ = g()
        f1(a)
        f1(x)
        return __gen_block_lambda_result_c
    f2(__gen_block_lambda_0)
