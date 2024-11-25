# Functions --------------------------------------------------------------------

def f(param):
    pass

def g()->bool:
    pass

def test():
    f(g())


# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'g': g, 'test': test}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)