# Functions --------------------------------------------------------------------

def f()->int:
    pass

def g(x: int = 0):
    pass

def testFunction():
    a = f()


# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'f': f, 'g': g, 'testFunction': testFunction}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)