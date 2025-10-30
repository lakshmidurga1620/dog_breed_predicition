from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import json
import os
from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel

# Cloudinary imports
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Import authentication
from auth import get_current_user, get_optional_user

# Import both database systems
from database import mongodb, prediction_db as mongo_prediction_db, user_db as mongo_user_db
from firebase_db import firebase_db, firebase_user_db, firebase_prediction_db

# Import feedback database
from feedback_db import feedback_db
# Add this import
from vaccination_db import vaccination_db

app = FastAPI(title="Dog Breed Predictor API", version="2.4.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://localhost:5173",
        "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_PATH = "models/best_phaseB.keras"
BREED_INFO_PATH = "models/breed_info.json"
CLASS_INDICES_PATH = "models/class_indices.json"
USE_FIREBASE = os.getenv("USE_FIREBASE", "true").lower() == "true"

# Global variables
model = None
breed_database = {}
class_names = []

# ============================================
# PYDANTIC MODELS FOR FEEDBACK
# ============================================

class FeedbackSubmission(BaseModel):
    feedback_type: str  # 'prediction_correct', 'prediction_wrong', 'feature', 'bug', 'general'
    message: str
    rating: Optional[int] = None  # 1-5 stars
    prediction_id: Optional[str] = None
    breed_predicted: Optional[str] = None
    actual_breed: Optional[str] = None
    metadata: Optional[dict] = None

class FeedbackStatusUpdate(BaseModel):
    status: str  # 'pending', 'reviewed', 'resolved'
    admin_response: Optional[str] = None

class FeedbackPrivacyUpdate(BaseModel):
    is_private: bool

# Pydantic Models for Vaccinations
class VaccinationCreate(BaseModel):
    name: str
    due_date: str  # Format: YYYY-MM-DD
    status: str = "pending"  # pending, upcoming, completed, overdue
    last_date: Optional[str] = None  # Format: YYYY-MM-DD
    notes: str = ""
    required: bool = False
    pet_name: Optional[str] = None

class VaccinationUpdate(BaseModel):
    name: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    last_date: Optional[str] = None
    notes: Optional[str] = None
    required: Optional[bool] = None
    pet_name: Optional[str] = None


def load_breed_database():
    """Load breed information from JSON file"""
    global breed_database
    try:
        with open(BREED_INFO_PATH, 'r', encoding='utf-8') as f:
            breed_database = json.load(f)
        print(f"✓ Loaded {len(breed_database)} breeds from database")
        return True
    except FileNotFoundError:
        print(f"✗ Warning: {BREED_INFO_PATH} not found")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ Error parsing breed_info.json: {e}")
        return False

def load_class_indices():
    """Load class indices mapping"""
    global class_names
    try:
        with open(CLASS_INDICES_PATH, 'r', encoding='utf-8') as f:
            class_data = json.load(f)
        
        if isinstance(class_data, dict):
            class_names = [class_data[str(i)] for i in range(len(class_data))]
        elif isinstance(class_data, list):
            class_names = class_data
        
        print(f"✓ Loaded {len(class_names)} class names")
        return True
    except FileNotFoundError:
        print(f"✗ Warning: {CLASS_INDICES_PATH} not found")
        class_names = list(breed_database.keys())
        return False
    except Exception as e:
        print(f"✗ Error loading class indices: {e}")
        class_names = list(breed_database.keys())
        return False

def load_model():
    """Load the trained model"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print(f"✓ Model loaded successfully from {MODEL_PATH}")
            return True
        else:
            print(f"✗ Model file not found: {MODEL_PATH}")
            return False
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return False

def preprocess_image(image_bytes):
    """Preprocess image for model prediction"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img = img.resize((224, 224))
        img_array = np.array(img, dtype=np.float32)
        img_array = tf.keras.applications.efficientnet_v2.preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

def normalize_breed_name(name):
    """Normalize breed name for consistent lookup"""
    return name.replace('_', ' ').replace('-', ' ').strip()

def get_breed_info(breed_name):
    """Get breed information from database"""
    normalized = normalize_breed_name(breed_name)
    
    for key in breed_database.keys():
        if normalize_breed_name(key).lower() == normalized.lower():
            return breed_database[key]
    
    return {
        "size": "Medium",
        "temperament": ["Friendly", "Intelligent"],
        "energy_level": "Moderate",
        "life_span": "10-15 years",
        "group": "Not specified",
        "good_with_kids": "Unknown",
        "good_with_pets": "Unknown",
        "trainability": "Moderate"
    }

def upload_to_cloudinary(image_bytes, user_id, filename):
    """
    Upload image to Cloudinary and return URLs
    """
    try:
        # Generate unique Public ID (Format: YYYYMMDD_HHMMSS_uuid)
        timestamp_id = datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + str(uuid.uuid4()).split('-')[0]
        cloudinary_folder = f"predictions/{user_id}"
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            image_bytes,
            folder=cloudinary_folder,
            public_id=timestamp_id,
            resource_type="image",
            overwrite=True
        )
        
        # Get secure URL
        image_url = upload_result.get('secure_url')
        
        # Generate thumbnail URL (150x150)
        thumbnail_url = cloudinary.CloudinaryImage(upload_result['public_id']).build_url(
            transformation=[
                {'width': 150, 'height': 150, 'crop': 'fill', 'gravity': 'auto'},
                {'quality': 'auto', 'fetch_format': 'auto'}
            ]
        )
        
        print(f"✅ Uploaded to Cloudinary: {image_url}")
        print(f"✅ Thumbnail created: {thumbnail_url}")
        
        return {
            'url': image_url,
            'thumbnail_url': thumbnail_url,
            'public_id': upload_result['public_id']
        }
        
    except Exception as e:
        print(f"❌ Cloudinary Upload Failed: {e}")
        raise Exception(f"Cloudinary upload failed: {str(e)}")

async def ensure_user_exists(current_user: dict) -> dict:
    """Automatically create user in database if they don't exist"""
    if not current_user:
        return None
    
    user_id = current_user["user_id"]
    email = current_user.get("email", "")
    name = current_user.get("name", "")
    email_verified = current_user.get("email_verified", False)
    
    print(f"🔍 Checking user existence: {user_id}")
    
    try:
        if USE_FIREBASE:
            existing_user = firebase_user_db.get_user(user_id)
            
            if not existing_user:
                print(f"🆕 New Firebase user detected: {user_id}")
                print(f"   Email: {email}")
                print(f"   Name: {name}")
                
                try:
                    firebase_user_db.create_user(
                        user_id=user_id,
                        email=email,
                        name=name,
                        email_verified=email_verified
                    )
                    print(f"✅ Firebase user created successfully: {user_id}")
                    existing_user = firebase_user_db.get_user(user_id)
                    
                    if existing_user:
                        print(f"✅ User verified in database: {user_id}")
                    else:
                        print(f"⚠️  User created but not found in get_user: {user_id}")
                        
                except Exception as create_error:
                    print(f"❌ Error creating Firebase user: {create_error}")
                    import traceback
                    traceback.print_exc()
                    
                    return {
                        "user_id": user_id,
                        "email": email,
                        "name": name,
                        "created_at": datetime.now(),
                        "total_predictions": 0
                    }
            else:
                print(f"✓ User exists: {user_id}")
                try:
                    firebase_user_db.update_last_active(user_id)
                    print(f"✓ Updated last_active for: {user_id}")
                except Exception as update_error:
                    print(f"⚠️  Could not update last_active: {update_error}")
            
            return existing_user
            
        else:
            existing_user = mongo_user_db.get_user(user_id)
            
            if not existing_user:
                print(f"🆕 New MongoDB user detected: {user_id}")
                mongo_user_db.create_or_update_user(
                    user_id=user_id,
                    email=email,
                    name=name
                )
                print(f"✅ MongoDB user created: {user_id}")
            else:
                print(f"✓ User exists: {user_id}")
                mongo_user_db.update_last_active(user_id)
            
            return mongo_user_db.get_user(user_id)
    
    except Exception as e:
        print(f"❌ Critical error in ensure_user_exists: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "user_id": user_id,
            "email": email,
            "name": name,
            "created_at": datetime.now(),
            "total_predictions": 0
        }


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("=" * 50)
    print("Dog Breed Predictor API - Starting")
    print("=" * 50)
    
    load_breed_database()
    load_class_indices()
    
    model_loaded = load_model()
    
    if not model_loaded:
        print("\n⚠ WARNING: Model not loaded. API will not work properly.")
        print(f"Please ensure model file exists at: {MODEL_PATH}\n")
    
    # Check Cloudinary configuration
    cloudinary_configured = all([
        os.getenv('CLOUDINARY_CLOUD_NAME'),
        os.getenv('CLOUDINARY_API_KEY'),
        os.getenv('CLOUDINARY_API_SECRET')
    ])
    
    print(f"\nDatabase Status:")
    print(f"  MongoDB: {'✓ Connected' if mongodb._client else '✗ Not connected'}")
    print(f"  Firebase: {'✓ Connected' if firebase_db.is_connected() else '✗ Not connected'}")
    print(f"  Primary DB: {'Firebase' if USE_FIREBASE else 'MongoDB'}")
    print(f"  Cloudinary: {'✓ Configured' if cloudinary_configured else '✗ Not configured'}")
    print(f"  Auto User Creation: ✓ Enabled")
    print(f"  Feedback System: ✓ Enabled (with Public/Private)")
    print(f"  Vaccination Tracking: ✓ Enabled")
    
    print("=" * 50)
    print("API is ready with Cloudinary Image Upload!")
    print("=" * 50)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    mongodb.close()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Dog Breed Predictor API",
        "version": "2.4.0",
        "status": "running",
        "features": [
            "authentication", 
            "hybrid-database", 
            "prediction", 
            "auto-user-creation",
            "feedback-system",
            "public-feedback",
            "vaccination-tracking",
            "cloudinary-storage"
        ],
        "primary_db": "firebase" if USE_FIREBASE else "mongodb"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    cloudinary_configured = all([
        os.getenv('CLOUDINARY_CLOUD_NAME'),
        os.getenv('CLOUDINARY_API_KEY'),
        os.getenv('CLOUDINARY_API_SECRET')
    ])
    
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "breeds_in_database": len(breed_database),
        "total_classes": len(class_names),
        "mongodb_connected": mongodb._client is not None,
        "firebase_connected": firebase_db.is_connected(),
        "cloudinary_configured": cloudinary_configured,
        "primary_database": "firebase" if USE_FIREBASE else "mongodb",
        "auto_user_creation": "enabled",
        "feedback_system": "enabled",
        "public_feedback": "enabled",
        "vaccination_tracking": "enabled",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_optional_user)
):
    """Predict dog breed from uploaded image (Public - Auth Optional)"""
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Server is not ready."
        )
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPG, PNG, WebP)"
        )
    
    try:
        if current_user:
            print(f"\n{'='*60}")
            print(f"🔐 Authenticated prediction request")
            print(f"User ID: {current_user.get('user_id')}")
            await ensure_user_exists(current_user)
            print(f"{'='*60}\n")
        
        image_bytes = await file.read()
        processed_image = preprocess_image(image_bytes)
        
        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        predicted_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_idx])
        
        if predicted_idx < len(class_names):
            breed_name = class_names[predicted_idx]
        else:
            breed_name = f"Unknown_Breed_{predicted_idx}"
        
        breed_display = normalize_breed_name(breed_name).title()
        breed_info = get_breed_info(breed_name)
        
        top_3_indices = np.argsort(predictions[0])[-3:][::-1]
        top_predictions = []
        
        for idx in top_3_indices:
            if idx < len(class_names):
                top_breed = normalize_breed_name(class_names[idx]).title()
                top_predictions.append({
                    "breed": top_breed,
                    "confidence": float(predictions[0][idx]),
                    "percentage": round(float(predictions[0][idx]) * 100, 2)
                })
        
        prediction_id = None
        image_url = None
        thumbnail_url = None
        
        # 🔥 UPLOAD IMAGE TO CLOUDINARY
        # Use authenticated user's ID if available, otherwise use form user_id
        effective_user_id = None
        if current_user:
            effective_user_id = current_user["user_id"]
        elif user_id and user_id != 'null' and user_id != 'undefined':
            effective_user_id = user_id
        
        if effective_user_id:
            try:
                print(f"📤 Uploading image to Cloudinary for user: {effective_user_id}")
                cloudinary_result = upload_to_cloudinary(
                    image_bytes=image_bytes,
                    user_id=effective_user_id,
                    filename=file.filename
                )
                
                image_url = cloudinary_result['url']
                thumbnail_url = cloudinary_result['thumbnail_url']
                
                print(f"✅ Image uploaded successfully")
                
            except Exception as img_error:
                print(f"⚠️  Image upload failed, continuing without image: {img_error}")
                # Continue without failing the prediction
        
        # Save prediction to database (only for authenticated users)
        if current_user:
            if USE_FIREBASE:
                firebase_user_db.update_last_active(current_user["user_id"])
                firebase_user_db.increment_prediction_count(current_user["user_id"])
                prediction_id = firebase_prediction_db.save_prediction(
                    user_id=current_user["user_id"],
                    breed=breed_display,
                    confidence=confidence,
                    image_name=file.filename,
                    top_predictions=top_predictions,
                    image_url=image_url,
                    thumbnail_url=thumbnail_url
                )
                print(f"✅ Prediction saved to Firebase: {prediction_id}")
            else:
                mongo_user_db.update_last_active(current_user["user_id"])
                prediction_id = mongo_prediction_db.save_prediction(
                    user_id=current_user["user_id"],
                    breed=breed_display,
                    confidence=confidence,
                    image_name=file.filename,
                    image_url=image_url,
                    thumbnail_url=thumbnail_url
                )
                print(f"✅ Prediction saved to MongoDB: {prediction_id}")
        
        return {
            "success": True,
            "prediction_id": prediction_id,
            "prediction": {
                "breed": breed_display,
                "confidence": confidence,
                "percentage": round(confidence * 100, 2)
            },
            "top_predictions": top_predictions,
            "breed_info": breed_info,
            "image_url": image_url,
            "thumbnail_url": thumbnail_url,
            "timestamp": datetime.now().isoformat(),
            "authenticated": current_user is not None,
            "database_used": "firebase" if USE_FIREBASE else "mongodb"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

# ============================================
# FEEDBACK ENDPOINTS
# ============================================

@app.post("/feedback")
async def submit_feedback(
    feedback: FeedbackSubmission,
    current_user: dict = Depends(get_current_user)
):
    """Submit feedback after prediction (Protected)"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        feedback_id = feedback_db.submit_feedback(
            user_id=user_id,
            feedback_type=feedback.feedback_type,
            message=feedback.message,
            rating=feedback.rating,
            prediction_id=feedback.prediction_id,
            breed_predicted=feedback.breed_predicted,
            actual_breed=feedback.actual_breed,
            metadata=feedback.metadata
        )
        
        if not feedback_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to submit feedback"
            )
        
        print(f"✅ Feedback submitted by user {user_id}: {feedback_id}")
        
        return {
            "success": True,
            "message": "Thank you for your feedback!",
            "feedback_id": feedback_id,
            "type": feedback.feedback_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in /feedback POST: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit feedback: {str(e)}"
        )


@app.get("/feedback/my")
async def get_my_feedback(
    limit: int = 50,
    feedback_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's feedback history (Protected)"""
    try:
        await ensure_user_exists(current_user)
        
        feedback_list = feedback_db.get_user_feedback(
            user_id=current_user["user_id"],
            limit=limit,
            feedback_type=feedback_type
        )
        
        return {
            "success": True,
            "total": len(feedback_list),
            "feedback": feedback_list
        }
        
    except Exception as e:
        print(f"❌ Error in /feedback/my: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch feedback: {str(e)}"
        )


@app.get("/feedback/public")
async def get_public_feedback(
    limit: int = 50,
    feedback_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all PUBLIC feedback (visible to all authenticated users)"""
    try:
        await ensure_user_exists(current_user)
        
        if USE_FIREBASE:
            from google.cloud import firestore
            
            query = firebase_db._db.collection('feedback').where('is_private', '==', False)
            
            if feedback_type:
                query = query.where('type', '==', feedback_type)
            
            query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
            query = query.limit(limit)
            
            docs = query.stream()
            
            feedback_list = []
            for doc in docs:
                feedback_data = doc.to_dict()
                feedback_data['id'] = doc.id
                
                if feedback_data.get('created_at'):
                    feedback_data['created_at'] = feedback_data['created_at'].isoformat()
                if feedback_data.get('updated_at'):
                    feedback_data['updated_at'] = feedback_data['updated_at'].isoformat()
                
                feedback_data['user_id'] = 'anonymous'
                
                feedback_list.append(feedback_data)
        else:
            query = {'is_private': False}
            if feedback_type:
                query['type'] = feedback_type
            
            cursor = mongodb._db['feedback'].find(query).sort('created_at', -1).limit(limit)
            
            feedback_list = []
            for doc in cursor:
                doc['id'] = str(doc['_id'])
                del doc['_id']
                
                if doc.get('created_at'):
                    doc['created_at'] = doc['created_at'].isoformat()
                if doc.get('updated_at'):
                    doc['updated_at'] = doc['updated_at'].isoformat()
                
                doc['user_id'] = 'anonymous'
                feedback_list.append(doc)
        
        return {
            "success": True,
            "total": len(feedback_list),
            "feedback": feedback_list
        }
        
    except Exception as e:
        print(f"❌ Error fetching public feedback: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch public feedback: {str(e)}"
        )


@app.put("/feedback/{feedback_id}/privacy")
async def update_feedback_privacy(
    feedback_id: str,
    privacy_update: FeedbackPrivacyUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update privacy setting of user's own feedback"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        if USE_FIREBASE:
            doc_ref = firebase_db._db.collection('feedback').document(feedback_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise HTTPException(status_code=404, detail="Feedback not found")
            
            feedback_data = doc.to_dict()
            
            if feedback_data.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail="You can only modify your own feedback")
            
            from google.cloud import firestore
            doc_ref.update({
                'is_private': privacy_update.is_private,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            print(f"✅ Privacy updated for feedback {feedback_id}: {privacy_update.is_private}")
        else:
            from bson import ObjectId
            
            feedback = mongodb._db['feedback'].find_one({'_id': ObjectId(feedback_id)})
            
            if not feedback:
                raise HTTPException(status_code=404, detail="Feedback not found")
            
            if feedback.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail="You can only modify your own feedback")
            
            mongodb._db['feedback'].update_one(
                {'_id': ObjectId(feedback_id)},
                {'$set': {
                    'is_private': privacy_update.is_private,
                    'updated_at': datetime.now()
                }}
            )
            
            print(f"✅ Privacy updated for feedback {feedback_id}: {privacy_update.is_private}")
        
        return {
            "success": True,
            "message": "Privacy setting updated",
            "feedback_id": feedback_id,
            "is_private": privacy_update.is_private
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating privacy: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update privacy: {str(e)}"
        )


@app.get("/feedback/all")
async def get_all_feedback_admin(
    limit: int = 100,
    status: Optional[str] = None,
    feedback_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all feedback (Admin only)"""
    try:
        feedback_list = feedback_db.get_all_feedback(
            limit=limit,
            status=status,
            feedback_type=feedback_type
        )
        
        return {
            "success": True,
            "total": len(feedback_list),
            "feedback": feedback_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in /feedback/all: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch feedback: {str(e)}"
        )


@app.put("/feedback/{feedback_id}/status")
async def update_feedback_status_endpoint(
    feedback_id: str,
    status_update: FeedbackStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update feedback status (Admin only)"""
    try:
        success = feedback_db.update_feedback_status(
            feedback_id=feedback_id,
            status=status_update.status,
            admin_response=status_update.admin_response
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to update feedback status"
            )
        
        return {
            "success": True,
            "message": "Feedback status updated",
            "feedback_id": feedback_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating feedback status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update status: {str(e)}"
        )


@app.get("/feedback/stats")
async def get_feedback_stats_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """Get feedback statistics (Admin only)"""
    try:
        stats = feedback_db.get_feedback_stats()
        
        return {
            "success": True,
            "stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching feedback stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stats: {str(e)}"
        )


# ============================================
# VACCINATION ENDPOINTS
# ============================================

@app.post("/vaccinations")
async def create_vaccination(
    vaccination: VaccinationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new vaccination record for the current user"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        vaccination_id = vaccination_db.create_vaccination(
            user_id=user_id,
            name=vaccination.name,
            due_date=vaccination.due_date,
            status=vaccination.status,
            last_date=vaccination.last_date,
            notes=vaccination.notes,
            required=vaccination.required,
            pet_name=vaccination.pet_name
        )
        
        if not vaccination_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to create vaccination record"
            )
        
        print(f"✅ Vaccination created for user {user_id}: {vaccination_id}")
        
        return {
            "success": True,
            "message": "Vaccination record created successfully",
            "vaccination_id": vaccination_id,
            "vaccination": {
                "id": vaccination_id,
                "name": vaccination.name,
                "due_date": vaccination.due_date,
                "status": vaccination.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating vaccination: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create vaccination: {str(e)}"
        )


@app.get("/vaccinations")
async def get_my_vaccinations(
    limit: int = 100,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all vaccination records for the current user"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        vaccinations = vaccination_db.get_user_vaccinations(
            user_id=user_id,
            limit=limit,
            status=status
        )
        
        return {
            "success": True,
            "total": len(vaccinations),
            "vaccinations": vaccinations,
            "user_id": user_id
        }
        
    except Exception as e:
        print(f"❌ Error fetching vaccinations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vaccinations: {str(e)}"
        )


@app.get("/vaccinations/{vaccination_id}")
async def get_vaccination(
    vaccination_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific vaccination record by ID"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        vaccination = vaccination_db.get_vaccination_by_id(
            vaccination_id=vaccination_id,
            user_id=user_id
        )
        
        if not vaccination:
            raise HTTPException(
                status_code=404,
                detail="Vaccination record not found or you don't have access"
            )
        
        return {
            "success": True,
            "vaccination": vaccination
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching vaccination: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vaccination: {str(e)}"
        )


@app.put("/vaccinations/{vaccination_id}")
async def update_vaccination(
    vaccination_id: str,
    vaccination_update: VaccinationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a vaccination record"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        update_data = {}
        if vaccination_update.name is not None:
            update_data['name'] = vaccination_update.name
        if vaccination_update.due_date is not None:
            update_data['due_date'] = vaccination_update.due_date
        if vaccination_update.status is not None:
            update_data['status'] = vaccination_update.status
        if vaccination_update.last_date is not None:
            update_data['last_date'] = vaccination_update.last_date
        if vaccination_update.notes is not None:
            update_data['notes'] = vaccination_update.notes
        if vaccination_update.required is not None:
            update_data['required'] = vaccination_update.required
        if vaccination_update.pet_name is not None:
            update_data['pet_name'] = vaccination_update.pet_name
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        success = vaccination_db.update_vaccination(
            vaccination_id=vaccination_id,
            user_id=user_id,
            update_data=update_data
        )
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Vaccination record not found or you don't have access"
            )
        
        updated_vaccination = vaccination_db.get_vaccination_by_id(
            vaccination_id=vaccination_id,
            user_id=user_id
        )
        
        return {
            "success": True,
            "message": "Vaccination record updated successfully",
            "vaccination": updated_vaccination
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating vaccination: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update vaccination: {str(e)}"
        )


@app.delete("/vaccinations/{vaccination_id}")
async def delete_vaccination(
    vaccination_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a vaccination record"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        success = vaccination_db.delete_vaccination(
            vaccination_id=vaccination_id,
            user_id=user_id
        )
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Vaccination record not found or you don't have access"
            )
        
        return {
            "success": True,
            "message": "Vaccination record deleted successfully",
            "vaccination_id": vaccination_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting vaccination: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete vaccination: {str(e)}"
        )


@app.get("/vaccinations/stats/summary")
async def get_vaccination_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get vaccination statistics for the current user"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        stats = vaccination_db.get_vaccination_stats(user_id)
        
        return {
            "success": True,
            "stats": stats,
            "user_id": user_id
        }
        
    except Exception as e:
        print(f"❌ Error fetching vaccination stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch statistics: {str(e)}"
        )


@app.get("/vaccinations/upcoming/next")
async def get_upcoming_vaccinations(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get vaccinations due in the next X days"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        
        upcoming = vaccination_db.get_upcoming_vaccinations(
            user_id=user_id,
            days=days
        )
        
        return {
            "success": True,
            "total": len(upcoming),
            "days_ahead": days,
            "upcoming_vaccinations": upcoming,
            "user_id": user_id
        }
        
    except Exception as e:
        print(f"❌ Error fetching upcoming vaccinations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch upcoming vaccinations: {str(e)}"
        )


# ============================================
# HISTORY & STATS ENDPOINTS
# ============================================

@app.get("/history")
async def get_prediction_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's prediction history (Protected)"""
    try:
        await ensure_user_exists(current_user)
        
        if USE_FIREBASE:
            predictions = firebase_prediction_db.get_user_predictions(
                user_id=current_user["user_id"],
                limit=limit
            )
            total_count = firebase_prediction_db.get_prediction_count(
                user_id=current_user["user_id"]
            )
        else:
            predictions = mongo_prediction_db.get_user_predictions(
                user_id=current_user["user_id"],
                limit=limit
            )
            total_count = mongo_prediction_db.get_prediction_count(
                user_id=current_user["user_id"]
            )
        
        return {
            "success": True,
            "total_predictions": total_count,
            "predictions": predictions,
            "source": "firebase" if USE_FIREBASE else "mongodb"
        }
    except Exception as e:
        print(f"❌ Error in /history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {str(e)}"
        )


@app.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics (Protected)"""
    try:
        await ensure_user_exists(current_user)
        
        if USE_FIREBASE:
            breed_stats = firebase_prediction_db.get_breed_stats(current_user["user_id"])
            total_predictions = firebase_prediction_db.get_prediction_count(current_user["user_id"])
        else:
            breed_stats = mongo_prediction_db.get_breed_stats(current_user["user_id"])
            total_predictions = mongo_prediction_db.get_prediction_count(current_user["user_id"])
        
        return {
            "success": True,
            "total_predictions": total_predictions,
            "breed_statistics": breed_stats,
            "user_id": current_user["user_id"],
            "source": "firebase" if USE_FIREBASE else "mongodb"
        }
    except Exception as e:
        print(f"❌ Error in /stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stats: {str(e)}"
        )


# ============================================
# BREED ENDPOINTS
# ============================================

@app.get("/breeds")
async def get_breeds():
    """Get list of all supported breeds (Public)"""
    breeds_list = [normalize_breed_name(b).title() for b in class_names]
    return {
        "total": len(breeds_list),
        "breeds": sorted(breeds_list)
    }


@app.get("/breed/{breed_name}")
async def get_breed_details(breed_name: str):
    """Get detailed information about a specific breed (Public)"""
    breed_info = get_breed_info(breed_name)
    
    if breed_info.get("size") != "Medium":  # Not default
        return {
            "breed": normalize_breed_name(breed_name).title(),
            "info": breed_info
        }
    else:
        raise HTTPException(
            status_code=404,
            detail=f"No information available for {breed_name}"
        )


# ============================================
# USER PROFILE ENDPOINTS
# ============================================

@app.post("/user/profile")
async def update_user_profile(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create or update user profile (Protected)"""
    try:
        await ensure_user_exists(current_user)
        
        user_id = current_user["user_id"]
        email = current_user.get("email")
        name = current_user.get("name")
        
        try:
            body = await request.json() if request.headers.get("content-type") == "application/json" else {}
        except:
            body = {}
        
        if USE_FIREBASE:
            firebase_user_db.update_user(user_id, {
                "email": email,
                "name": name,
                **body
            })
        else:
            mongo_user_db.create_or_update_user(
                user_id=user_id,
                email=email,
                name=name
            )
        
        return {
            "success": True,
            "message": "User profile updated",
            "user_id": user_id,
            "database": "firebase" if USE_FIREBASE else "mongodb"
        }
    except Exception as e:
        print(f"❌ Error in /user/profile POST: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )


@app.get("/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile (Protected)"""
    try:
        await ensure_user_exists(current_user)
        
        if USE_FIREBASE:
            user = firebase_user_db.get_user(current_user["user_id"])
        else:
            user = mongo_user_db.get_user(current_user["user_id"])
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch profile: {str(e)}"
        )




if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)