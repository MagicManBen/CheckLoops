# CSV Row Order Preservation System

This update adds a feature to preserve the original CSV row order in the database. The system now:

1. Tracks the original row number from the CSV in a new field `csv_row_number`
2. Sorts records by this number when uploading to ensure they maintain the same order
3. Creates a new database column to store this information

## To complete the setup:

1. The edge function has been updated already
2. Next, run the SQL migration in the Supabase dashboard:
   - Go to your Supabase project
   - Navigate to the SQL Editor
   - Copy and paste the contents from the file `add_csv_row_number_column.sql`
   - Run the query to add the new column

## How It Works

- The JavaScript code assigns a row number to each record during CSV parsing
- The Edge Function preserves this order when inserting into the database
- The data is sorted by row number before insertion
- When retrieving data, you can sort by `csv_row_number` to get the exact same order as the original CSV

## Query Example

To retrieve data in the original CSV order:

```sql
SELECT * FROM emis_apps 
ORDER BY csv_row_number ASC;
```

This ensures that the data in Supabase will appear in exactly the same order as it was in the original CSV file.