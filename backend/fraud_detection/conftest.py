"""
Shared pytest fixtures for the fraud_detection test suite.

The ``isolated_state`` fixture (autouse) resets all in-process stores between
tests so that tests are fully independent and ordering-agnostic.
"""
from __future__ import annotations

import asyncio

import pytest

import scoring
from repository import clear_all


@pytest.fixture(autouse=True)
def isolated_state():
    """Reset all shared in-process state before and after every test."""
    clear_all()
    scoring._last_duplicate_scan_at = 0.0

    # Clear optional HTTP-layer state only when the module is already loaded.
    # This keeps pure scoring tests independent of FastAPI startup costs.
    try:
        routes = __import__("stages.routes", fromlist=["_IDEMPOTENCY_STORE"])
    except ModuleNotFoundError:
        pass
    else:
        routes._IDEMPOTENCY_STORE._store.clear()
        routes._IDEMPOTENCY_STORE._expiry_queue.clear()

    try:
        worker = __import__(
            "stages.scoring_worker",
            fromlist=["scoring_queue"],
        )
        scoring_queue = worker.scoring_queue
    except ModuleNotFoundError:
        pass
    else:
        while not scoring_queue.empty():
            try:
                scoring_queue.get_nowait()
                scoring_queue.task_done()
            except asyncio.QueueEmpty:
                break

    yield

    clear_all()
    scoring._last_duplicate_scan_at = 0.0
