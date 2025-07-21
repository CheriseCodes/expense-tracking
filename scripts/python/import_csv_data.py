#!/usr/bin/env python3
"""
CSV Data Import Script for Expense Tracking Database

This script reads CSV files from the sample_data directory and imports
the expense data into the PostgreSQL database. It handles:
- Reading tab-separated CSV files
- Mapping CSV columns to database schema
- Creating users and categories as needed
- Importing expenses with proper relationships
- Error handling and logging
"""

import os
import sys
import csv
import logging
import uuid
from datetime import datetime, date
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'expenses_db',
    'user': 'postgres',
    'password': os.getenv('POSTGRES_PASSWORD', 'password')  # Use environment variable with fallback
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('import_log.txt'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CSVImporter:
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            logger.info("Successfully connected to database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("Database connection closed")
    
    def create_default_user(self) -> str:
        """Create a default user for importing data"""
        try:
            # Check if default user exists
            self.cursor.execute(
                "SELECT user_id FROM users WHERE username = %s",
                ('default_user',)
            )
            result = self.cursor.fetchone()
            
            if result:
                logger.info("Default user already exists")
                return str(result['user_id'])
            
            # Create default user
            user_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO users (user_id, username, email, password_hash, role, created_at, last_login)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                'default_user',
                'default@example.com',
                'dummy_hash_for_import_only',
                'regular',
                datetime.now(),
                datetime.now()
            ))
            
            self.connection.commit()
            logger.info(f"Created default user with ID: {user_id}")
            return user_id
            
        except Exception as e:
            logger.error(f"Error creating default user: {e}")
            self.connection.rollback()
            raise
    
    def get_or_create_category(self, category_name: str) -> str:
        """Get existing category or create new one"""
        try:
            # Check if category exists
            self.cursor.execute(
                "SELECT category_id FROM categories WHERE category_name = %s",
                (category_name,)
            )
            result = self.cursor.fetchone()
            
            if result:
                return str(result['category_id'])
            
            # Create new category
            category_id = str(uuid.uuid4())
            self.cursor.execute(
                "INSERT INTO categories (category_id, category_name) VALUES (%s, %s)",
                (category_id, category_name)
            )
            
            self.connection.commit()
            logger.info(f"Created category: {category_name} with ID: {category_id}")
            return category_id
            
        except Exception as e:
            logger.error(f"Error creating category {category_name}: {e}")
            self.connection.rollback()
            raise
    
    def import_expense(self, user_id: str, item: str, vendor: str, price: float, 
                      purchase_date: int, method: str = None, notes: str = None) -> str:
        """Import a single expense record"""
        try:
            expense_id = str(uuid.uuid4())
            
            # Convert day number to actual date (assuming current month/year)
            today = date.today()
            purchase_date_obj = date(today.year, today.month, purchase_date)
            
            # Insert expense
            self.cursor.execute("""
                INSERT INTO expenses (expense_id, user_id, item, vendor, price, date_purchased, payment_method, notes, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                expense_id,
                user_id,
                item,
                vendor,
                price,
                purchase_date_obj,
                method,
                notes,
                datetime.now()
            ))
            
            # Create category relationship
            category_id = self.get_or_create_category(item)
            self.cursor.execute("""
                INSERT INTO expense_categories (expense_id, category_id)
                VALUES (%s, %s)
            """, (expense_id, category_id))
            
            self.connection.commit()
            return expense_id
            
        except Exception as e:
            logger.error(f"Error importing expense {item}: {e}")
            self.connection.rollback()
            raise
    
    def process_csv_file(self, file_path: str, user_id: str) -> int:
        """Process a single CSV file and import all expenses"""
        imported_count = 0
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file, delimiter='\t')
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 to account for header
                    try:
                        # Extract and validate data
                        item = row.get('Item', '').strip()
                        vendor = row.get('Vendor', '').strip()
                        price_str = row.get('Price', '0').strip()
                        date_str = row.get('Date', '1').strip()
                        method = row.get('Method', '').strip()
                        notes = row.get('Notes', '').strip()
                        
                        # Validate required fields
                        if not item or not vendor:
                            logger.warning(f"Row {row_num}: Missing required fields (item or vendor)")
                            continue
                        
                        # Convert price to float
                        try:
                            price = float(price_str)
                        except ValueError:
                            logger.warning(f"Row {row_num}: Invalid price '{price_str}', using 0.0")
                            price = 0.0
                        
                        # Convert date to int
                        try:
                            purchase_date = int(date_str)
                            if purchase_date < 1 or purchase_date > 31:
                                logger.warning(f"Row {row_num}: Invalid date '{date_str}', using 1")
                                purchase_date = 1
                        except ValueError:
                            logger.warning(f"Row {row_num}: Invalid date '{date_str}', using 1")
                            purchase_date = 1
                        
                        # Import the expense
                        expense_id = self.import_expense(
                            user_id=user_id,
                            item=item,
                            vendor=vendor,
                            price=price,
                            purchase_date=purchase_date,
                            method=method if method else None,
                            notes=notes if notes else None
                        )
                        
                        imported_count += 1
                        logger.info(f"Imported expense: {item} - ${price:.2f} from {vendor}")
                        
                    except Exception as e:
                        logger.error(f"Error processing row {row_num}: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error reading CSV file {file_path}: {e}")
            raise
        
        return imported_count
    
    def import_all_csv_files(self, sample_data_dir: str = None):
        """Import all CSV files from the sample_data directory"""
        # Dynamically find the sample_data directory relative to this script
        if sample_data_dir is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            sample_data_dir = os.path.join(script_dir, "..", "..", "sample_data")
            logger.info(f"Looking for CSV files in: {os.path.abspath(sample_data_dir)}")
        try:
            self.connect()
            
            # Create default user
            user_id = self.create_default_user()
            
            # Find all CSV files
            sample_data_path = Path(sample_data_dir)
            csv_files = list(sample_data_path.glob("*.csv"))
            
            if not csv_files:
                logger.warning(f"No CSV files found in {sample_data_path}")
                return
            
            total_imported = 0
            
            for csv_file in csv_files:
                logger.info(f"Processing file: {csv_file.name}")
                try:
                    imported_count = self.process_csv_file(str(csv_file), user_id)
                    total_imported += imported_count
                    logger.info(f"Successfully imported {imported_count} expenses from {csv_file.name}")
                except Exception as e:
                    logger.error(f"Failed to process {csv_file.name}: {e}")
                    continue
            
            logger.info(f"Import completed! Total expenses imported: {total_imported}")
            
        except Exception as e:
            logger.error(f"Import failed: {e}")
            raise
        finally:
            self.disconnect()

def main():
    """Main function to run the import process"""
    try:
        importer = CSVImporter(DB_CONFIG)
        importer.import_all_csv_files()
        print("CSV import completed successfully!")
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 