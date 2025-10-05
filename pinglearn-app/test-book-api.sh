#!/bin/bash

# Test script for POST /api/textbooks/books endpoint
# Usage: ./test-book-api.sh

echo "🧪 Testing POST /api/textbooks/books endpoint"
echo "=============================================="

# Test 1: Invalid seriesId (should return 400)
echo ""
echo "Test 1: Invalid seriesId format"
curl -X POST http://localhost:3006/api/textbooks/books \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": "not-a-uuid",
    "volumeNumber": 1,
    "volumeTitle": "Test Book",
    "authors": ["Test Author"]
  }' | jq .

# Test 2: Missing required fields (should return 400)
echo ""
echo "Test 2: Missing required fields"
curl -X POST http://localhost:3006/api/textbooks/books \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": "550e8400-e29b-41d4-a716-446655440000",
    "volumeNumber": 1
  }' | jq .

# Test 3: Valid request (will fail FK if series doesn't exist)
echo ""
echo "Test 3: Valid request structure (FK may fail if series doesn't exist)"
curl -X POST http://localhost:3006/api/textbooks/books \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": "550e8400-e29b-41d4-a716-446655440000",
    "volumeNumber": 1,
    "volumeTitle": "Test Mathematics Book",
    "isbn": "978-81-7450-678-5",
    "edition": "2024 Edition",
    "authors": ["NCERT Team"],
    "publicationYear": 2024,
    "totalPages": 350
  }' | jq .

echo ""
echo "✅ Test script completed"
