#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

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

# Periksa apakah argumen nama file telah diberikan
if [ -z "$1" ]; then
    echo "Gunakan: ./import.sh <nama_file_dump>"
    echo "Contoh: ./import.sh database_dump_20260720_085654.sql"
    exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
    if [ -f "database_dumps/$INPUT_FILE" ]; then
        INPUT_FILE="database_dumps/$INPUT_FILE"
    else
        echo "File dump database '$INPUT_FILE' tidak ditemukan!"
        exit 1
    fi
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
