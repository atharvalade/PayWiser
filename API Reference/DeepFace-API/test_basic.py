#!/usr/bin/env python3
"""
Simple test API to verify FastAPI and Supabase work
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import config
from supabase import create_client, Client

app = FastAPI(title="FacePay Test API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)

@app.get("/")
async def root():
    return {"message": "FacePay Test API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "fastapi_working": True,
        "supabase_url": config.SUPABASE_URL[:50] + "...",
        "wallets_configured": len(config.WALLETS)
    }

@app.get("/test-database")
async def test_database():
    """Test Supabase connection"""
    try:
        result = supabase.table('face_embeddings').select('*').limit(1).execute()
        return {
            "database_connected": True,
            "table_accessible": True,
            "records_count": len(result.data)
        }
    except Exception as e:
        return {
            "database_connected": False,
            "error": str(e)
        }

@app.post("/test-upload")
async def test_upload(image: UploadFile = File(...)):
    """Test file upload"""
    try:
        content = await image.read()
        return {
            "upload_success": True,
            "filename": image.filename,
            "size_bytes": len(content),
            "content_type": image.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("test_basic:app", host="0.0.0.0", port=8000, reload=True) 