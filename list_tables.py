import json
import urllib.request
import urllib.error
import urllib.parse
import csv
import os
from datetime import datetime

# Supabase Credentials
SUPABASE_URL = "https://zigrththhduywepgtgvc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZ3J0aHRoaGR1eXdlcGd0Z3ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcyODAzNywiZXhwIjoyMDc1MzA0MDM3fQ.AFEStD1aKvmgUx9FZ6EZ_E1-ZVlr5jJNDTI0urZJGhI"

# Tables to clean (exclude users and inventory)
TABLES_TO_CLEAN = ["orders", "order_items", "expenses", "investments"]

# Cutoff date (records before this date will be deleted)
CUTOFF_DATE = "2026-01-01 00:00:00"

def list_all_tables():
    print(f"Connecting to Supabase at {SUPABASE_URL}...")
    
    # URL for PostgREST root, which returns OpenAPI spec including table definitions
    api_url = f"{SUPABASE_URL}/rest/v1/"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = response.read()
            schema = json.loads(data)
            
            # PostgREST OpenAPI v2 'definitions' contains the table schemas
            definitions = schema.get('definitions', {})
            
            if definitions:
                print("\nTables found in Supabase DB:")
                print("-" * 30)
                for table_name in definitions.keys():
                    print(f"- {table_name}")
                print("-" * 30)
            else:
                print("\nNo table definitions found in the API response.")
                print("Raw response keys:", schema.keys())
                
    except urllib.error.HTTPError as e:
        print(f"\nHTTP Error accessing API: {e.code} - {e.reason}")
        print("Detailed error:", e.read().decode())
    except Exception as e:
        print(f"\nAn error occurred: {e}")

def fetch_records(table_name, cutoff_date):
    """Fetch records older than cutoff date from a table"""
    # URL encode the cutoff date to handle spaces
    encoded_date = urllib.parse.quote(cutoff_date)
    api_url = f"{SUPABASE_URL}/rest/v1/{table_name}?added_at=lt.{encoded_date}&select=*"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=representation"
    }
    
    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = response.read()
            records = json.loads(data)
            return records
    except urllib.error.HTTPError as e:
        print(f"Error fetching records from {table_name}: {e.code} - {e.reason}")
        return []
    except Exception as e:
        print(f"Error fetching records from {table_name}: {e}")
        return []

def backup_to_csv(table_name, records, backup_folder):
    """Backup records to CSV file"""
    if not records:
        print(f"  No records to backup for {table_name}")
        return
    
    # Create backup folder if it doesn't exist
    os.makedirs(backup_folder, exist_ok=True)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(backup_folder, f"{table_name}_backup_{timestamp}.csv")
    
    # Write to CSV
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        if records:
            fieldnames = records[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)
    
    print(f"  Backed up {len(records)} records to {filename}")

def delete_records(table_name, cutoff_date):
    """Delete records older than cutoff date from a table"""
    # URL encode the cutoff date to handle spaces
    encoded_date = urllib.parse.quote(cutoff_date)
    api_url = f"{SUPABASE_URL}/rest/v1/{table_name}?added_at=lt.{encoded_date}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=representation"
    }
    
    try:
        req = urllib.request.Request(api_url, headers=headers, method='DELETE')
        with urllib.request.urlopen(req) as response:
            data = response.read()
            deleted = json.loads(data)
            return deleted
    except urllib.error.HTTPError as e:
        print(f"  Error deleting records from {table_name}: {e.code} - {e.reason}")
        error_detail = e.read().decode()
        print(f"  Details: {error_detail}")
        return []
    except Exception as e:
        print(f"  Error deleting records from {table_name}: {e}")
        return []

def cleanup_old_records():
    """Main function to backup and delete old records"""
    print(f"Connecting to Supabase at {SUPABASE_URL}...")
    print(f"Cleaning records before {CUTOFF_DATE}")
    print(f"Tables to clean: {', '.join(TABLES_TO_CLEAN)}")
    print(f"Tables excluded: users, inventory")
    print("=" * 60)
    
    backup_folder = "backup"
    
    for table_name in TABLES_TO_CLEAN:
        print(f"\nProcessing table: {table_name}")
        print("-" * 40)
        
        # Fetch old records
        print(f"  Fetching records before {CUTOFF_DATE}...")
        records = fetch_records(table_name, CUTOFF_DATE)
        
        if not records:
            print(f"  No records found to delete in {table_name}")
            continue
        
        print(f"  Found {len(records)} records to delete")
        
        # Backup to CSV
        print(f"  Creating backup...")
        backup_to_csv(table_name, records, backup_folder)
        
        # Delete records
        print(f"  Deleting records...")
        deleted = delete_records(table_name, CUTOFF_DATE)
        
        if deleted:
            print(f"  ✓ Successfully deleted {len(deleted)} records from {table_name}")
        else:
            print(f"  ℹ Deletion completed for {table_name}")
    
    print("\n" + "=" * 60)
    print("Cleanup completed!")
    print(f"Backups saved in '{backup_folder}' folder")

if __name__ == "__main__":
    # Uncomment the line below to run cleanup instead of listing tables
    cleanup_old_records()
    
    # To list tables only (original functionality)
    # list_all_tables()
