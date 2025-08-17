#!/usr/bin/env python3
"""
PayWiser Face Recognition Utility
Python script for face recognition operations using DeepFace
"""

import sys
import json
import os
from deepface import DeepFace

def generate_embedding(image_path):
    """Generate face embedding from image"""
    try:
        if not os.path.exists(image_path):
            return {"success": False, "error": "Image file not found"}
        
        # Generate embedding using VGG-Face model
        embedding = DeepFace.represent(
            img_path=image_path,
            model_name='VGG-Face',
            detector_backend='opencv'
        )
        
        return {
            "success": True,
            "embedding": embedding[0]['embedding']
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def verify_faces(image_path1, image_path2, threshold=0.68):
    """Verify if two images contain the same person"""
    try:
        if not os.path.exists(image_path1):
            return {"success": False, "error": "First image file not found"}
        if not os.path.exists(image_path2):
            return {"success": False, "error": "Second image file not found"}
        
        # Verify faces using VGG-Face model
        result = DeepFace.verify(
            img1_path=image_path1,
            img2_path=image_path2,
            model_name='VGG-Face',
            detector_backend='opencv'
        )
        
        return {
            "success": True,
            "verified": result['verified'],
            "distance": result['distance'],
            "threshold": result['threshold']
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def extract_faces(image_path):
    """Extract and count faces in image"""
    try:
        if not os.path.exists(image_path):
            return {"success": False, "error": "Image file not found"}
        
        # Extract faces from image
        faces = DeepFace.extract_faces(
            img_path=image_path,
            enforce_detection=False,
            detector_backend='opencv'
        )
        
        return {
            "success": True,
            "faces_count": len(faces)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Insufficient arguments"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    
    if operation == "generate_embedding":
        if len(sys.argv) != 3:
            print(json.dumps({"success": False, "error": "Usage: generate_embedding <image_path>"}))
            sys.exit(1)
        
        image_path = sys.argv[2]
        result = generate_embedding(image_path)
        print(json.dumps(result))
    
    elif operation == "verify_faces":
        if len(sys.argv) < 4:
            print(json.dumps({"success": False, "error": "Usage: verify_faces <image_path1> <image_path2> [threshold]"}))
            sys.exit(1)
        
        image_path1 = sys.argv[2]
        image_path2 = sys.argv[3]
        threshold = float(sys.argv[4]) if len(sys.argv) > 4 else 0.68
        
        result = verify_faces(image_path1, image_path2, threshold)
        print(json.dumps(result))
    
    elif operation == "extract_faces":
        if len(sys.argv) != 3:
            print(json.dumps({"success": False, "error": "Usage: extract_faces <image_path>"}))
            sys.exit(1)
        
        image_path = sys.argv[2]
        result = extract_faces(image_path)
        print(json.dumps(result))
    
    else:
        print(json.dumps({"success": False, "error": f"Unknown operation: {operation}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
