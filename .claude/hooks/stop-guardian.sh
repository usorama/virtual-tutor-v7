#!/bin/bash
# Stop Guardian Hook - Analyzes project health when Claude Code stops
# Part of Virtual Tutor automation safety system

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$SCRIPT_DIR/../logs/guardian.log"
BYPASS_FILE="$SCRIPT_DIR/../.bypass-guardian"
TIMEOUT=10000  # 10 seconds

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Check for bypass flag
if [[ -f "$BYPASS_FILE" ]]; then
    log "Guardian bypassed via bypass file"
    echo "🔧 Stop Guardian bypassed"
    exit 0
fi

# Change to project directory
cd "$PROJECT_ROOT" || {
    log "ERROR: Failed to change to project directory: $PROJECT_ROOT"
    exit 1
}

log "Stop Guardian activated for project: $PROJECT_ROOT"

# Execute progressive response with timeout
timeout_cmd() {
    if command -v timeout >/dev/null 2>&1; then
        timeout "${TIMEOUT}ms" "$@" 2>/dev/null || {
            log "WARNING: Progressive response timed out after ${TIMEOUT}ms"
            echo "⚠️ Guardian analysis timed out"
            return 124
        }
    else
        # Fallback for systems without timeout command
        "$@" || {
            log "WARNING: Progressive response failed"
            echo "⚠️ Guardian analysis failed"
            return 1
        }
    fi
}

# Main execution
main() {
    log "Executing progressive response analysis..."
    
    # Run progressive response script
    if timeout_cmd node "$SCRIPT_DIR/../automation/scripts/progressive-response.js"; then
        log "Guardian completed successfully"
        echo "✅ Stop Guardian completed"
    else
        exit_code=$?
        if [[ $exit_code -eq 124 ]]; then
            log "Guardian timed out but continuing"
            echo "⚠️ Guardian timed out but Claude Code can continue"
        else
            log "Guardian failed with exit code: $exit_code"
            echo "⚠️ Guardian analysis had issues (exit code: $exit_code)"
        fi
    fi
}

# Error handling
trap 'log "Guardian interrupted by signal"' INT TERM

# Execute main function
main "$@"