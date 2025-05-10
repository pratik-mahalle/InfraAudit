#!/bin/bash

# Set -e to exit on errors
set -e

# Make sure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

# Create main export directory
export_dir="cloudguard_exports"
mkdir -p $export_dir

# Run both export scripts
echo "Starting CSV export..."
node export_database.js

echo "Starting JSON export..."
node export_database_json.js

# Copy files to export directory
echo "Copying all exports to $export_dir directory..."
cp database_export.zip $export_dir/
cp -r database_exports/* $export_dir/
cp -r json_exports/* $export_dir/

# Create an all-inclusive zip file
zip -r cloudguard_all_exports.zip $export_dir

echo "==========================================================="
echo "Export complete! The following files are available:"
echo "1. database_export.zip - All CSV files in one archive"
echo "2. cloudguard_all_exports.zip - All CSV and JSON files"
echo "3. $export_dir/ - Directory containing all individual files"
echo "==========================================================="