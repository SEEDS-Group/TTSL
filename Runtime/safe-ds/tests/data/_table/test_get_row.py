import pytest
from safe_ds.data import Table
from safe_ds.exceptions import IndexOutOfBoundsError


def test_get_row():
    table = Table.from_csv("tests/resources/test_table_read_csv.csv")
    val = table.get_row(0)
    assert val._data["A"] == 1 and val._data["B"] == 2


def test_get_row_negative_index():
    table = Table.from_csv("tests/resources/test_table_read_csv.csv")
    with pytest.raises(IndexOutOfBoundsError):
        table.get_row(-1)


def test_get_row_out_of_bounds_index():
    table = Table.from_csv("tests/resources/test_table_read_csv.csv")
    with pytest.raises(IndexOutOfBoundsError):
        table.get_row(5)