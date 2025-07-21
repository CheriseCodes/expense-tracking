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
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

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
    if response.status_code == 201:
        user = response.json()
        print(f"Created user: {user}")
        return user["user_id"]
    else:
        print(f"Error creating user: {response.text}")
        return None

def test_categories():
    print("Testing category endpoints...")
    category_data = {
        "category_name": "Food & Dining"
    }
    response = requests.post(f"{BASE_URL}/categories/", json=category_data)
    print(f"Create category status: {response.status_code}")
    if response.status_code == 201:
        category = response.json()
        print(f"Created category: {category}")
        category_id = category['category_id']
        # Get all categories
        response = requests.get(f"{BASE_URL}/categories/")
        print(f"Get categories status: {response.status_code}")
        print(f"Categories: {response.json()}")
        # Update category
        update_data = {"category_name": "Updated Food & Dining"}
        response = requests.put(f"{BASE_URL}/categories/{category_id}", json=update_data)
        print(f"Update category status: {response.status_code}")
        return category_id
    else:
        print(f"Error creating category: {response.text}")
        return None

def test_expenses(user_id, category_id):
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
    print(f"Create expense status: {response.status_code}")
    if response.status_code == 201:
        expense = response.json()
        print(f"Created expense: {expense}")
        expense_id = expense['expense_id']
        # Link expense to category
        response = requests.post(f"{BASE_URL}/expenses/{expense_id}/categories/{category_id}")
        print(f"Link expense to category status: {response.status_code}")
        # Get all expenses
        response = requests.get(f"{BASE_URL}/expenses/")
        print(f"Get expenses status: {response.status_code}")
        print(f"Expenses: {response.json()}")
        # Get analytics
        response = requests.get(f"{BASE_URL}/analytics/total")
        print(f"Total expenses: {response.json()}")
        response = requests.get(f"{BASE_URL}/analytics/by-category")
        print(f"Expenses by category: {response.json()}")
        return expense_id
    else:
        print(f"Error creating expense: {response.text}")
        return None

def main():
    print("Starting API tests...")
    print("=" * 50)
    try:
        test_health()
        user_id = test_user()
        category_id = test_categories()
        if user_id and category_id:
            test_expenses(user_id, category_id)
        print("=" * 50)
        print("Tests completed!")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the services are running with:")
        print("docker compose up -d")
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    main() 