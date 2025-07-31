# Expense Tracking Application

A full-stack expense tracking application built with FastAPI, React, and PostgreSQL.

## Features

- **User Management**: Create and manage user accounts
- **Category Management**: Organize expenses by categories
- **Expense Tracking**: Record and track all expenses
- **Wishlist Management**: Plan future purchases
- **Budget Management**: Set and monitor budget limits
- **Dashboard**: Comprehensive overview of financial data

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **Containerization**: Docker Compose

## Quick Start with Docker

The easiest way to run the application is using Docker Compose:

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# Database Admin: http://localhost:8000
```

For detailed Docker setup instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

## Development Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once the backend is running, visit http://localhost:8001/docs for interactive API documentation.

## Plans
- [x] Python w/ FastAPI on the backend
- [x] React, Tailwind
- [ ] Data visualization library (unknown)
- [x] PostgreSQL
- [x] Docker Compose
- [ ] Terraform
- [x] Run locally
- [ ] Run in the cloud

I want to...
- [x] Upload data from Apple Numbers to the app
- [ ] Visualize the data
- [ ] Make notes on each data point
- [ ] Plan future expenses
