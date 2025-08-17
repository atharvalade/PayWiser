#!/usr/bin/env python3
"""
FacePay DeepFace API - Production Ready
Face recognition API using DeepFace for FacePay system
Supports face registration, recognition, and blockchain integration
"""

import os
import base64
import tempfile
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from deepface import DeepFace
import uvicorn

# Configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nugfkvafpxuaspphxxmd.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2ZrdmFmcHh1YXNwcGh4eG1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY4NjU0OSwiZXhwIjoyMDY2MjYyNTQ5fQ.tzrT15xxjelJo_W3vU_urtDH7c2gtgzAvAUEzI-Eh3U")
DEEPFACE_MODEL = os.getenv("DEEPFACE_MODEL", "VGG-Face")
DEEPFACE_DETECTOR = os.getenv("DEEPFACE_DETECTOR", "opencv")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.4"))

# Wallet configurations
WALLETS = {
    "user1": {
        "address": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
        "private_key": "15953296e322c945eaa0c215f8740fcdb1cb18231d19e477efa91ae4310becdf"
    },
    "user2": {
        "address": "0xa999F0CB16b55516BD82fd77Dc19f495b41f0770", 
        "private_key": "dcf06adcd2d997d57bfb5275ae3493d8afdb606d7c51c66eafbb7c5abff04d2c"
    },
    "merchant": {
        "address": "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7",
        "private_key": "ffc39a39c2d5436985f83336fe8710c38a50ab49171e19ea5ca9968e7fff2492"
    }
}

app = FastAPI(
    title="FacePay DeepFace API",
    description="Face recognition API for FacePay system with blockchain integration",
    version="1.0.0"
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def save_temp_image(file_content: bytes) -> str:
    """Save uploaded file content to a temporary file"""
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
        temp_file.write(file_content)
        return temp_file.name

def cleanup_temp_file(file_path: str):
    """Remove temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error cleaning up temp file: {e}")

def image_to_base64(image_path: str) -> str:
    """Convert image to base64 string for storage"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def base64_to_image(base64_string: str, output_path: str):
    """Convert base64 string back to image file"""
    image_data = base64.b64decode(base64_string)
    with open(output_path, "wb") as image_file:
        image_file.write(image_data)

# API Routes

@app.get("/")
async def root():
    return {
        "message": "FacePay DeepFace API", 
        "status": "running",
        "version": "1.0.0",
        "deployment": "render"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "deepface_available": True,
        "timestamp": datetime.now().isoformat(),
        "model": DEEPFACE_MODEL,
        "detector": DEEPFACE_DETECTOR,
        "threshold": CONFIDENCE_THRESHOLD,
        "deployment": "render"
    }

@app.post("/register-face")
async def register_face(
    userId: str = Form(...),
    walletAddress: str = Form(...),
    images: List[UploadFile] = File(...)
):
    """Register a user's face using multiple training images"""
    
    if not images or len(images) == 0:
        raise HTTPException(status_code=400, detail="No images provided")
    
    if len(images) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")
    
    print(f"🎭 Registering face for user {userId} with {len(images)} images")
    
    temp_files = []
    processed_images = []
    
    try:
        # Process each uploaded image
        for i, image in enumerate(images):
            print(f"Processing image {i+1}: {image.filename}")
            
            # Save to temporary file
            content = await image.read()
            temp_path = save_temp_image(content)
            temp_files.append(temp_path)
            
            # Verify face exists in image using DeepFace
            try:
                # Simple face detection
                face_objs = DeepFace.extract_faces(
                    img_path=temp_path,
                    detector_backend=DEEPFACE_DETECTOR,
                    enforce_detection=True
                )
                
                if len(face_objs) > 0:
                    print(f"✅ Face detected in image {i+1}")
                    # Convert image to base64 for storage
                    image_b64 = image_to_base64(temp_path)
                    processed_images.append({
                        "image_data": image_b64,
                        "filename": image.filename
                    })
                else:
                    print(f"⚠️ No face detected in image {i+1}")
                    
            except Exception as face_error:
                print(f"⚠️ Face detection failed for image {i+1}: {face_error}")
                continue
        
        if len(processed_images) == 0:
            raise HTTPException(status_code=400, detail="No faces detected in any image")
        
        # Store in Supabase (simplified - using first image only)
        first_image = processed_images[0]
        face_data = {
            "user_id": userId,
            "wallet_address": walletAddress,
            "face_data": first_image["image_data"],  # Store base64 image data
            "created_at": datetime.now().isoformat()
        }
        
        # First, try to delete any existing entry for this user
        try:
            delete_result = supabase.table('face_embeddings').delete().eq('user_id', userId).execute()
            if delete_result.data:
                print(f"🗑️ Deleted existing registration for user {userId}")
        except Exception as delete_error:
            print(f"⚠️ No existing user to delete or delete failed: {delete_error}")
        
        # Now insert the new data
        result = supabase.table('face_embeddings').insert(face_data).execute()
        
        print(f"🎉 Successfully registered {userId} with {len(processed_images)} face images")
        
        return {
            "success": True,
            "userId": userId,
            "walletAddress": walletAddress,
            "imagesProcessed": len(processed_images),
            "totalImages": len(images),
            "model": DEEPFACE_MODEL
        }
        
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Face registration failed: {str(e)}")
    
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            cleanup_temp_file(temp_file)

@app.post("/recognize-face")
async def recognize_face(image: UploadFile = File(...)):
    """Recognize a user from a single face image"""
    
    print(f"🔍 Processing face recognition for: {image.filename}")
    
    temp_file = None
    comparison_files = []
    
    try:
        # Save uploaded image to temporary file
        content = await image.read()
        temp_file = save_temp_image(content)
        
        # Verify face exists in uploaded image
        try:
            face_objs = DeepFace.extract_faces(
                img_path=temp_file,
                detector_backend=DEEPFACE_DETECTOR,
                enforce_detection=True
            )
            
            if len(face_objs) == 0:
                raise HTTPException(status_code=400, detail="No face detected in image")
                
        except Exception as face_error:
            raise HTTPException(status_code=400, detail=f"Face detection failed: {str(face_error)}")
        
        print("✅ Face detected, comparing with registered users...")
        
        # Get all registered users from database
        registered_users = supabase.table('face_embeddings').select('*').execute()
        
        if not registered_users.data or len(registered_users.data) == 0:
            raise HTTPException(status_code=404, detail="No registered users found")
        
        best_match = None
        best_distance = float('inf')
        
        # Compare with each registered user
        for user in registered_users.data:
            user_id = user['user_id']
            wallet_address = user['wallet_address']
            stored_face_data = user.get('face_data')
            
            if not stored_face_data:
                print(f"No face data for user {user_id}")
                continue
                
            print(f"Comparing with user {user_id}")
            
            try:
                # Convert stored base64 image back to file
                comparison_path = save_temp_image(base64.b64decode(stored_face_data))
                comparison_files.append(comparison_path)
                
                # Use DeepFace to verify faces
                result = DeepFace.verify(
                    img1_path=temp_file,
                    img2_path=comparison_path,
                    model_name=DEEPFACE_MODEL,
                    detector_backend=DEEPFACE_DETECTOR,
                    enforce_detection=False
                )
                
                distance = result['distance']
                verified = result['verified']
                
                print(f"  Distance: {distance:.4f}, Verified: {verified}")
                
                user_best_distance = distance
                
            except Exception as compare_error:
                print(f"  Comparison error: {compare_error}")
                continue
            
            # Check if this is the best match so far
            if user_best_distance < best_distance and user_best_distance < CONFIDENCE_THRESHOLD:
                best_distance = user_best_distance
                best_match = {
                    "userId": user_id,
                    "walletAddress": wallet_address,
                    "distance": user_best_distance,
                    "confidence": user_best_distance
                }
        
        # Clean up comparison files
        for comp_file in comparison_files:
            cleanup_temp_file(comp_file)
        
        if best_match:
            print(f"🎉 Best match: {best_match['userId']} (distance: {best_match['distance']:.4f})")
            
            return {
                "success": True,
                "userId": best_match["userId"],
                "walletAddress": best_match["walletAddress"],
                "distance": best_match["distance"],
                "confidence": best_match["confidence"],
                "threshold": CONFIDENCE_THRESHOLD,
                "model": DEEPFACE_MODEL
            }
        else:
            print("❌ No matching face found")
            raise HTTPException(status_code=404, detail="No matching face found")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Recognition error: {e}")
        raise HTTPException(status_code=500, detail=f"Face recognition failed: {str(e)}")
    
    finally:
        # Clean up temporary files
        if temp_file:
            cleanup_temp_file(temp_file)
        for comp_file in comparison_files:
            cleanup_temp_file(comp_file)

@app.get("/users")
async def get_registered_users():
    """Get list of all registered users"""
    try:
        result = supabase.table('face_embeddings').select('user_id, wallet_address, created_at').execute()
        
        return {
            "success": True,
            "users": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@app.delete("/user/{user_id}")
async def delete_user(user_id: str):
    """Delete a registered user"""
    try:
        result = supabase.table('face_embeddings').delete().eq('user_id', user_id).execute()
        
        if result.data:
            return {"success": True, "message": f"User {user_id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

# Health check for Render
@app.get("/ping")
async def ping():
    return {"status": "pong"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False) 