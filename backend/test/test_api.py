#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI endpoints
Run this after starting the services with: docker compose up -d
"""

import requests
import json
from datetime import datetime, date
import uuid

BASE_URL = "http://localhost:8001"

def test_health():
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_user():
    print("Testing user endpoints...")
    user_data = {
        "username": "testuser",
        "email": "testuser@example.com",
        "role": "regular",
        "password_hash": "fakehash123"
    }
    response = requests.post(f"{BASE_URL}/users/", json=user_data)
    print(f"Create user status: {response.status_code}")
    assert response.status_code == 201
    user = response.json()
    assert user["username"] == "testuser"
    assert user["email"] == "testuser@example.com"
    assert user["role"] == "regular"

def test_categories():
    print("Testing category endpoints...")
    category_data = {
        "category_name": "Food & Dining"
    }
    response = requests.post(f"{BASE_URL}/categories/", json=category_data)
    print(f"Create category status: {response.status_code}")
    assert response.status_code == 201
    category = response.json()
    assert category["category_name"] == "Food &amp; Dining"
    category_id = category['category_id']
    assert category_id is not None
    # Get all categories
    response = requests.get(f"{BASE_URL}/categories/")
    print(f"Get categories status: {response.status_code}")
    assert response.status_code == 200
    categories = response.json()
    category_names = [category["category_name"] for category in categories]
    assert "Food &amp; Dining" in category_names
    # Update category
    update_data = {"category_name": "Updated Food & Dining"}
    response = requests.put(f"{BASE_URL}/categories/{category_id}", json=update_data)
    print(f"Update category status: {response.status_code}")
    assert response.status_code == 200
    assert response.json()["category_name"] == "Updated Food & Dining"

# TODO: Test deleting a category

def test_expenses():
    user_id = test_user()
    category_id = test_categories()
    print("\nTesting expense endpoints...")
    # Create an expense
    expense_data = {
        "item": "Lunch at Chipotle",
        "vendor": "Chipotle",
        "price": 25.50,
        "date_purchased": date.today().isoformat(),
        "user_id": user_id,
        "payment_method": "credit card",
        "notes": "Delicious burrito bowl"
    }
    response = requests.post(f"{BASE_URL}/expenses/", json=expense_data)
    assert response.status_code == 201
    expense = response.json()
    assert expense["item"] == "Lunch at Chipotle"
    assert expense["vendor"] == "Chipotle"
    assert expense["price"] == 25.50
    assert expense["date_purchased"] == date.today().isoformat()
    assert expense["user_id"] == user_id
    print(f"Create expense status: {response.status_code}")
    expense_id = expense['expense_id']
    assert expense_id is not None
    # Link expense to category
    response = requests.post(f"{BASE_URL}/expenses/{expense_id}/categories/{category_id}")
    assert response.status_code == 201
    assert response.json()["category_id"] == category_id
    print(f"Link expense to category status: {response.status_code}")
    # Get all expenses
    response = requests.get(f"{BASE_URL}/expenses/")
    print(f"Get expenses status: {response.status_code}")
    assert response.status_code == 200
    assert response.json()[0]["item"] == "Lunch at Chipotle"
    assert response.json()[0]["vendor"] == "Chipotle"
    assert response.json()[0]["price"] == 25.50
    assert response.json()[0]["date_purchased"] == date.today().isoformat()
    assert response.json()[0]["user_id"] == user_id
    assert response.json()[0]["category_id"] == category_id
    # Get analytics
    response = requests.get(f"{BASE_URL}/analytics/total")
    assert response.status_code == 200
    assert response.json()["total"] == 25.50
    response = requests.get(f"{BASE_URL}/analytics/by-category")
    assert response.status_code == 200
    assert response.json()[0]["category_name"] == "Food & Dining"
    assert response.json()[0]["total"] == 25.50
    return expense_id

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