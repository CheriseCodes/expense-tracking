# PostgreSQL 14 to 17 Migration Guide

## Overview
This guide helps you migrate your PostgreSQL data from version 14 to 17 without losing any data.

## Option 1: Automated Migration (Recommended)

### Prerequisites
1. Make sure you have a `.env` file with `POSTGRES_PASSWORD=your_password`
2. Stop your current application: `docker-compose down`

### Steps
1. **Run the migration script:**
   ```bash
   ./scripts/migrate-postgres-14-to-17.sh
   ```

2. **Start your application:**
   ```bash
   docker-compose up -d
   ```

## Option 2: Manual Migration

### Step 1: Backup Current Data
```bash
# Stop the application
docker-compose down

# Create a backup of your current data
docker run --rm -v expense-tracking_expenses-db-postgres-volume:/data -v $(pwd):/backup alpine tar czf /backup/postgres14_backup.tar.gz -C /data .
```

### Step 2: Extract Data from PostgreSQL 14
```bash
# Temporarily start PostgreSQL 14
docker run --rm -d \
  --name postgres14_temp \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=expenses_db \
  -v expense-tracking_expenses-db-postgres-volume:/var/lib/postgresql/data \
  -p 5433:5432 \
  postgres:14-alpine

# Wait for it to start
sleep 10

# Create a SQL dump
docker exec postgres14_temp pg_dump -U postgres -d expenses_db > postgres14_dump.sql

# Stop the temporary container
docker stop postgres14_temp
```

### Step 3: Initialize PostgreSQL 17
```bash
# Remove the old volume
docker volume rm expense-tracking_expenses-db-postgres-volume

# Start your application (this will create a new PostgreSQL 17 volume)
docker-compose up -d db

# Wait for the database to be ready
sleep 10
```

### Step 4: Restore Data to PostgreSQL 17
```bash
# Restore the data
docker exec -i expense-tracking-db-1 psql -U postgres -d expenses_db < postgres14_dump.sql
```

### Step 5: Start All Services
```bash
# Start the rest of your application
docker-compose up -d
```

## Option 3: Fresh Start (If you don't need to keep existing data)

If you're okay with losing your current data and starting fresh:

```bash
# Stop all services
docker-compose down

# Remove the old volume
docker volume rm expense-tracking_expenses-db-postgres-volume

# Start fresh with PostgreSQL 17
docker-compose up -d
```

## Verification

After migration, verify your data is intact:

1. **Check the dashboard** at http://localhost:3000
2. **Check Adminer** at http://localhost:8000
3. **Check the API** at http://localhost:8001/docs

## Troubleshooting

### Common Issues

1. **Permission denied on migration script:**
   ```bash
   chmod +x scripts/migrate-postgres-14-to-17.sh
   ```

2. **Port conflicts:**
   - Make sure ports 5432, 5433, 5434 are available
   - Stop any existing PostgreSQL instances

3. **Volume not found:**
   ```bash
   docker volume ls | grep expense-tracking
   ```

4. **Data not appearing:**
   - Check the migration logs
   - Verify the SQL dump was created successfully
   - Check database connection in Adminer

### Recovery

If something goes wrong, you can restore from backup:

```bash
# Stop all services
docker-compose down

# Remove the new volume
docker volume rm expense-tracking_expenses-db-postgres-volume

# Restore from backup
docker volume create expense-tracking_expenses-db-postgres-volume
docker run --rm -v expense-tracking_expenses-db-postgres-volume:/data -v $(pwd):/backup alpine tar xzf /backup/postgres14_backup.tar.gz -C /data

# Start with PostgreSQL 14 (temporarily change compose.yaml)
# Change image: postgres:17-alpine to image: postgres:14-alpine
docker-compose up -d
```

## Notes

- The automated migration script creates a backup of your old data
- The migration process may take a few minutes depending on data size
- All your existing data will be preserved
- The new PostgreSQL 17 installation will be optimized for better performance 