# Expense Tracking API

A FastAPI backend for tracking expenses and categories with full CRUD operations.

## Features

- **Categories**: Create, read, update, and delete expense categories
- **Transactions**: Track individual expenses with amounts, descriptions, and categories
- **Analytics**: Get total expenses and breakdown by category
- **RESTful API**: Full REST API with proper HTTP status codes
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Documentation**: Auto-generated API docs with Swagger UI

## Quick Start

1. **Start the services:**
   ```bash
   docker compose up -d
   ```

2. **Access the API:**
   - API Base URL: http://localhost:8001
   - Interactive Docs: http://localhost:8001/docs
   - Alternative Docs: http://localhost:8001/redoc

3. **Test the API:**
   ```bash
   cd backend/src
   python test_api.py
   ```

## API Endpoints

### Categories

- `GET /categories/` - Get all categories
- `GET /categories/{id}` - Get a specific category
- `POST /categories/` - Create a new category
- `PUT /categories/{id}` - Update a category
- `DELETE /categories/{id}` - Delete a category

### Transactions

- `GET /transactions/` - Get all transactions
- `GET /transactions/{id}` - Get a specific transaction
- `POST /transactions/` - Create a new transaction
- `PUT /transactions/{id}` - Update a transaction
- `DELETE /transactions/{id}` - Delete a transaction

### Analytics

- `GET /analytics/total` - Get total expenses
- `GET /analytics/by-category` - Get expenses grouped by category

## Data Models

### Category
```json
{
  "id": 1,
  "name": "Food & Dining",
  "description": "Restaurants and groceries",
  "color": "#FF6B6B",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Transaction
```json
{
  "id": 1,
  "amount": 25.50,
  "description": "Lunch at Chipotle",
  "date": "2024-01-01T12:00:00",
  "category_id": 1,
  "notes": "Delicious burrito bowl",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "category": {
    "id": 1,
    "name": "Food & Dining",
    "description": "Restaurants and groceries",
    "color": "#FF6B6B"
  }
}
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:password@localhost:5432/expenses_db`)
- `POSTGRES_PASSWORD`: PostgreSQL password (set in compose.yaml)

## Development

### Local Development
```bash
# Install dependencies
pip install -r src/requirements.txt

# Run the API
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Database Migrations
The API automatically creates tables on startup using SQLAlchemy's `create_all()`.

### Testing
Run the test script to verify all endpoints:
```bash
python src/test_api.py
```

## API Documentation

Once the service is running, visit:
- http://localhost:8001/docs for interactive Swagger documentation
- http://localhost:8001/redoc for ReDoc documentation

## Example Usage

### Create a Category
```bash
curl -X POST "http://localhost:8001/categories/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Transportation",
    "description": "Gas, parking, and public transit",
    "color": "#4ECDC4"
  }'
```

### Create a Transaction
```bash
curl -X POST "http://localhost:8001/transactions/" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45.00,
    "description": "Gas station fill-up",
    "date": "2024-01-01T10:30:00",
    "category_id": 1,
    "notes": "Regular unleaded"
  }'
```

### Get Analytics
```bash
curl "http://localhost:8001/analytics/total"
curl "http://localhost:8001/analytics/by-category"
``` 