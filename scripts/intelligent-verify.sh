#!/usr/bin/env bash

# Intelligent Constitutional Verification System
# Self-correcting, evidence-based verification for PingLearn

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root detection
PROJECT_ROOT="${1:-$(pwd)}"

# Ensure we're in the right directory
if [[ ! -f "$PROJECT_ROOT/package.json" ]] || [[ ! -d "$PROJECT_ROOT/src" ]]; then
    echo -e "${RED}Error: Not a valid PingLearn project directory${NC}"
    echo "Usage: $0 [project_root]"
    echo "Example: $0 /Users/username/Projects/pinglearn"
    exit 1
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🧠 INTELLIGENT CONSTITUTIONAL VERIFICATION v2.0         ║${NC}"
echo -e "${BLUE}║           Evidence-Based Self-Correcting Analysis            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${CYAN}Project Root: ${BLUE}$PROJECT_ROOT${NC}"
echo -e "${CYAN}Timestamp: ${BLUE}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo

# Check if TypeScript/Node.js tools are available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Install tsx if not available
if ! npx tsx --version &> /dev/null; then
    echo -e "${YELLOW}Installing tsx for TypeScript execution...${NC}"
    cd "$PROJECT_ROOT"
    npm install -g tsx 2>/dev/null || npm install tsx
fi

# Create TypeScript configuration if needed
if [[ ! -f "$PROJECT_ROOT/scripts/intelligent-verify/tsconfig.json" ]]; then
    mkdir -p "$PROJECT_ROOT/scripts/intelligent-verify"
    cat > "$PROJECT_ROOT/scripts/intelligent-verify/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF
fi

# Run the intelligent verification system
echo -e "${PURPLE}🔍 Starting Evidence Collection & Analysis...${NC}"
echo

cd "$PROJECT_ROOT"

# Try to run the TypeScript version
if [[ -f "$PROJECT_ROOT/scripts/intelligent-verify/main.ts" ]]; then
    npx tsx "$PROJECT_ROOT/scripts/intelligent-verify/main.ts" "$PROJECT_ROOT"
else
    echo -e "${RED}Error: Intelligent verification system not found${NC}"
    echo "Expected: $PROJECT_ROOT/scripts/intelligent-verify/main.ts"
    exit 1
fi

echo
echo -e "${GREEN}✅ Intelligent verification complete${NC}"
echo -e "${CYAN}Run with 'verbose' argument for detailed evidence logs${NC}"