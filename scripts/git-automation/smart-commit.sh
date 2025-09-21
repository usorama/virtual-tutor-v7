#!/bin/bash
#
# Smart Git Commit Automation Script
# Follows --rules protocol for safe, intelligent commits
# Based on Claude Code post-edit hook automation
#

set -euo pipefail

# Configuration
readonly SCRIPT_NAME="smart-commit.sh"
readonly LOG_DIR="$(pwd)/logs/git-automation"
readonly LOG_FILE="${LOG_DIR}/smart-commit.log"
readonly MAX_LOG_SIZE=1048576  # 1MB
readonly COMMIT_PREFIX="feat: "

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Rotate log if too large
rotate_log_if_needed() {
    if [[ -f "${LOG_FILE}" ]] && [[ $(stat -f%z "${LOG_FILE}" 2>/dev/null || stat -c%s "${LOG_FILE}" 2>/dev/null || echo 0) -gt ${MAX_LOG_SIZE} ]]; then
        mv "${LOG_FILE}" "${LOG_FILE}.old"
        log "INFO" "Log rotated due to size"
    fi
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log "ERROR" "Not in a git repository"
        exit 1
    fi
}

# Check for unstaged changes
has_changes() {
    ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]
}

# Generate intelligent commit message
generate_commit_message() {
    local changed_files
    local added_files
    local modified_files
    local deleted_files

    # Get file changes
    changed_files=$(git diff --name-only --cached 2>/dev/null || echo "")
    added_files=$(git diff --name-only --cached --diff-filter=A 2>/dev/null | wc -l | tr -d ' ')
    modified_files=$(git diff --name-only --cached --diff-filter=M 2>/dev/null | wc -l | tr -d ' ')
    deleted_files=$(git diff --name-only --cached --diff-filter=D 2>/dev/null | wc -l | tr -d ' ')

    local message=""
    local details=""

    # Determine primary action
    if [[ ${added_files} -gt 0 ]] && [[ ${modified_files} -eq 0 ]] && [[ ${deleted_files} -eq 0 ]]; then
        message="Add new files"
    elif [[ ${modified_files} -gt 0 ]] && [[ ${added_files} -eq 0 ]] && [[ ${deleted_files} -eq 0 ]]; then
        message="Update existing files"
    elif [[ ${deleted_files} -gt 0 ]] && [[ ${added_files} -eq 0 ]] && [[ ${modified_files} -eq 0 ]]; then
        message="Remove files"
    else
        message="Update project files"
    fi

    # Add file details (limit to first 3 files)
    if [[ -n "${changed_files}" ]]; then
        local file_list=$(echo "${changed_files}" | head -3 | tr '\n' ' ')
        details=" (${file_list})"

        # If more than 3 files, add count
        local total_files=$(echo "${changed_files}" | wc -l | tr -d ' ')
        if [[ ${total_files} -gt 3 ]]; then
            details="${details} and $((total_files - 3)) more"
        fi
    fi

    # Generate final message
    echo "${COMMIT_PREFIX}${message}${details}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
}

# Stage all changes
stage_changes() {
    log "INFO" "Staging all changes"

    # Add all modified and new files
    git add -A

    # Verify something was staged
    if ! git diff --cached --quiet; then
        return 0
    else
        log "INFO" "No changes to stage"
        return 1
    fi
}

# Create commit
create_commit() {
    local commit_message
    commit_message=$(generate_commit_message)

    log "INFO" "Creating commit with message: ${commit_message%%$'\n'*}"

    if git commit -m "${commit_message}"; then
        log "INFO" "Commit created successfully"

        # Log commit hash
        local commit_hash=$(git rev-parse HEAD)
        log "INFO" "Commit hash: ${commit_hash}"

        return 0
    else
        log "ERROR" "Failed to create commit"
        return 1
    fi
}

# Main execution
main() {
    log "INFO" "Starting smart commit automation"

    # Rotate log if needed
    rotate_log_if_needed

    # Safety checks
    check_git_repo

    # Check if there are any changes
    if ! has_changes; then
        log "INFO" "No changes to commit"
        exit 0
    fi

    # Stage and commit changes
    if stage_changes; then
        if create_commit; then
            log "INFO" "Smart commit completed successfully"
            exit 0
        else
            log "ERROR" "Smart commit failed during commit creation"
            exit 1
        fi
    else
        log "INFO" "No changes staged, nothing to commit"
        exit 0
    fi
}

# Handle script termination
cleanup() {
    local exit_code=$?
    if [[ ${exit_code} -ne 0 ]]; then
        log "ERROR" "Script terminated with exit code: ${exit_code}"
    fi
}

trap cleanup EXIT

# Execute main function
main "$@"