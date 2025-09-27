# PingLearn Production Deployment & CI/CD Options Guide
**Version**: 1.0
**Date**: September 27, 2025
**Target**: 1000+ users production deployment
**Stack**: Next.js 15.5.3, TypeScript, Supabase, LiveKit voice, KaTeX math

---

## 🎯 Executive Summary

This document provides 6 comprehensive deployment options for PingLearn, ranging from free tier to enterprise-grade solutions. Each option includes automated CI/CD setup, cost analysis for 1000 users, and step-by-step implementation guides optimized for non-technical users.

**Quick Recommendations**:
- **Budget Option**: Cloudflare Pages + Hetzner ($12-20/month)
- **Balanced Option**: Vercel Pro + Supabase ($45/month)
- **Enterprise Option**: AWS + GitHub Actions ($80-120/month)

---

## 📊 Deployment Options Overview

| Option | Monthly Cost | Complexity | Best For | CI/CD | Auto-scaling |
|--------|-------------|-----------|----------|-------|-------------|
| 1. Cloudflare Pages + Free Tier | $0-15 | Low | Testing, MVP | ✅ | Limited |
| 2. Vercel Pro + Supabase | $45 | Low | Production Ready | ✅ | ✅ |
| 3. Railway + GitHub Actions | $25-40 | Medium | Startup Growth | ✅ | ✅ |
| 4. DigitalOcean App Platform | $35-50 | Medium | Balanced Cost/Features | ✅ | ✅ |
| 5. Hetzner + Docker + Actions | $12-25 | High | EU Users, Cost-Sensitive | ✅ | Manual |
| 6. AWS ECS + GitHub Actions | $80-150 | High | Enterprise, High Scale | ✅ | ✅ |

---

## 🚀 Option 1: Cloudflare Pages + Free Tier (Budget)
**Monthly Cost**: $0-15
**Best For**: MVP testing, low traffic, budget constraints
**Complexity**: ⭐⭐☆☆☆

### Cost Breakdown (1000 users)
- **Frontend (Cloudflare Pages)**: $0 (Free tier)
- **Database (Supabase Free)**: $0
- **LiveKit Agent (Render Free)**: $0
- **Domain (Cloudflare)**: $0 (you already have pinglearn.app)
- **CI/CD (GitHub Actions)**: $0 (2000 minutes free)
- **Total**: $0-15/month

### Limitations
- **Request Limits**: 100,000 requests/day, 1,000 requests/minute burst
- **Build Limits**: 500 builds/month, 20-minute timeout
- **Worker Size**: 3MB limit (could hit with Next.js)
- **Database**: Supabase free tier (2 projects, 50MB, 2GB bandwidth)

### Automated Setup

#### GitHub Actions Workflow (.github/workflows/deploy.yml)
```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: pinglearn
          directory: out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

#### Setup Steps
1. **Configure Next.js for Static Export** (next.config.js):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

2. **Cloudflare Pages Setup**:
   - Connect GitHub repo to Cloudflare Pages
   - Set build command: `npm run build`
   - Set output directory: `out`
   - Add environment variables in Cloudflare dashboard

3. **GitHub Secrets**:
   ```bash
   CLOUDFLARE_API_TOKEN=your_api_token
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   ```

### ⚠️ **LIMITATIONS FOR PINGLEARN**:
- LiveKit voice functionality may not work with static export
- No server-side features (API routes, middleware)
- Database operations limited to client-side only

---

## ⭐ Option 2: Vercel Pro + Supabase (Recommended)
**Monthly Cost**: $45
**Best For**: Production-ready, optimal Next.js performance
**Complexity**: ⭐⭐☆☆☆

### Cost Breakdown (1000 users)
- **Frontend (Vercel Pro)**: $20/month
- **Database (Supabase Pro)**: $25/month
- **CI/CD**: $0 (included)
- **Total**: $45/month

### Features
- **Next.js Optimization**: Built-in edge functions, ISR, image optimization
- **Auto-scaling**: Handles traffic spikes automatically
- **Global CDN**: 100+ edge locations
- **Preview Deployments**: Every PR gets preview URL
- **Analytics**: Built-in web analytics

### Automated Setup

#### Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "@next_public_supabase_publishable_key",
    "SUPABASE_SECRET_KEY": "@supabase_secret_key"
  }
}
```

#### GitHub Actions Workflow (.github/workflows/ci.yml)
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### Setup Steps
1. **Install Vercel CLI**:
```bash
npm i -g vercel
vercel login
vercel --version
```

2. **Link Project**:
```bash
cd pinglearn-app
vercel link
vercel env pull .env.local
```

3. **Environment Variables** (Vercel Dashboard):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`

4. **GitHub Secrets**:
   ```bash
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

### LiveKit Agent Deployment
Deploy Python LiveKit agent on Railway or Render:

#### Dockerfile (livekit-agent/Dockerfile)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "agent.py"]
```

#### Railway Deployment
```bash
# Connect to Railway
railway login
railway link
railway up
```

---

## 💰 Option 3: Railway + GitHub Actions (Growth)
**Monthly Cost**: $25-40
**Best For**: Startups, usage-based scaling
**Complexity**: ⭐⭐⭐☆☆

### Cost Breakdown (1000 users)
- **Frontend (Railway)**: $15-25/month
- **Database (Supabase Pro)**: $25/month
- **CI/CD (GitHub Actions)**: $0
- **Total**: $40-50/month

### Features
- **Usage-based Pricing**: Pay for what you use
- **Auto-scaling**: Based on CPU/memory usage
- **Database Support**: Built-in PostgreSQL, Redis
- **Easy Deployment**: Git-based deployment

### Automated Setup

#### Railway Configuration (railway.toml)
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
healthcheckPath = "/api/health"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "pinglearn-frontend"
source = "."

[services.pinglearn-frontend.variables]
NODE_ENV = "production"
PORT = "3000"

[[services]]
name = "livekit-agent"
source = "./livekit-agent"

[services.livekit-agent.variables]
PYTHON_VERSION = "3.11"
```

#### GitHub Actions Workflow
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --service pinglearn-frontend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Deploy LiveKit Agent
        run: railway up --service livekit-agent
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### Setup Steps
1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize Project**:
```bash
railway init
railway link
```

3. **Deploy Services**:
```bash
# Deploy frontend
railway up

# Deploy LiveKit agent (from livekit-agent directory)
cd livekit-agent
railway up
```

---

## 🔧 Option 4: DigitalOcean App Platform (Balanced)
**Monthly Cost**: $35-50
**Best For**: Balanced cost/features, managed infrastructure
**Complexity**: ⭐⭐⭐☆☆

### Cost Breakdown (1000 users)
- **App Platform (2 GB RAM)**: $12/month
- **Managed Database**: $15/month
- **Container Registry**: $5/month
- **LiveKit Agent Container**: $7/month
- **Total**: $39/month

### Features
- **Managed Infrastructure**: No server maintenance
- **Auto-scaling**: Built-in horizontal scaling
- **Container Support**: Docker deployments
- **Integrated Database**: Managed PostgreSQL

### Automated Setup

#### App Spec (.do/app.yaml)
```yaml
name: pinglearn
services:
- name: frontend
  source_dir: /
  github:
    repo: your-username/pinglearn
    branch: main
    deploy_on_push: true
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: NEXT_PUBLIC_SUPABASE_URL
    value: ${NEXT_PUBLIC_SUPABASE_URL}
  - key: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    value: ${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}

- name: livekit-agent
  source_dir: /livekit-agent
  github:
    repo: your-username/pinglearn
    branch: main
    deploy_on_push: true
  dockerfile_path: livekit-agent/Dockerfile
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: pinglearn-db
  engine: PG
  version: "14"
  size_slug: db-s-1vcpu-1gb
```

#### GitHub Actions Workflow
```yaml
name: Deploy to DigitalOcean
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Build and deploy
        run: |
          doctl apps create --spec .do/app.yaml
          doctl apps deploy ${{ secrets.DO_APP_ID }}
```

---

## 🇪🇺 Option 5: Hetzner + Docker + GitHub Actions (EU Cost-Optimized)
**Monthly Cost**: $12-25
**Best For**: EU users, maximum cost savings, full control
**Complexity**: ⭐⭐⭐⭐☆

### Cost Breakdown (1000 users)
- **Hetzner VPS (CX31)**: €11.90/month (~$13)
- **Managed Database**: €4.90/month (~$5)
- **Load Balancer**: €5.39/month (~$6)
- **CI/CD**: $0 (GitHub Actions)
- **Total**: $24/month

### Features
- **Best Price/Performance**: Cheapest option for EU
- **Full Control**: Root access, custom configurations
- **EU Data Centers**: GDPR compliant, low latency for EU users
- **Docker Support**: Modern containerized deployment

### Automated Setup

#### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
    depends_on:
      - postgres
    restart: unless-stopped

  livekit-agent:
    build: ./livekit-agent
    environment:
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=pinglearn
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
```

#### GitHub Actions Workflow
```yaml
name: Deploy to Hetzner
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        run: |
          docker build -t pinglearn:latest .
          docker push ${{ secrets.DOCKER_USERNAME }}/pinglearn:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: ${{ secrets.HETZNER_USER }}
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/pinglearn:latest
            docker-compose down
            docker-compose up -d
```

#### Setup Steps
1. **Create Hetzner Server**:
```bash
# Create CX31 server (4 vCPU, 8GB RAM, 80GB SSD)
# Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose
```

2. **Server Configuration**:
```bash
# Clone repository
git clone https://github.com/your-username/pinglearn.git
cd pinglearn

# Set up environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose up -d
```

3. **SSL Setup** (Let's Encrypt):
```bash
sudo apt install certbot
sudo certbot --nginx -d pinglearn.app
```

---

## 🏢 Option 6: AWS ECS + GitHub Actions (Enterprise)
**Monthly Cost**: $80-150
**Best For**: Enterprise scale, high availability, compliance
**Complexity**: ⭐⭐⭐⭐⭐

### Cost Breakdown (1000 users)
- **ECS Fargate**: $30-50/month
- **RDS PostgreSQL**: $25-40/month
- **Application Load Balancer**: $18/month
- **CloudFront CDN**: $5-10/month
- **Route 53**: $2/month
- **Total**: $80-125/month

### Features
- **Enterprise Grade**: 99.99% SLA, high availability
- **Auto-scaling**: Based on CloudWatch metrics
- **Global CDN**: CloudFront integration
- **Security**: VPC, security groups, IAM roles
- **Compliance**: SOC, HIPAA, PCI DSS ready

### Automated Setup

#### CloudFormation Template (infrastructure.yml)
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PingLearn Production Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true

  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${Environment}-pinglearn

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: pinglearn-app
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 256
      Memory: 512
      ContainerDefinitions:
        - Name: frontend
          Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/pinglearn:latest
          PortMappings:
            - ContainerPort: 3000
          Environment:
            - Name: NODE_ENV
              Value: production
```

#### GitHub Actions Workflow
```yaml
name: Deploy to AWS ECS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        run: |
          docker build -t pinglearn .
          docker tag pinglearn:latest $ECR_REGISTRY/pinglearn:latest
          docker push $ECR_REGISTRY/pinglearn:latest
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production-pinglearn \
            --service pinglearn-service \
            --force-new-deployment
```

---

## 🔄 CI/CD Best Practices for All Options

### 1. Environment Management
```bash
# Development
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=your-dev-url

# Staging
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=your-staging-url

# Production
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your-prod-url
```

### 2. Automated Testing Pipeline
```yaml
# Common test workflow for all options
jobs:
  test:
    steps:
      - name: Unit Tests
        run: npm test

      - name: E2E Tests
        run: npm run test:e2e

      - name: TypeScript Check
        run: npm run typecheck

      - name: Linting
        run: npm run lint

      - name: Security Audit
        run: npm audit
```

### 3. Database Migrations
```yaml
- name: Run Database Migrations
  run: |
    npm run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 4. Health Checks
```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

---

## 📋 Implementation Checklist

### Pre-Deployment Setup
- [ ] **Domain Configuration**: Point pinglearn.app to chosen platform
- [ ] **SSL Certificate**: Set up HTTPS (automatic for most platforms)
- [ ] **Environment Variables**: Configure all required secrets
- [ ] **Database Setup**: Migrate from development to production database
- [ ] **GitHub Secrets**: Add all required tokens and API keys

### CI/CD Configuration
- [ ] **GitHub Actions**: Set up workflow files
- [ ] **Branch Protection**: Require PR reviews and status checks
- [ ] **Environment Secrets**: Configure staging and production environments
- [ ] **Deploy Keys**: Set up SSH keys or API tokens
- [ ] **Monitoring**: Set up error tracking and performance monitoring

### Post-Deployment Testing
- [ ] **Functionality Test**: Verify all features work in production
- [ ] **Performance Test**: Load test with simulated 1000 users
- [ ] **Security Test**: Run security audit and penetration testing
- [ ] **Monitoring Setup**: Configure alerts for downtime and errors
- [ ] **Backup Strategy**: Set up automated database backups

---

## 🎯 Final Recommendations

### For Immediate Launch (Within 1 week):
**Option 2: Vercel Pro + Supabase** ($45/month)
- ✅ Fastest to deploy (< 30 minutes)
- ✅ Zero infrastructure management
- ✅ Automatic scaling and optimization
- ✅ Built-in preview deployments

### For Growth Phase (After validation):
**Option 3: Railway + GitHub Actions** ($25-40/month)
- ✅ Usage-based cost scaling
- ✅ Easy database management
- ✅ Docker support for LiveKit agent

### For EU Market Focus:
**Option 5: Hetzner + Docker** ($12-25/month)
- ✅ Best price/performance ratio
- ✅ EU data centers for GDPR compliance
- ✅ Full control over infrastructure

### For Enterprise Scale:
**Option 6: AWS ECS** ($80-150/month)
- ✅ Enterprise-grade reliability
- ✅ Advanced security and compliance
- ✅ Global scale capabilities

---

## 🚨 Next Steps for Implementation

1. **Choose Your Option**: Based on your budget and requirements
2. **Set Up GitHub Secrets**: Configure all required API keys and tokens
3. **Create CI/CD Workflow**: Copy the appropriate GitHub Actions workflow
4. **Deploy Staging Environment**: Test the full deployment pipeline
5. **DNS Configuration**: Point pinglearn.app to your chosen platform
6. **Production Deployment**: Deploy to production environment
7. **Monitor and Optimize**: Set up monitoring and performance tracking

**Estimated Setup Time**: 2-8 hours depending on chosen option
**Recommended Start**: Option 2 (Vercel Pro) for fastest time-to-market

---

*Document created with comprehensive research from current 2025 deployment best practices, pricing data, and CI/CD automation patterns.*