# Functions --------------------------------------------------------------------

def test():
    True
    False
    1
    1
    None
    ""
    "multi
line"


# Simulation --------------------------------------------------------------------

date = "2000-01-01"

functions = {'test': test}

params = {'input':{}}

def simulate(data: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    return compute_taxes_and_transfers(data = pd.read_csv("dataFile.csv"), targets = [target1, target2], functions = functions, params = params)