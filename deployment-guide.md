
# Cloud Run Deployment Guide

## Prerequisites
1. Google Cloud CLI installed and configured
2. Docker installed
3. Project with billing enabled

## Quick Deployment Steps

### 1. Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Set Your Project ID
```bash
export PROJECT_ID="your-actual-project-id"
gcloud config set project $PROJECT_ID
```

### 3. Option A: Manual Deployment
```bash
# Make deploy script executable
chmod +x deploy.sh

# Edit deploy.sh and update PROJECT_ID
# Then run:
./deploy.sh
```

### 4. Option B: Cloud Build (Automated)
```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml .
```

## After Deployment

### 1. Update Supabase Configuration
Once deployed, you'll get a Cloud Run URL like: `https://youtube-ai-assistant-xxx-uc.a.run.app`

Update these Supabase settings:
1. Go to: https://supabase.com/dashboard/project/hrhnqwuyhotiswryzgqa/auth/url-configuration
2. Set **Site URL** to your Cloud Run URL
3. Add your Cloud Run URL to **Redirect URLs**
4. Remove any localhost URLs

### 2. Update CORS (if needed)
If you encounter CORS issues:
1. Go to: https://supabase.com/dashboard/project/hrhnqwuyhotiswryzgqa/settings/api
2. Add your Cloud Run domain to allowed origins

### 3. Custom Domain (Optional)
To use a custom domain:
```bash
gcloud run domain-mappings create --service youtube-ai-assistant --domain yourdomain.com --region us-central1
```

## Security Checklist
- ✅ Supabase URL configuration updated
- ✅ RLS policies enabled
- ✅ API keys stored in Supabase secrets
- ✅ HTTPS enforced by Cloud Run
- ✅ Security headers in nginx config

## Monitoring
- View logs: `gcloud run logs tail --service youtube-ai-assistant --region us-central1`
- View metrics in Google Cloud Console

## Cost Optimization
- Cloud Run charges per request (very cost-effective)
- Free tier: 2 million requests/month
- Typical cost for small apps: $0-5/month
