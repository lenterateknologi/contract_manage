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

DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p database_dumps
OUTPUT_FILE="database_dumps/data_only_${DATE}.sql"

echo "=== Export Data Only (Tanpa Skema/Struktur) ==="
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_DATABASE"
echo "Username: $DB_USERNAME"

export PGPASSWORD="$DB_PASSWORD"

# -a / --data-only: Hanya export data, tidak ada DDL (CREATE TABLE, dsb.)
# --inserts: Gunakan perintah INSERT INTO (lebih aman saat import)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -a --inserts > temp_dump.sql

if [ $? -eq 0 ]; then
    # Nonaktifkan constraint foreign key saat restore agar insert data lancar
    echo "SET session_replication_role = 'replica';" > "$OUTPUT_FILE"
    cat temp_dump.sql >> "$OUTPUT_FILE"
    echo "SET session_replication_role = 'origin';" >> "$OUTPUT_FILE"
    
    rm temp_dump.sql
    echo "Backup sukses disimpan di: ./$OUTPUT_FILE"
else
    echo "Gagal melakukan export data!"
    rm -f temp_dump.sql
    exit 1
fi
