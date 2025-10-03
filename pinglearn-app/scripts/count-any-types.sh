#!/bin/bash
# Count 'any' type violations in PingLearn codebase
# Version: 1.0
# Date: 2025-10-03

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== PingLearn 'any' Type Violation Counter ===${NC}"
echo -e "${BLUE}Date: $(date)${NC}"
echo ""

# Set base directory to project root
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR" || exit 1

echo -e "${YELLOW}Searching in: $BASE_DIR/src${NC}"
echo ""

# Count explicit ': any' declarations
EXPLICIT_COUNT=$(grep -rn ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "/\*" | wc -l | tr -d ' ')

# Count type assertions 'as any'
ASSERTION_COUNT=$(grep -rn "as any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "/\*" | wc -l | tr -d ' ')

# Count generic types with any (simplified)
GENERIC_COUNT=$(grep -rn "Promise<any>\|Array<any>\|Record<.*any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "/\*" | wc -l | tr -d ' ')

# Calculate total
TOTAL_COUNT=$((EXPLICIT_COUNT + ASSERTION_COUNT + GENERIC_COUNT))

# Display results
echo -e "${YELLOW}Violation Breakdown:${NC}"
echo -e "  Explicit (: any)      : ${RED}$EXPLICIT_COUNT${NC}"
echo -e "  Assertions (as any)   : ${RED}$ASSERTION_COUNT${NC}"
echo -e "  Generics (<any>)      : ${RED}$GENERIC_COUNT${NC}"
echo -e "  ${YELLOW}--------------------------------${NC}"
echo -e "  ${RED}TOTAL VIOLATIONS      : $TOTAL_COUNT${NC}"
echo ""

# Check protected-core violations
PROTECTED_CORE_COUNT=$(grep -rn ": any\|as any" src/protected-core/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "/\*" | wc -l | tr -d ' ')

echo -e "${YELLOW}Protected Core Violations:${NC}"
if [ "$PROTECTED_CORE_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}✓ PROTECTED CORE: 0 violations (CLEAN!)${NC}"
else
  echo -e "  ${RED}✗ PROTECTED CORE: $PROTECTED_CORE_COUNT violations (CRITICAL!)${NC}"
fi
echo ""

# Check test files
TEST_COUNT=$(grep -rn ": any\|as any" src/ --include="*.test.ts" --include="*.spec.ts" 2>/dev/null | grep -v "// " | grep -v "/\*" | wc -l | tr -d ' ')
PRODUCTION_COUNT=$((TOTAL_COUNT - TEST_COUNT))

echo -e "${YELLOW}Production vs Test:${NC}"
echo -e "  Production code       : ${RED}$PRODUCTION_COUNT${NC}"
echo -e "  Test files            : ${YELLOW}$TEST_COUNT${NC}"
echo ""

# Goal tracking
GOAL=0
REMAINING=$((TOTAL_COUNT - GOAL))
PERCENTAGE_COMPLETE=$(awk "BEGIN {printf \"%.1f\", (1 - $TOTAL_COUNT/345) * 100}")

echo -e "${YELLOW}Progress to Goal:${NC}"
echo -e "  Starting count (Oct 3): 345"
echo -e "  Current count         : ${RED}$TOTAL_COUNT${NC}"
echo -e "  Goal                  : ${GREEN}$GOAL${NC}"
echo -e "  Remaining             : ${RED}$REMAINING${NC}"
echo -e "  Progress              : ${BLUE}${PERCENTAGE_COMPLETE}%${NC}"
echo ""

# Return total count as exit code (capped at 255 for shell compatibility)
if [ "$TOTAL_COUNT" -gt 255 ]; then
  exit 255
else
  exit "$TOTAL_COUNT"
fi
