# Functions --------------------------------------------------------------------

def h()->int:
    pass

def test():
    np.array([])
    np.array([1, 2, 3])
    np.array([1, h(), (h()) + (5)])


# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'h': h, 'test': test}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)