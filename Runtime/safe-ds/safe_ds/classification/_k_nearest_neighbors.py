# noinspection PyProtectedMember
import safe_ds._util._util_sklearn
from safe_ds.data import SupervisedDataset, Table
from sklearn.neighbors import KNeighborsClassifier


class KNearestNeighbors:
    """
    This class implements K-nearest-neighbors classifier. It can only be trained on a supervised dataset.

    Parameters
    ----------
    n_neighbors: int
        The number of Neighbors to be interpolated with. Has to be less than or equal than the sample size.
    """

    def __init__(self, n_neighbors: int) -> None:
        self._classification = KNeighborsClassifier(n_jobs=-1, n_neighbors=n_neighbors)

    def fit(self, supervised_dataset: SupervisedDataset) -> None:
        """
        Fit this model given a supervised dataset.

        Parameters
        ----------
        supervised_dataset: SupervisedDataset
            the supervised dataset containing the feature and target vectors

        Raises
        ------
        LearningError
            if the supervised dataset contains invalid values or if the training failed
        """
        safe_ds._util._util_sklearn.fit(self._classification, supervised_dataset)

    def predict(self, dataset: Table) -> Table:
        """
        Predict a target vector using a dataset containing feature vectors. The model has to be trained first

        Parameters
        ----------
        dataset: Table
            the dataset containing the feature vectors

        Returns
        -------
        table : Table
            a dataset containing the given feature vectors and the predicted target vector

        Raises
        ------
        PredictionError
            if predicting with the given dataset failed
        """
        return safe_ds._util._util_sklearn.predict(self._classification, dataset)