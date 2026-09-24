#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Baca file .env Laravel jika DB_* belum di-set
if [ -f .env ]; then
    [ -z "$DB_HOST" ] && DB_HOST=$(grep -E '^DB_HOST=' .env | cut -d '=' -f 2- | tr -d '"\r' | tr -d "'")
    [ -z "$DB_PORT" ] && DB_PORT=$(grep -E '^DB_PORT=' .env | cut -d '=' -f 2- | tr -d '"\r' | tr -d "'")
    [ -z "$DB_DATABASE" ] && DB_DATABASE=$(grep -E '^DB_DATABASE=' .env | cut -d '=' -f 2- | tr -d '"\r' | tr -d "'")
    [ -z "$DB_USERNAME" ] && DB_USERNAME=$(grep -E '^DB_USERNAME=' .env | cut -d '=' -f 2- | tr -d '"\r' | tr -d "'")
    [ -z "$DB_PASSWORD" ] && DB_PASSWORD=$(grep -E '^DB_PASSWORD=' .env | cut -d '=' -f 2- | tr -d '"\r' | tr -d "'")
fi

DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-contract_manage}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}

DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p database_dumps
chmod 777 database_dumps 2>/dev/null || true
OUTPUT_FILE="database_dumps/database_dump_${DATE}.sql"
TEMP_FILE=$(mktemp /tmp/temp_dump_XXXXXX.sql)

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
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c -O -x > "$TEMP_FILE"

if [ $? -eq 0 ]; then
    # Bungkus hasil dump dengan mengabaikan foreign key constraints (session_replication_role = replica)
    echo "SET session_replication_role = 'replica';" > "$OUTPUT_FILE"
    cat "$TEMP_FILE" >> "$OUTPUT_FILE"
    echo "SET session_replication_role = 'origin';" >> "$OUTPUT_FILE"
    
    rm -f "$TEMP_FILE"
    chmod 666 "$OUTPUT_FILE" 2>/dev/null || true
    echo "Backup sukses disimpan di: ./$OUTPUT_FILE"
else
    echo "Gagal melakukan export database!"
    rm -f "$TEMP_FILE"
    exit 1
fi
