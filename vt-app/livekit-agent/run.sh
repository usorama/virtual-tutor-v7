#!/bin/bash

# Virtual Tutor LiveKit Agent Runner Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Virtual Tutor LiveKit Agent${NC}"
echo "================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Please update .env with your credentials${NC}"
fi

# Run the agent
echo -e "${GREEN}Starting LiveKit Agent...${NC}"
echo "================================"

# Development mode with auto-reload
if [ "$1" = "dev" ]; then
    echo -e "${YELLOW}Running in development mode${NC}"
    python agent.py dev
else
    echo -e "${YELLOW}Running in production mode${NC}"
    python agent.py start
fi