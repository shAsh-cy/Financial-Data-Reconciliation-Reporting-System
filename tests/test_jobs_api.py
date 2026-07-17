"""Unit tests for job status polling with mocked Celery AsyncResult."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.job_service import JobService


@pytest.mark.parametrize(
    ("celery_state", "ready", "successful", "failed", "expected_status", "result", "error_substr"),
    [
        ("PENDING", False, False, False, "queued", None, None),
        ("STARTED", False, False, False, "running", None, None),
        ("SUCCESS", True, True, False, "success", "report-id-123", None),
        ("FAILURE", True, False, True, "failed", None, "ledger missing"),
    ],
)
def test_get_task_status_maps_celery_states(
    celery_state: str,
    ready: bool,
    successful: bool,
    failed: bool,
    expected_status: str,
    result,
    error_substr,
) -> None:
    """GET /jobs/{task_id} logic maps Celery AsyncResult states to API statuses."""
    mock_result = MagicMock()
    mock_result.state = celery_state
    mock_result.ready.return_value = ready
    mock_result.successful.return_value = successful
    mock_result.failed.return_value = failed
    if failed:
        mock_result.result = ValueError(error_substr)
    else:
        mock_result.result = result

    with patch("app.services.job_service.AsyncResult", return_value=mock_result):
        response = JobService.get_task_status("task-abc")

    assert response.task_id == "task-abc"
    assert response.status == expected_status
    if expected_status == "success":
        assert response.result == result
    if expected_status == "failed":
        assert response.error is not None
        assert error_substr in response.error
