import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from main import app
from api.v1 import students


@pytest.fixture(autouse=True)
def reset_store():
    students._students.clear()
    students._attempts.clear()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "shineworld-backend"}


@pytest.mark.asyncio
async def test_create_list_and_get_student(client):
    created = await client.post("/api/v1/students", json={"name": "Ada", "age": 7})

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
async def test_student_validation_and_not_found(client):
    invalid = await client.post("/api/v1/students", json={"name": ""})
    missing = await client.get(f"/api/v1/students/{uuid4()}")

    assert invalid.status_code == 422
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_create_attempt_and_get_progress(client):
    student_response = await client.post("/api/v1/students", json={"name": "Sam"})
    student_id = student_response.json()["id"]
    activity_id = str(uuid4())

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
async def test_attempt_validation_and_missing_student(client):
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