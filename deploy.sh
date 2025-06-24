
#!/bin/bash

# Configuration
PROJECT_ID="vernal-parser-463912-n4"
SERVICE_NAME="youtube-ai-assistant"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to Cloud Run..."

# Build and tag the Docker image
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME} .

# Push the image to Google Container Registry
echo "⬆️ Pushing image to Container Registry..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --project ${PROJECT_ID}

echo "✅ Deployment complete!"
echo "Your app will be available at the URL provided above."
echo ""
echo "⚠️  IMPORTANT: Don't forget to update your Supabase URL configuration!"
echo "1. Go to https://supabase.com/dashboard/project/hrhnqwuyhotiswryzgqa/auth/url-configuration"
echo "2. Update Site URL to your Cloud Run URL"
echo "3. Add your Cloud Run URL to Redirect URLs"
