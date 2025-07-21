-- Migration script to convert fixed-length character columns to variable-length varchar
-- This fixes the issue where char(n) columns pad shorter values with spaces

-- Convert users.role from char(30) to varchar(30)
ALTER TABLE users ALTER COLUMN role TYPE varchar(30);

-- Convert wishlist.status from char(20) to varchar(20)  
ALTER TABLE wishlist ALTER COLUMN status TYPE varchar(20);

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('users', 'wishlist') 
    AND column_name IN ('role', 'status')
ORDER BY table_name, column_name; 