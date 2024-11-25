# Functions --------------------------------------------------------------------

def myFunction():
    x = 0
    i = 0
    while (i) <= (10):
        i = (i) + (1)
    return x

# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'myFunction': myFunction}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)