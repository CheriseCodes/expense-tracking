# CSV Data Import Script

This script imports expense data from CSV files in the `sample_data` directory into the PostgreSQL database. It's designed to work with the expense tracking application's FastAPI backend and React frontend.

## Prerequisites

1. Make sure your Docker Compose services are running:
   ```bash
   docker-compose up -d
   ```

2. Set the database password environment variable (optional, defaults to 'password'):
   ```bash
   export POSTGRES_PASSWORD=your_actual_password
   ```
   
   **Note**: The script uses the same environment variable as your Docker Compose setup.

3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Run the import script from anywhere in the project:

```bash
# From project root
python scripts/python/import_csv_data.py

# From scripts/python directory
cd scripts/python
python import_csv_data.py

# From any other directory (as long as you're in the project)
python /path/to/project/scripts/python/import_csv_data.py
```

## What the script does

1. **Connects to the database** using the configuration in the script
2. **Creates a default user** if one doesn't exist (for importing data)
   - Username: `default_user`
   - Role: `regular` (validates against schema requirements)
   - Email: `default@example.com`
3. **Reads all CSV files** from the `sample_data` directory (automatically finds the correct path)
4. **Processes each file** and imports the expense data:
   - Maps CSV columns to database fields
   - Creates categories automatically based on the "Item" field
   - Converts date numbers to actual dates (using current month/year)
   - Imports payment method information
   - Handles data validation and error logging
   - Strips whitespace from all text fields
5. **Creates relationships** between expenses and categories
6. **Logs all operations** to both console and `import_log.txt`

## CSV Format Expected

The script expects tab-separated CSV files with these columns:
- `Item`: The expense category/type
- `Vendor`: Where the purchase was made
- `Price`: The amount spent
- `Date`: Day of the month (1-31)
- `Method`: Payment method used (optional)
- `Notes`: Optional notes about the expense

## Output

- Console output showing import progress
- Detailed log file: `import_log.txt`
- All expenses imported under a default user account
- Categories automatically created based on expense items
- Clean data with no trailing spaces or formatting issues

## Error Handling

The script includes comprehensive error handling:
- Invalid data is logged and skipped
- Database connection errors are reported
- Each row is processed independently (one bad row won't stop the entire import)
- Rollback on database errors to maintain data integrity
- Automatic whitespace trimming prevents formatting issues

## Recent Updates

### Database Schema Fixes
- **Fixed column types**: Updated database scripts to use `varchar(30)` instead of `char(30)` for role fields
- **No more padding**: Variable-length columns prevent trailing space issues
- **Migration script**: Created `scripts/sql/migrate-fixed-length-to-varchar.sql` for existing databases

### Script Improvements
- **Dynamic path resolution**: Script works from any directory
- **Environment variable support**: Uses `POSTGRES_PASSWORD` for secure credential management
- **Enhanced logging**: Better error reporting and progress tracking
- **Data validation**: Ensures imported data meets schema requirements 