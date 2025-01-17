# Functions --------------------------------------------------------------------

def f(param):
    pass

def test():
    f((1) < (2))
    f((1) - (1))
    f((1) + (1))
    f(None)


# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'test': test}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)