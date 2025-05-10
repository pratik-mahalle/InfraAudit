#!/bin/bash

# Set -e to exit on errors
set -e

# Make sure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

# Run the export script
echo "Running database export script..."
node export_database.js

# Create a single zip file with all CSVs if the directory exists
if [ -d "database_exports" ]; then
  echo "Creating zip file of exports..."
  cd database_exports
  zip -r ../database_export.zip *.csv
  cd ..
  echo "Database export completed. All tables have been exported to individual CSV files in the database_exports directory."
  echo "A zip file containing all CSVs has also been created: database_export.zip"
else
  echo "Error: database_exports directory was not created. Export may have failed."
  exit 1
fi