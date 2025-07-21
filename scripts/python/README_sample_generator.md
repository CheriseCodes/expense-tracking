# Sample Data Generator

This script generates random expense data in CSV format for testing the expense tracking application.

## Prerequisites

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Run the generator script from anywhere in the project:

```bash
# From project root
python scripts/python/sample_data_generator.py

# From scripts/python directory
cd scripts/python
python sample_data_generator.py

# From any other directory (as long as you're in the project)
python /path/to/project/scripts/python/sample_data_generator.py
```

## What the script does

1. **Generates random data**:
   - Random number of purchases (20-60)
   - Random items from predefined categories
   - Random vendors from predefined list
   - Random prices (0-40 range)
   - Random dates (1-31, representing days of month)
   - Random notes (some empty, some with fake sentences)

2. **Creates CSV file**:
   - Tab-separated format
   - Automatically saves to `sample_data/` directory
   - Filename includes number of purchases (e.g., `27-purchases.csv`)

3. **Dynamic path resolution**:
   - Works from any directory
   - Automatically finds the correct `sample_data` location
   - Creates directory if it doesn't exist

## Output Format

The generated CSV files have these columns:
- `Item`: Expense category (Gift, Entertainment, Groceries, etc.)
- `Vendor`: Where the purchase was made
- `Price`: Amount spent (0-40 range)
- `Date`: Day of the month (1-31)
- `Notes`: Optional notes about the expense

## Sample Categories

- Gift, Student Loans, Entertainment, Education, Unknown
- Vacation, Bills, Organization, Pets, Groceries
- Public Transit, Hobbies, Fashion, Parking
- Charity, Restaurant, Gasoline, Career, Banking fees

## Sample Vendors

- NSLSC, Ticketmaster, Amazon, Canadian Tire
- Telus, Rens Pets, Sobeys, Presto
- Walmart, Shoppers Drug Mart, Freshco
- And many more...

## Integration with Import Script

The generated CSV files are compatible with the `import_csv_data.py` script:
1. Run this generator to create sample data
2. Use the import script to load the data into the database
3. Test your expense tracking application with realistic data

## Recent Updates

- **Dynamic path resolution**: Script works from any directory
- **Automatic directory creation**: Creates `sample_data/` if it doesn't exist
- **Better logging**: Shows exactly where files are being written
- **Enhanced requirements**: Added pandas, numpy, and faker dependencies 