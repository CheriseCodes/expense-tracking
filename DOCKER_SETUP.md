# Docker Setup for Expense Tracking

This project includes a complete Docker Compose setup for running the entire expense tracking application.

## Services

- **Database**: PostgreSQL 17 (port 5432)
- **Adminer**: Database management UI (port 8000)
- **Backend**: FastAPI application (port 8001)
- **Frontend**: React + Vite application (port 3000)

## Quick Start

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - Database Admin: http://localhost:8000

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Development Mode

The Docker setup is configured for development with:
- Hot reloading for both frontend and backend
- Volume mounts for live code changes
- Environment variables for API configuration

## Environment Variables

Create a `.env` file in the root directory:
```env
POSTGRES_PASSWORD=your_secure_password
```

## Troubleshooting

- **Frontend not connecting to backend**: Ensure the `VITE_API_URL` environment variable is set correctly
- **Database connection issues**: Check that the PostgreSQL service is healthy before starting the backend
- **Port conflicts**: Make sure ports 3000, 8000, 8001, and 5432 are available

## Building Images

To rebuild the Docker images:
```bash
docker-compose build
```

## Viewing Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
``` 