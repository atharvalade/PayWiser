# FacePay DeepFace API - Render Deployment Guide

## 🚀 Deploy to Render

### Prerequisites
- Render account: https://render.com
- GitHub repository with this code
- Supabase database set up with the schema

### 1. Create Web Service on Render

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `DeepFace-API` directory as root

2. **Configure Service**
   ```
   Name: facepay-deepface-api
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   Set these in Render dashboard:
   
   ```bash
   SUPABASE_URL=https://nugfkvafpxuaspphxxmd.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   DEEPFACE_MODEL=VGG-Face
   DEEPFACE_DETECTOR=opencv
   CONFIDENCE_THRESHOLD=0.4
   PYTHON_VERSION=3.9.6
   ```

### 2. Deploy Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**
   - Render will automatically detect changes and deploy
   - First deployment takes ~5-10 minutes (installing TensorFlow)
   - Monitor logs for any issues

### 3. Test Deployment

Once deployed, test the endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# Register face
curl -X POST https://your-app.onrender.com/register-face \
  -F "userId=test_user" \
  -F "walletAddress=0x..." \
  -F "images=@image.jpg"

# Recognize face
curl -X POST https://your-app.onrender.com/recognize-face \
  -F "image=@test_image.jpg"
```

### 4. Important Notes

**⚠️ Render Limitations:**
- Free tier has 750 hours/month
- Services sleep after 15 minutes of inactivity
- Cold starts can take 30-60 seconds
- 512MB RAM limit (may need upgrade for TensorFlow)

**💡 Optimizations:**
- Consider upgrading to paid plan for better performance
- Use keep-alive service to prevent sleeping
- Monitor memory usage with TensorFlow

### 5. Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | Required | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Required | Service role key from Supabase |
| `DEEPFACE_MODEL` | VGG-Face | Face recognition model |
| `DEEPFACE_DETECTOR` | opencv | Face detection backend |
| `CONFIDENCE_THRESHOLD` | 0.4 | Recognition threshold (lower = stricter) |

### 6. Monitoring & Debugging

**Check Logs:**
- Go to Render dashboard → Your service → Logs
- Monitor for TensorFlow loading and face recognition

**Common Issues:**
- **Memory errors**: Upgrade to paid plan
- **Slow responses**: Cold start - keep service warm
- **Import errors**: Check requirements.txt versions

### 7. Production Considerations

**Security:**
- Replace hardcoded credentials with environment variables
- Use specific CORS origins instead of "*"
- Add rate limiting for API endpoints

**Performance:**
- Consider caching face embeddings
- Implement async processing for multiple images
- Use CDN for static assets

### 8. API Documentation

Once deployed, visit:
- **API Docs**: `https://your-app.onrender.com/docs`
- **Health Check**: `https://your-app.onrender.com/health`
- **Ping**: `https://your-app.onrender.com/ping`

### 9. Integration with iOS App

Your iOS app can now call:
```swift
// Replace with your actual Render URL
let baseURL = "https://facepay-deepface-api.onrender.com"

// Register face
POST /register-face
Content-Type: multipart/form-data

// Recognize face  
POST /recognize-face
Content-Type: multipart/form-data
```

### 10. Next Steps

After successful deployment:
1. Update iOS app with Render URL
2. Test end-to-end flow
3. Deploy Node.js API to Vercel
4. Configure iOS app to use both APIs

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Python on Render](https://render.com/docs/deploy-python-app)
- [Environment Variables](https://render.com/docs/environment-variables) 