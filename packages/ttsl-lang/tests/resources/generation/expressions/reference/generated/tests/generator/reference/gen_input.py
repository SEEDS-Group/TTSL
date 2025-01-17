# Functions --------------------------------------------------------------------

def f(param):
    pass

def explainModel()->int:
    pass

def test():
    f(explainModel())


def g(param: int):
    pass

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'explainModel': explainModel, 'test': test, 'g': g}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)