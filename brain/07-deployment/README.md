# Deployment Guide

Deployment procedures for Scrollio mobile app and backend infrastructure.

---

## Overview

**Deployment Targets:**
- Mobile App (iOS + Android) → App Store & Google Play
- Backend API (NestJS) → AWS EC2 / ECS
- Supabase → Managed cloud (or self-hosted)
- Media (Videos) → AWS S3 + CloudFront

---

## Mobile App Deployment

### Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
cd code/mobile-app
eas build:configure
```

### Environment Configuration

Create environment-specific configs:

**Production (.env.production):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_AWS_CLOUDFRONT_URL=https://your-cloudfront-domain.net
EXPO_PUBLIC_API_URL=https://api.scrollio.com
EXPO_PUBLIC_ENVIRONMENT=production
```

**Staging (.env.staging):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
EXPO_PUBLIC_AWS_CLOUDFRONT_URL=https://staging-cloudfront.net
EXPO_PUBLIC_API_URL=https://staging-api.scrollio.com
EXPO_PUBLIC_ENVIRONMENT=staging
```

### Build Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "staging"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### iOS Deployment

#### 1. Build iOS App

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight (internal testing)
eas build --platform ios --profile preview
```

#### 2. Submit to App Store

```bash
# Automatic submission
eas submit --platform ios --profile production

# Or manually via App Store Connect
# Download .ipa from EAS dashboard
# Upload via Transporter app
```

#### 3. App Store Connect Setup

1. **App Information:**
   - Name: Scrollio
   - Category: Education
   - Age Rating: 4+ (COPPA compliant)
   - Privacy Policy URL: https://scrollio.com/privacy
   - Terms of Service URL: https://scrollio.com/terms

2. **App Privacy:**
   - Data Collection: Parent email, child username, watch history
   - Data Usage: App functionality, analytics (anonymous)
   - Data Sharing: AWS (video hosting), Supabase (database)
   - Age Gate: Yes (7-12 years old)

3. **Version Information:**
   - Version Number: 1.0.0
   - Build Number: Auto-increment via EAS
   - What's New: Release notes

### Android Deployment

#### 1. Build Android App

```bash
# Build AAB for Play Store
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

#### 2. Submit to Google Play

```bash
# Automatic submission
eas submit --platform android --profile production

# Or manually via Google Play Console
# Download .aab from EAS dashboard
# Upload to Play Console
```

#### 3. Google Play Console Setup

1. **App Information:**
   - App name: Scrollio
   - Category: Education
   - Content rating: Everyone (COPPA compliant)
   - Privacy Policy URL: https://scrollio.com/privacy
   - Target audience: Children under 13

2. **Content Rating Questionnaire:**
   - Violence: None
   - Sexual content: None
   - Language: None
   - Controlled substances: None
   - Interactive elements: User-generated content (moderated)
   - Data safety: Collects parent email, no child PII

3. **Release Track:**
   - Internal testing → Alpha → Beta → Production
   - Start with internal testing for team
   - Gradual rollout: 10% → 50% → 100%

### Over-The-Air (OTA) Updates

For non-native code changes (JS/assets only):

```bash
# Publish update
eas update --branch production --message "Fix video loading bug"

# Publish to specific channel
eas update --channel production --message "New quiz feature"
```

**eas.json update configuration:**
```json
{
  "update": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "staging"
    }
  }
}
```

**Rollback an update:**
```bash
# Republish previous version
eas update:republish --group-id <previous-group-id>
```

---

## Backend Deployment (NestJS)

### AWS EC2 Deployment

#### 1. Launch EC2 Instance

```bash
# Amazon Linux 2 or Ubuntu 22.04
# Instance type: t3.medium (or larger for production)
# Security groups:
# - SSH (22) from your IP
# - HTTP (80) from anywhere
# - HTTPS (443) from anywhere
# - Custom TCP (3000) from anywhere (or restrict to ALB)
```

#### 2. Server Setup

```bash
# SSH into server
ssh -i your-key.pem ec2-user@your-server-ip

# Update system
sudo yum update -y  # Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
sudo yum install nginx -y  # Amazon Linux
# or
sudo apt install nginx -y  # Ubuntu
```

#### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/scrollio.git
cd scrollio/code/backend

# Install dependencies
npm install --production

# Build application
npm run build

# Set environment variables
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=scrollio-videos
CLOUDFRONT_DOMAIN=your-cloudfront-domain.net
EOF

# Start with PM2
pm2 start dist/main.js --name scrollio-api
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

#### 4. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/conf.d/scrollio.conf
```

```nginx
server {
    listen 80;
    server_name api.scrollio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y  # Amazon Linux
# or
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Obtain certificate
sudo certbot --nginx -d api.scrollio.com

# Auto-renew (already configured by certbot)
sudo certbot renew --dry-run
```

### AWS ECS Deployment (Docker)

#### 1. Create Dockerfile

```dockerfile
# code/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

#### 2. Build and Push to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t scrollio-api .

# Tag image
docker tag scrollio-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/scrollio-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/scrollio-api:latest
```

#### 3. Create ECS Task Definition

```json
{
  "family": "scrollio-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "scrollio-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/scrollio-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:scrollio/supabase-url"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:scrollio/supabase-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/scrollio-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 4. Create ECS Service

```bash
# Create service with Application Load Balancer
aws ecs create-service \
  --cluster scrollio-cluster \
  --service-name scrollio-api \
  --task-definition scrollio-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/scrollio-api/xxx,containerName=scrollio-api,containerPort=3000"
```

---

## Database Deployment (Supabase)

### Production Setup

1. **Create Production Project:**
   - Go to https://supabase.com/dashboard
   - Create new project: "scrollio-production"
   - Region: Choose closest to users
   - Database password: Strong, store in secrets manager

2. **Run Migrations:**
```bash
# Link to production project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push

# Verify
npx supabase db diff
```

3. **Enable Backups:**
   - Settings → Database → Point-in-time Recovery (PITR)
   - Enable daily backups
   - Retention: 7 days minimum

4. **Configure RLS Policies:**
```sql
-- Verify all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Should return empty - all tables must have RLS
```

5. **Set Up Monitoring:**
   - Enable database metrics
   - Set up alerts for:
     - High CPU usage (>80%)
     - High memory usage (>80%)
     - Slow queries (>1s)
     - Failed auth attempts (>10/min)

---

## AWS Infrastructure

### S3 Bucket Configuration

```bash
# Create bucket
aws s3 mb s3://scrollio-videos-production --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket scrollio-videos-production \
  --versioning-configuration Status=Enabled

# Set lifecycle policy (delete incomplete uploads after 7 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket scrollio-videos-production \
  --lifecycle-configuration file://lifecycle-policy.json
```

**lifecycle-policy.json:**
```json
{
  "Rules": [
    {
      "Id": "DeleteIncompleteUploads",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

### CloudFront Configuration

1. **Create Distribution:**
   - Origin: S3 bucket (scrollio-videos-production)
   - Origin Access Identity: Create new
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD
   - Cache Policy: CachingOptimized
   - Price Class: Use Only North America and Europe (or All for global)

2. **Custom Domain (Optional):**
   - CNAME: videos.scrollio.com → CloudFront domain
   - SSL Certificate: Request via ACM (us-east-1)
   - Add CNAME to distribution

---

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy-mobile.yml:**
```yaml
name: Deploy Mobile App

on:
  push:
    branches:
      - main
    paths:
      - 'code/mobile-app/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - name: Install dependencies
        working-directory: code/mobile-app
        run: npm ci
        
      - name: Run tests
        working-directory: code/mobile-app
        run: npm test
        
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Build and Submit
        working-directory: code/mobile-app
        run: |
          eas build --platform all --non-interactive --no-wait
          eas submit --platform all --non-interactive
```

**.github/workflows/deploy-backend.yml:**
```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main
    paths:
      - 'code/backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - name: Install dependencies
        working-directory: code/backend
        run: npm ci
        
      - name: Run tests
        working-directory: code/backend
        run: npm test
        
      - name: Build
        working-directory: code/backend
        run: npm run build
        
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/scrollio/code/backend
            git pull origin main
            npm ci --production
            npm run build
            pm2 reload scrollio-api
```

---

## Monitoring & Logging

### Application Monitoring

**Sentry (Error Tracking):**
```typescript
// Mobile app
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 1.0,
});

// Backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV,
});
```

**CloudWatch (AWS):**
```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
```

---

## Rollback Procedures

### Mobile App Rollback

```bash
# OTA updates can be rolled back
eas update:republish --group-id <previous-group-id>

# Full app rollback requires new submission
# Revert code → Build → Submit
git revert <bad-commit>
eas build --platform all
eas submit --platform all
```

### Backend Rollback

```bash
# EC2
ssh ec2-user@your-server
cd /home/ec2-user/scrollio
git log --oneline  # Find previous commit
git reset --hard <previous-commit>
npm ci --production
npm run build
pm2 reload scrollio-api

# ECS
# Deploy previous task definition revision
aws ecs update-service \
  --cluster scrollio-cluster \
  --service scrollio-api \
  --task-definition scrollio-api:3  # Previous revision
```

### Database Rollback

```bash
# Restore from backup (Supabase)
# Dashboard → Settings → Database → Restore from backup

# Or via SQL (point-in-time recovery)
# Contact Supabase support for PITR restore
```

---

## Post-Deployment Checklist

- [ ] Mobile app builds successfully for iOS
- [ ] Mobile app builds successfully for Android
- [ ] Backend API is accessible via HTTPS
- [ ] Database migrations applied successfully
- [ ] RLS policies verified and enabled
- [ ] Video uploads working (S3 + CloudFront)
- [ ] Authentication flow working (sign up, sign in, reset password)
- [ ] Child profile creation working
- [ ] Video playback working
- [ ] Quiz functionality working
- [ ] Monitoring and logging configured
- [ ] Error tracking (Sentry) configured
- [ ] SSL certificates valid
- [ ] Environment variables set correctly
- [ ] Secrets stored securely (AWS Secrets Manager)
- [ ] Backups configured and tested
- [ ] Privacy policy and terms updated
- [ ] App Store and Play Store listings updated

---

## References

- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo EAS Update: https://docs.expo.dev/eas-update/introduction/
- AWS EC2: https://docs.aws.amazon.com/ec2/
- AWS ECS: https://docs.aws.amazon.com/ecs/
- Supabase Production Checklist: https://supabase.com/docs/guides/platform/going-into-prod
