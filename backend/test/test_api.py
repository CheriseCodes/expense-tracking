#!/usr/bin/env python3
"""
Pytest API tests using FastAPI TestClient bound to a test database on port 5433.
Requires the test Postgres in compose.test.yaml to be running (docker compose -f compose.test.yaml up -d).
"""

import os
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Import app and DB utilities from the backend src
from main import app  # ensure PYTHONPATH includes backend/src when running pytest
from database import Base, get_db


# Configure test database (port 5433)
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    f"postgresql://postgres:{POSTGRES_PASSWORD}@localhost:5433/test_expenses_db",
)

engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True, future=True)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    trans = connection.begin()
    session = TestingSessionLocal(bind=connection)

    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, transaction):
        if transaction.nested and not transaction._parent.nested:
            sess.connection().begin_nested()

    try:
        yield session
    finally:
        session.close()
        nested.rollback()
        trans.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


common_data = {
    "category_id": None,
    "user_id": None,
    "expense_id": None,
}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_user_flow(client):
    user_data = {
        "username": "testuser",
        "email": "testuser@example.com",
        "role": "regular",
        "password_hash": "fakehash123",
    }
    r = client.post("/users/", json=user_data)
    assert r.status_code == 201
    user = r.json()
    assert user["username"] == "testuser"
    assert user["email"] == "testuser@example.com"
    assert user["role"] == "regular"
    common_data["user_id"] = user["user_id"]


def test_category_crud(client):
    # Create
    r = client.post("/categories/", json={"category_name": "Food & Dining"})
    assert r.status_code == 201
    category = r.json()
    assert category["category_name"] == "Food &amp; Dining"
    common_data["category_id"] = category["category_id"]

    # List
    r = client.get("/categories/")
    assert r.status_code == 200
    names = [c["category_name"] for c in r.json()]
    assert "Food &amp; Dining" in names

    # Update
    r = client.put(
        f"/categories/{common_data['category_id']}",
        json={"category_name": "Updated Food & Dining"},
    )
    assert r.status_code == 200
    assert r.json()["category_name"] == "Updated Food & Dining"


def test_expenses_flow(client):
    # Ensure user and category exist
    test_user_flow(client)
    test_category_crud(client)

    # Create expense
    r = client.post(
        "/expenses/",
        json={
            "item": "Lunch at Chipotle",
            "vendor": "Chipotle",
            "price": 25.50,
            "date_purchased": date.today().isoformat(),
            "user_id": common_data["user_id"],
            "payment_method": "credit card",
            "notes": "Delicious burrito bowl",
        },
    )
    assert r.status_code == 201
    expense = r.json()
    assert expense["item"] == "Lunch at Chipotle"
    assert expense["vendor"] == "Chipotle"
    assert expense["price"] == 25.50
    assert expense["date_purchased"] == date.today().isoformat()
    assert expense["user_id"] == common_data["user_id"]
    common_data["expense_id"] = expense["expense_id"]

    # Link expense to category
    r = client.post(
        f"/expenses/{common_data['expense_id']}/categories/{common_data['category_id']}"
    )
    assert r.status_code == 201
    assert r.json()["category_id"] == common_data["category_id"]

    # List expenses
    r = client.get("/expenses/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) > 0


def test_analytics(client):
    r = client.get("/analytics/total")
    assert r.status_code == 200
    total = r.json()
    assert "total" in total
    assert isinstance(total["total"], float)

    r = client.get("/analytics/by-category")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert "category" in first
        assert "total" in first
        assert isinstance(first["total"], float)
        assert isinstance(first["category"], str)


# def main():
#     print("Starting API tests...")
#     print("=" * 50)
#     try:
#         test_health()
#         user_id = test_user()
#         category_id = test_categories()
#         if user_id and category_id:
#             test_expenses(user_id, category_id)
#         print("=" * 50)
#         print("Tests completed!")
#     except requests.exceptions.ConnectionError:
#         print("Error: Could not connect to the API. Make sure the services are running with:")
#         print("docker compose up -d")
#     except Exception as e:
#         print(f"Error during testing: {e}")

# if __name__ == "__main__":
#     main() 