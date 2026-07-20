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

OUTPUT_FILE="database_dump.sql"

echo "=== Memulai Export Database PostgreSQL ==="
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_DATABASE"
echo "Username: $DB_USERNAME"

# Set password environment variable untuk pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Lakukan dump data dan skema menggunakan pg_dump
# -c: Clean (drop) objects sebelum create
# -O: No owner
# -x: No privilege
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c -O -x > temp_dump.sql

if [ $? -eq 0 ]; then
    # Bungkus hasil dump dengan mengabaikan foreign key constraints (session_replication_role = replica)
    echo "SET session_replication_role = 'replica';" > "$OUTPUT_FILE"
    cat temp_dump.sql >> "$OUTPUT_FILE"
    echo "SET session_replication_role = 'origin';" >> "$OUTPUT_FILE"
    
    rm temp_dump.sql
    echo "Backup sukses disimpan di: ./$OUTPUT_FILE"
else
    echo "Gagal melakukan export database!"
    rm -f temp_dump.sql
    exit 1
fi
