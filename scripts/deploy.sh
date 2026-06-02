#!/bin/bash

# Background Functions Deployment Script
# ========================================

echo "🚀 Deploying Background Functions with Netlify Blobs"
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 Found uncommitted changes. Committing..."
  git add .
  git commit -m "feat: add background functions with Netlify Blobs for long-running AI processing

- Transcript import now uses background processing (15min timeout)
- Image import now uses background processing (15min timeout)
- Live progress updates in UI
- No database required (uses Netlify Blobs)
- Graceful error handling with detailed messages"
  echo "✅ Changes committed"
else
  echo "✅ No uncommitted changes"
fi

echo ""
echo "📤 Pushing to main branch..."
git push origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pushed to main!"
  echo ""
  echo "⏳ Next steps:"
  echo "   1. Wait 2-3 minutes for Netlify deployment"
  echo "   2. Go to https://app.netlify.com to check deploy status"
  echo "   3. Test transcript import on production"
  echo "   4. Test image import on production"
  echo ""
  echo "📖 For detailed instructions, see:"
  echo "   - docs/deployment/DEPLOY_BACKGROUND_FUNCTIONS.md"
  echo "   - docs/deployment/BACKGROUND_FUNCTIONS_SUMMARY.md"
  echo ""
  echo "🎉 Deploy initiated successfully!"
else
  echo ""
  echo "❌ Push failed. Please check git output above."
  exit 1
fi

