import math
import random
import pandas as pd
import numpy as np
from faker import Faker

num_of_purchases = np.random.randint(20, 60)

print(
    f"Generating a tab separated csv file with {num_of_purchases} purchases...")

items = ['Gift', 'Student Loans', 'Entertainment', 'Education', 'Unknown',
         'Vacation', 'Bills', 'Organization', 'Pets', 'Groceries',
         'Public Transit', 'Hobbies', 'Fashion', 'Parking',
         'Charity', 'Restaurant', 'Gasoline', 'Parking', 'Career',
         'Banking fees']

fake_items = pd.Series([random.choice(items) for _ in range(num_of_purchases)])

vendors = ['NSLSC', 'Ticketmaster', 'Amazon', 'Canadian Tire',
           'Telus', 'Rens Pets', 'Sobeys', 'Presto',
           'Rex Beauty Inc (BSW)', 'City of Toronto',
           'TPL Foundation', 'Walmart', 'Shoppers Drug Mart',
           'Freshco', 'Daily Bread',
           'CNIB', 'CanadaHelps', 'Petro',
           'Sick Kids foundation', 'H&M', 'Toronto Humane',
           'Real Canadian Super Store (RCSS)', 'Food Basics', 'Sport Check',
           'Loblaws', 'ABC PLANE FEE (SCAM)', 'Tahinis',
           'Bar Burrito', 'Ikea', 'Dollarama', 'Spotify',
           'Paramount Fine Foods', 'Chick-Fil-A',
           'Chatime', 'Thai Express', 'The Alley', 'Cinnabon', 'Tim Hortons',
           'Scotiabank', 'Longos', 'Patties',
           'Dollar Tree']

fake_vendors = pd.Series([random.choice(vendors)
                         for _ in range(num_of_purchases)])

# Fake notes
fake = Faker()
fake_notes = pd.Series([random.choice(['', '', fake.sentence(nb_words=5)])
                       for _ in range(num_of_purchases)])

# Fake prices
fake_prices = pd.Series(
    [math.fabs(np.random.rand())*40 for _ in range(num_of_purchases)])

# Fake dates
fake_dates = pd.Series(np.random.randint(1, 31, size=(num_of_purchases)))

purchases = pd.DataFrame({'Item': fake_items, 'Vendor': fake_vendors,
                         'Price': fake_prices, 'Date': fake_dates, 'Notes': fake_notes})
print(f"Final result...")
print(purchases)
purchases.to_csv(
    f"../../sample_data/{num_of_purchases}-purchases.csv", sep="\t")
