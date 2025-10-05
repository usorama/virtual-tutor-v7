#!/bin/bash

# Test script for POST /api/textbooks/series endpoint
# This is a manual integration test

echo "================================"
echo "Testing POST /api/textbooks/series"
echo "================================"
echo ""

# First, get a valid curriculum_id from the database
echo "Step 1: Fetching a valid curriculum_id from database..."
CURRICULUM_ID=$(npx supabase db execute "SELECT id FROM public.curriculum_data LIMIT 1" --csv | tail -1)

if [ -z "$CURRICULUM_ID" ]; then
  echo "❌ Error: No curriculum_data found in database"
  echo "Please ensure database has curriculum_data records"
  exit 1
fi

echo "✅ Found curriculum_id: $CURRICULUM_ID"
echo ""

# Test 1: Valid request
echo "Test 1: Valid request (should return 201 Created)"
echo "Request body:"
cat << JSON
{
  "seriesName": "Test Series $(date +%s)",
  "publisher": "Test Publisher",
  "curriculumId": "$CURRICULUM_ID",
  "description": "This is a test series"
}
JSON

curl -X POST http://localhost:3006/api/textbooks/series \
  -H "Content-Type: application/json" \
  -d "{
    \"seriesName\": \"Test Series $(date +%s)\",
    \"publisher\": \"Test Publisher\",
    \"curriculumId\": \"$CURRICULUM_ID\",
    \"description\": \"This is a test series\"
  }" | jq .

echo ""
echo ""

# Test 2: Invalid curriculum_id (should return 400)
echo "Test 2: Invalid curriculum_id (should return 400 with DATA_INTEGRITY_ERROR)"
curl -X POST http://localhost:3006/api/textbooks/series \
  -H "Content-Type: application/json" \
  -d '{
    "seriesName": "Test Series",
    "publisher": "Test Publisher",
    "curriculumId": "00000000-0000-0000-0000-000000000000",
    "description": "This should fail"
  }' | jq .

echo ""
echo ""

# Test 3: Missing required field (should return 400)
echo "Test 3: Missing required field (should return 400 with VALIDATION_ERROR)"
curl -X POST http://localhost:3006/api/textbooks/series \
  -H "Content-Type: application/json" \
  -d '{
    "publisher": "Test Publisher",
    "curriculumId": "'"$CURRICULUM_ID"'"
  }' | jq .

echo ""
echo ""

# Test 4: Invalid curriculumId format (should return 400)
echo "Test 4: Invalid UUID format (should return 400 with VALIDATION_ERROR)"
curl -X POST http://localhost:3006/api/textbooks/series \
  -H "Content-Type: application/json" \
  -d '{
    "seriesName": "Test Series",
    "publisher": "Test Publisher",
    "curriculumId": "not-a-uuid"
  }' | jq .

echo ""
echo "================================"
echo "Tests complete"
echo "================================"
