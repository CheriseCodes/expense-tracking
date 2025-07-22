#!/bin/bash

# PostgreSQL 14 to 17 Migration Script
# This script helps migrate data from PostgreSQL 14 to PostgreSQL 17

set -e

echo "🚀 Starting PostgreSQL 14 to 17 migration..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with POSTGRES_PASSWORD=your_password"
    exit 1
fi

# Load environment variables
source .env

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ POSTGRES_PASSWORD not set in .env file"
    exit 1
fi

echo "📋 Step 1: Starting PostgreSQL 14 (old data) and PostgreSQL 17 (new) containers..."
docker-compose -f compose-migration.yaml up -d db-old db-new

echo "⏳ Waiting for databases to be ready..."
sleep 10

echo "📋 Step 2: Creating database dump from PostgreSQL 14..."
docker-compose -f compose-migration.yaml exec -T db-old pg_dump -U postgres -d expenses_db > postgres14_dump.sql

echo "📋 Step 3: Restoring data to PostgreSQL 17..."
docker-compose -f compose-migration.yaml exec -T db-new psql -U postgres -d expenses_db < postgres14_dump.sql

echo "📋 Step 4: Stopping migration containers..."
docker-compose -f compose-migration.yaml down

echo "📋 Step 5: Backing up old volume and replacing with new one..."
# Backup the old volume
docker volume create expense-tracking-migration_expenses-db-postgres-volume-backup
docker run --rm -v expense-tracking_expenses-db-postgres-volume:/old-data -v expense-tracking-migration_expenses-db-postgres-volume-backup:/backup alpine sh -c "cp -r /old-data/* /backup/"

# Remove the old volume from the main compose file
docker volume rm expense-tracking_expenses-db-postgres-volume

# Rename the new volume to match the main compose file
docker volume create expense-tracking_expenses-db-postgres-volume
docker run --rm -v expense-tracking-migration_expenses-db-postgres-volume-new:/new-data -v expense-tracking_expenses-db-postgres-volume:/final-data alpine sh -c "cp -r /new-data/* /final-data/"

echo "📋 Step 6: Cleaning up..."
docker volume rm expense-tracking-migration_expenses-db-postgres-volume-new
rm postgres14_dump.sql

echo "✅ Migration completed successfully!"
echo "🎉 You can now start your application with: docker-compose up -d"
echo "💾 Your old data is backed up in: expense-tracking-migration_expenses-db-postgres-volume-backup" 