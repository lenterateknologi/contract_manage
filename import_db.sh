#!/bin/bash

# Baca file .env Laravel
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "File .env tidak ditemukan!"
    exit 1
fi

DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-contract_manage}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}

INPUT_FILE="database_dump.sql"

if [ ! -f "$INPUT_FILE" ]; then
    echo "File dump database '$INPUT_FILE' tidak ditemukan!"
    exit 1
fi

echo "=== Memulai Import Database PostgreSQL ==="
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_DATABASE"
echo "Username: $DB_USERNAME"
echo "File: $INPUT_FILE"

# Set password environment variable untuk psql
export PGPASSWORD="$DB_PASSWORD"

# Jalankan import sql file
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f "$INPUT_FILE"

if [ $? -eq 0 ]; then
    echo "Restore/Import database sukses!"
else
    echo "Gagal melakukan import database!"
    exit 1
fi
