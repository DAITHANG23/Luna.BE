#!/bin/bash
set -e

echo "🔍 Checking dependencies..."

# Only check Redis (local container)
echo "⏳ Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT}..."
until nc -z ${REDIS_HOST} ${REDIS_PORT}; do
  echo "   Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# MongoDB Atlas doesn't need checking - it's always available
echo "📡 MongoDB Atlas connection will be handled by application"

echo "🚀 Starting application..."
exec "$@"