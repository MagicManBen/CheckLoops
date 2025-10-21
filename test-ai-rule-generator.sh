#!/bin/bash

# AI Rule Generator - Test Suite
# Comprehensive tests for different rule types

SUPABASE_URL="https://unveoqnlqnobufhublyw.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME"
ENDPOINT="${SUPABASE_URL}/functions/v1/ai-rule-generator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 AI Rule Generator Test Suite"
echo "================================"
echo ""

# Function to test a rule
test_rule() {
    local test_name="$1"
    local rule_text="$2"
    local expected_type="$3"
    
    echo -e "${YELLOW}Test: ${test_name}${NC}"
    echo "Input: \"${rule_text}\""
    
    response=$(curl -s -X POST "${ENDPOINT}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"rule_text\": \"${rule_text}\", \"site_id\": 2}")
    
    # Check if successful
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Success${NC}"
        
        # Extract rule type
        rule_type=$(echo "$response" | grep -o '"rule_type":"[^"]*"' | cut -d'"' -f4)
        echo "   Rule Type: $rule_type"
        
        # Extract name
        name=$(echo "$response" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Name: $name"
        
        # Extract human readable
        human=$(echo "$response" | grep -o '"human_readable":"[^"]*"' | cut -d'"' -f4)
        echo "   Human: $human"
        
        # Verify expected type
        if [ "$rule_type" = "$expected_type" ]; then
            echo -e "${GREEN}   Type matches expected!${NC}"
        else
            echo -e "${RED}   ⚠️  Expected type: $expected_type, got: $rule_type${NC}"
        fi
    else
        echo -e "${RED}❌ Failed${NC}"
        echo "Response: $response"
    fi
    
    echo ""
}

# Test 1: Clinician Slot Restriction
test_rule \
    "Clinician Cannot Perform Slot Type" \
    "Dr Smith cannot see wound check appointments" \
    "clinician_slot_restriction"

# Test 2: Slot Duration Requirement
test_rule \
    "Minimum Duration Requirement" \
    "Consultation slots must be at least 20 minutes" \
    "slot_duration_requirement"

# Test 3: Daily Slot Count
test_rule \
    "Minimum Daily Count" \
    "There must be at least 2 emergency slots each day" \
    "daily_slot_count"

# Test 4: Multiple Clinicians
test_rule \
    "Multiple Clinician Restriction" \
    "Dr Johnson and Dr Williams cannot perform blood tests" \
    "clinician_slot_restriction"

# Test 5: Weekday Only Rule
test_rule \
    "Weekday Duty Requirement" \
    "There must be at least one Duty appointment each weekday" \
    "daily_slot_count"

# Test 6: Duration with Specific Value
test_rule \
    "Exact Duration Requirement" \
    "Emergency appointments must be exactly 15 minutes" \
    "slot_duration_requirement"

# Test 7: Maximum Duration
test_rule \
    "Maximum Duration Limit" \
    "Walk-in appointments cannot be longer than 10 minutes" \
    "slot_duration_requirement"

# Test 8: Time Restriction
test_rule \
    "Time Window Restriction" \
    "Surgical procedures cannot be scheduled after 4pm on Fridays" \
    "time_restriction"

# Test 9: Distribution Rule
test_rule \
    "Clinician Distribution" \
    "Dr Martinez, Dr Chen, and Dr Patel must each have at least one teaching session per week" \
    "slot_distribution"

# Test 10: Complex Multi-Condition
test_rule \
    "Complex Rule" \
    "Blood draw appointments must be between 8am and 11am on weekdays and be at least 10 minutes long" \
    "time_restriction"

echo "================================"
echo "Test suite completed!"
echo ""
echo "💡 Tip: Review the output above to ensure AI is interpreting rules correctly"
echo "📝 Note: Some complex rules may be split into multiple simpler rules"
echo ""
