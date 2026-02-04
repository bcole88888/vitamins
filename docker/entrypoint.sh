#!/bin/sh
set -e

# Initialize database if it doesn't exist
if [ ! -f /app/data/vitamins.db ]; then
    echo "Initializing database..."
    npx prisma db push --skip-generate
    echo "Database initialized."
fi

# Run migrations if needed
echo "Running database migrations..."
npx prisma db push --skip-generate

# Start the application
exec node server.js
