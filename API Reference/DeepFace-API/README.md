# FacePay DeepFace API

🎭 **Face Recognition API for FacePay System**

This is the production-ready DeepFace API that powers the FacePay application, providing face registration and recognition capabilities integrated with blockchain payments.

## ✅ **Features**

- 🎭 **Face Registration**: Store user faces with wallet addresses
- 🔍 **Face Recognition**: Identify users from photos  
- 🔗 **Blockchain Integration**: Links to Sepolia PyUSD wallets
- 🏦 **Supabase Database**: Secure face data storage
- 🚀 **Production Ready**: Optimized for Render deployment

## 🏗️ **Tech Stack**

- **Framework**: FastAPI + Uvicorn
- **ML Library**: DeepFace (VGG-Face model)
- **Database**: Supabase PostgreSQL
- **Computer Vision**: OpenCV
- **Blockchain**: Web3.py + eth-account
- **Deployment**: Render

## 🚀 **Quick Start**

### Local Development

1. **Setup Environment**
   ```bash
   python3.9 -m venv venv39
   source venv39/bin/activate  # On Windows: venv39\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**
   ```bash
   export SUPABASE_URL="https://nugfkvafpxuaspphxxmd.supabase.co"
   export SUPABASE_SERVICE_KEY="your_service_key"
   ```

3. **Run API**
   ```bash
   python main.py
   ```

4. **Test Endpoints**
   - API Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

### Production Deployment

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment guide.

## 📋 **API Endpoints**

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status and info |
| `GET` | `/health` | Health check with model info |
| `POST` | `/register-face` | Register user face + wallet |
| `POST` | `/recognize-face` | Identify user from photo |
| `GET` | `/users` | List registered users |
| `DELETE` | `/user/{id}` | Delete user |

### Example Usage

**Register Face:**
```bash
curl -X POST http://localhost:8000/register-face \
  -F "userId=user1" \
  -F "walletAddress=0x9f93EebD463d4B7c991986a082d974E77b5a02Dc" \
  -F "images=@face_photo.jpg"
```

**Recognize Face:**
```bash
curl -X POST http://localhost:8000/recognize-face \
  -F "image=@test_photo.jpg"
```

## 🧪 **Testing**

**Run Face Recognition + Payment Test:**
```bash
python test_payment_flow.py
```

This tests the complete flow:
1. Face recognition from image
2. Wallet identification  
3. PyUSD payment execution
4. Balance verification

## 🔧 **Configuration**

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Required | Service role key |
| `DEEPFACE_MODEL` | VGG-Face | Face recognition model |
| `DEEPFACE_DETECTOR` | opencv | Face detection backend |
| `CONFIDENCE_THRESHOLD` | 0.4 | Recognition threshold |
| `PORT` | 8000 | Server port |

### Model Options

**DeepFace Models:**
- `VGG-Face` (default) - Fast, reliable
- `Facenet` - High accuracy
- `OpenFace` - Lightweight
- `DeepFace` - Original model

**Detector Backends:**
- `opencv` (default) - Fast, stable
- `mtcnn` - Better for blurry images
- `retinaface` - High precision

## 🏦 **Database Schema**

```sql
CREATE TABLE face_embeddings (
    id UUID PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    face_data TEXT NOT NULL,  -- Base64 encoded image
    user_type TEXT DEFAULT 'consumer',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 **Integration**

### iOS App Integration
```swift
let baseURL = "https://your-app.onrender.com"

// Register face
POST /register-face
Content-Type: multipart/form-data

// Recognize face
POST /recognize-face
Content-Type: multipart/form-data
```

### Blockchain Integration
- **Network**: Sepolia Testnet
- **Token**: PyUSD (0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9)
- **PaymentHub**: 0x728d0f06Bf6D63B4bC9ca7C879D042DDAC66e8A3

## 📊 **Performance**

- **Face Recognition**: ~2-3 seconds
- **Registration**: ~1-2 seconds  
- **Cold Start**: ~30-60 seconds (Render)
- **Memory Usage**: ~400-500MB

## 🔒 **Security**

- ✅ Row Level Security on database
- ✅ Service role authentication
- ✅ Input validation and sanitization
- ✅ Temporary file cleanup
- ⚠️ CORS currently allows all origins (update for production)

## 🐛 **Troubleshooting**

**Common Issues:**
- **Memory errors**: Upgrade Render plan
- **Slow responses**: Cold start - use keep-alive
- **Import errors**: Check Python version (3.9 required)
- **TensorFlow issues**: Install tf-keras

**Debug Commands:**
```bash
# Check model loading
curl http://localhost:8000/health

# Verify face detection
curl -X POST http://localhost:8000/recognize-face \
  -F "image=@test.jpg" -v
```

## 📁 **Project Structure**

```
DeepFace-API/
├── main.py                 # FastAPI application
├── test_payment_flow.py    # End-to-end test script
├── database_schema.sql     # Supabase schema
├── requirements.txt        # Python dependencies
├── render.yaml            # Render configuration
├── RENDER_DEPLOYMENT.md   # Deployment guide
└── README.md              # This file
```

## 🎯 **Next Steps**

1. **Deploy to Render**: Follow deployment guide
2. **Update iOS App**: Point to Render URL
3. **Deploy Node.js API**: To Vercel for additional features
4. **Production Security**: Update CORS, add rate limiting
5. **Monitoring**: Add logging and analytics

## 📞 **Support**

For issues related to:
- **DeepFace**: Check model compatibility
- **Render**: Monitor deployment logs
- **Blockchain**: Verify Sepolia connectivity
- **Database**: Check Supabase connection

---

**FacePay System Status**: ✅ **Fully Operational**
- ✅ Face Recognition Working
- ✅ Blockchain Integration Active  
- ✅ Database Connected
- ✅ Ready for Production 