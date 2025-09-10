import pandas as pd
import json

# Read all sheets from the Excel file
excel_file = 'HolidayTransfer.xlsx'
all_sheets = pd.read_excel(excel_file, sheet_name=None)

print("=" * 60)
print("EXCEL FILE STRUCTURE")
print("=" * 60)
print(f"Number of sheets: {len(all_sheets)}")
print(f"Sheet names: {list(all_sheets.keys())}")
print()

# Analyze each sheet
for sheet_name, df in all_sheets.items():
    print(f"\nSheet: {sheet_name}")
    print("-" * 40)
    print(f"Shape: {df.shape[0]} rows x {df.shape[1]} columns")
    print(f"Columns: {list(df.columns)}")
    print("\nFirst few rows:")
    print(df.head())
    print("\nData types:")
    print(df.dtypes)
    
    # Check for unique values in key columns
    if 'Name' in df.columns:
        print(f"\nUnique names: {df['Name'].nunique()}")
        print(f"Sample names: {df['Name'].dropna().unique()[:5].tolist()}")
    
    print("\n" + "=" * 60)