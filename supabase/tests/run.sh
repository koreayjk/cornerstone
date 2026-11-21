#!/usr/bin/env bash
# Build a throwaway database from the migrations and run the RLS tests.
# Usage: DATABASE_URL=postgres://postgres@localhost:5432/postgres supabase/tests/run.sh
# The database must be empty (it gets a stand-in auth/storage schema). CI uses a fresh container.
set -euo pipefail
cd "$(dirname "$0")/../.."
URL="${DATABASE_URL:?set DATABASE_URL to an empty PostgreSQL database}"
psql() { command psql "$URL" -v ON_ERROR_STOP=1 -q "$@"; }

psql -f supabase/tests/supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -f "$f"; done
psql -f supabase/seed.sql
psql -f supabase/tests/rls_test.sql
