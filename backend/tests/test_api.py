import sys
from pathlib import Path
from uuid import uuid4
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture(autouse=True)
def supabase_client(monkeypatch):
    supabase = MagicMock()
    query = MagicMock()
    query.select.return_value = query
    query.insert.return_value = query
    query.eq.return_value = query
    query.limit.return_value = query
    query.order.return_value = query
    supabase.table.return_value = query
    supabase.auth.get_user.return_value = SimpleNamespace(
        user=SimpleNamespace(id="00000000-0000-0000-0000-000000000001")
    )
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "test-key")
    with patch("api.v1.students.create_client", return_value=supabase):
        yield supabase


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client


@pytest.mark.asyncio
async def test_health(client, supabase_client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "shineworld-backend"}


@pytest.mark.asyncio
async def test_create_list_and_get_student(client, supabase_client):
    student_id = str(uuid4())
    student_row = {
        "id": student_id,
        "name": "Ada",
        "age": 7,
        "avatar_emoji": None,
        "created_at": "2026-09-16T00:00:00+00:00",
    }
    supabase_client.table.return_value.execute.side_effect = [
        SimpleNamespace(data=[student_row]),
        SimpleNamespace(data=[student_row]),
        SimpleNamespace(data=[student_row]),
    ]

    created = await client.post(
        "/api/v1/students",
        json={"name": "Ada", "age": 7},
        params={"authorization": "Bearer test-token"},
    )

    assert created.status_code == 201
    student = created.json()
    assert student["name"] == "Ada"

    listed = await client.get("/api/v1/students")
    fetched = await client.get(f"/api/v1/students/{student['id']}")

    assert listed.status_code == 200
    assert listed.json() == [student]
    assert fetched.status_code == 200
    assert fetched.json() == student


@pytest.mark.asyncio
async def test_student_validation_and_not_found(client, supabase_client):
    supabase_client.table.return_value.execute.return_value = SimpleNamespace(data=[])
    invalid = await client.post("/api/v1/students", json={"name": ""})
    missing = await client.get(f"/api/v1/students/{uuid4()}")

    assert invalid.status_code == 422
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_create_student_activity_attempt(client, supabase_client):
    student_id = uuid4()
    class_id = uuid4()
    attempt_row = {
        "id": str(uuid4()),
        "student_id": str(student_id),
        "activity_type": "tracing",
        "completion_score": 0.9,
        "timestamp": "2026-10-06T00:00:00Z",
    }
    supabase_client.table.return_value.execute.side_effect = [
        SimpleNamespace(data=[{"class_id": str(class_id)}]),
        SimpleNamespace(data=[{"id": str(class_id)}]),
        SimpleNamespace(data=[attempt_row]),
    ]

    response = await client.post(
        f"/api/v1/students/{student_id}/activity-attempts",
        json={"activity_type": "tracing", "completion_score": 0.9},
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 201
    assert response.json() == attempt_row
    assert [call.args[0] for call in supabase_client.table.call_args_list] == [
        "students",
        "classes",
        "student_activity_attempts",
    ]


@pytest.mark.asyncio
async def test_create_attempt_and_get_progress(client, supabase_client):
    student_id = str(uuid4())
    activity_id = str(uuid4())
    student_row = {
        "id": student_id,
        "name": "Sam",
        "age": None,
        "avatar_emoji": None,
        "created_at": "2026-09-16T00:00:00+00:00",
    }
    attempt_row = {
        "id": str(uuid4()),
        "child_id": student_id,
        "activity_id": activity_id,
        "correct": True,
        "latency_ms": None,
        "hints_used": 0,
        "transcript": None,
        "meta": {},
        "session_id": None,
        "created_at": "2026-09-16T00:00:00+00:00",
    }
    second_attempt_row = {**attempt_row, "id": str(uuid4()), "correct": False, "hints_used": 1}
    supabase_client.table.return_value.execute.side_effect = [
        SimpleNamespace(data=[student_row]),
        SimpleNamespace(data=[student_row]),
        SimpleNamespace(data=[attempt_row]),
        SimpleNamespace(data=[student_row]),
        SimpleNamespace(data=[second_attempt_row]),
        SimpleNamespace(data=[student_row]),
        SimpleNamespace(data=[{"correct": True}, {"correct": False}]),
    ]

    student_response = await client.post(
        "/api/v1/students",
        json={"name": "Sam"},
        params={"authorization": "Bearer test-token"},
    )
    student_id = student_response.json()["id"]

    first_attempt = await client.post(
        f"/api/v1/activities/{activity_id}/attempts",
        json={"student_id": student_id, "correct": True},
    )
    second_attempt = await client.post(
        f"/api/v1/activities/{activity_id}/attempts",
        json={"student_id": student_id, "correct": False, "hints_used": 1},
    )
    progress = await client.get(f"/api/v1/students/{student_id}/progress")

    assert first_attempt.status_code == 201
    assert second_attempt.status_code == 201
    assert progress.status_code == 200
    assert progress.json() == {
        "student_id": student_id,
        "total_attempts": 2,
        "total_correct": 1,
        "accuracy": 0.5,
    }


@pytest.mark.asyncio
async def test_attempt_validation_and_missing_student(client, supabase_client):
    supabase_client.table.return_value.execute.return_value = SimpleNamespace(data=[])
    invalid = await client.post(
        f"/api/v1/activities/{uuid4()}/attempts",
        json={"student_id": str(uuid4()), "correct": True, "hints_used": -1},
    )
    missing_student = await client.post(
        f"/api/v1/activities/{uuid4()}/attempts",
        json={"student_id": str(uuid4()), "correct": True},
    )

    assert invalid.status_code == 422
    assert missing_student.status_code == 404