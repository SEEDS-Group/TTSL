import pytest
from safe_ds.classification import KNearestNeighbors as KNearestNeighborsClassifier
from safe_ds.data import SupervisedDataset, Table
from safe_ds.exceptions import LearningError


def test_k_nearest_neighbors_fit() -> None:
    table = Table.from_csv("tests/resources/test_k_nearest_neighbors.csv")
    supervised_dataset = SupervisedDataset(table, "T")
    k_nearest_neighbors = KNearestNeighborsClassifier(2)
    k_nearest_neighbors.fit(supervised_dataset)
    assert True  # This asserts that the fit method succeeds


def test_k_nearest_neighbors_fit_invalid() -> None:
    table = Table.from_csv("tests/resources/test_k_nearest_neighbors_invalid.csv")
    supervised_dataset = SupervisedDataset(table, "T")
    k_nearest_neighbors = KNearestNeighborsClassifier(2)
    with pytest.raises(LearningError):
        k_nearest_neighbors.fit(supervised_dataset)