# GitHub Actions Monitoring System

## 🎯 Overview

Complete monitoring and notification system for GitHub Actions workflows to ensure you know immediately when things fail and can take action.

## 🏗️ System Components

### 1. Local Monitoring Scripts
- **`monitor-github-actions.js`** - Core monitoring using GitHub CLI/API
- **`notify-failures.js`** - Multi-channel notification system
- **`actions-dashboard.js`** - Visual dashboard generator

### 2. GitHub Actions Workflows
- **`actions-failure-notifier.yml`** - Auto-triggers on workflow failures
- Creates GitHub issues for critical failures
- Sends Slack notifications (if configured)
- Auto-closes issues when workflows pass

### 3. Integration Points
- **Morning Setup** - Checks Actions status during daily startup
- **Package.json Commands** - Easy CLI access to monitoring tools

## 📊 Monitoring Capabilities

### Real-Time Status Checks
```bash
# Check current status
npm run actions:status

# Generate visual dashboard
npm run actions:dashboard

# Watch for changes (5-minute intervals)
npm run actions:watch
```

### Notification Channels
- **Audio Alerts** (macOS `say`, Linux `notify-send`)
- **Desktop Notifications** (Native OS notifications)
- **File Logging** (`.claude/automation/context/failure-log.json`)
- **Webhook Integration** (Configurable external endpoints)
- **GitHub Issues** (Auto-created for critical failures)
- **Slack Integration** (Via webhook)

## 🚨 Failure Detection

### What Gets Monitored
- Workflow run status (success/failure/cancelled)
- Individual job failures within workflows
- Build failures (TypeScript, ESLint, tests)
- Architecture violations
- Black hole detection results
- Memory safety checks

### Automatic Actions on Failure
1. **Immediate Notifications** via enabled channels
2. **GitHub Issue Creation** for critical failures
3. **Failure Logging** with detailed context
4. **Dashboard Updates** with failure analysis
5. **Recovery Recommendations** based on failure type

## ⚙️ Configuration

### Environment Variables
```bash
# Enable notifications
export NOTIFY_AUDIO=true
export NOTIFY_DESKTOP=true

# External integrations
export NOTIFY_WEBHOOK_URL="https://your-webhook-endpoint.com"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

### GitHub Secrets (for Actions)
- `SLACK_WEBHOOK_URL` - For Slack notifications from Actions

## 🔧 Setup Instructions

### 1. Enable Local Monitoring
```bash
# Test notification system
npm run notify:test

# Check if GitHub CLI is available
gh --version

# Generate initial dashboard
npm run actions:dashboard
```

### 2. Configure Notifications
- **macOS**: Audio alerts work out-of-the-box
- **Linux**: Install `notify-send` for desktop notifications
- **Slack**: Add webhook URL to GitHub secrets
- **Custom Webhooks**: Set `NOTIFY_WEBHOOK_URL` environment variable

### 3. Deploy Notification Workflow
The `actions-failure-notifier.yml` workflow is automatically active and will:
- Monitor all workflow completions
- Create issues for critical failures
- Send notifications via configured channels
- Auto-resolve issues when workflows pass

## 📈 Dashboard Features

### Visual Status Overview
- Overall health indicator (🟢🟡🔴)
- Success/failure rates
- Recent run history
- Trend analysis

### Failure Analysis
- New failures since last check
- Detailed error context
- Recovery recommendations
- Quick action links

### Real-Time Updates
```bash
# Manual refresh
npm run actions:dashboard

# Auto-refresh every 5 minutes
npm run actions:watch
```

## 🚨 Alert Levels

### 🟢 Healthy
- All workflows passing
- No recent failures
- System operating normally

### 🟡 Degraded  
- Some failures detected
- Non-critical issues
- Monitor for patterns

### 🔴 Critical
- Recent critical failures
- Build/deployment issues
- Immediate action required

## 🛠️ Troubleshooting

### Common Issues

**GitHub CLI Not Available**
```bash
# Install GitHub CLI
brew install gh  # macOS
sudo apt install gh  # Ubuntu
```

**No Workflow Data**
- Ensure repository has GitHub Actions enabled
- Check if workflows have run recently
- Verify git remote points to GitHub repository

**Notifications Not Working**
```bash
# Test individual components
node .claude/automation/scripts/notify-failures.js --test --audio
node .claude/automation/scripts/notify-failures.js --test --desktop
```

**Dashboard Empty**
- Run `npm run actions:status` to check monitoring
- Verify repository permissions
- Check if GitHub CLI is authenticated (`gh auth status`)

## 🔄 Integration with Development Workflow

### Morning Routine
The morning setup script automatically:
1. Checks GitHub Actions status
2. Reports any overnight failures
3. Updates dashboard
4. Provides action recommendations

### Evening Validation
```bash
npm run evening:validate
# Includes Actions status check
```

### Continuous Monitoring
```bash
# Background monitoring (optional)
npm run actions:watch &
```

## 📋 Best Practices

### 1. Regular Monitoring
- Check status during morning setup
- Review dashboard weekly
- Address failures promptly

### 2. Notification Tuning
- Enable audio for critical environments
- Configure Slack for team awareness
- Use webhooks for external integrations

### 3. Failure Response
- Don't ignore failed workflows
- Address black hole patterns immediately
- Use recovery procedures for critical failures

### 4. Dashboard Maintenance
- Generate dashboard regularly
- Archive old failure logs
- Monitor trends for patterns

## 🔗 Quick Reference

### Essential Commands
```bash
npm run actions:status      # Check current status
npm run actions:dashboard   # Generate visual dashboard  
npm run notify:test         # Test notification system
npm run morning:setup       # Include Actions check
```

### Key Files
- `.claude/automation/context/actions-dashboard.md` - Visual dashboard
- `.claude/automation/context/failure-log.json` - Failure history
- `.claude/automation/context/last-actions-check.json` - Status tracking

### GitHub Integration
- Auto-created issues for critical failures
- Automatic issue closure when resolved
- Workflow monitoring across all branches

---

This monitoring system ensures you're never surprised by workflow failures and always have the information needed to take immediate corrective action.