import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from typing import Optional, Dict, List
import os
import json

class FirebaseDB:
    """Firebase Firestore Database Manager"""
    
    def __init__(self):     
        self._db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            if firebase_admin._apps:
                self._db = firestore.client()
                print("✓ Firebase already initialized")
                return
            
            # Load service account from environment or file
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
            
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
            else:
                # Try to load from environment variable
                service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
                if service_account_json:
                    service_account_dict = json.loads(service_account_json)
                    cred = credentials.Certificate(service_account_dict)
                else:
                    raise FileNotFoundError("Firebase service account credentials not found")
            
            firebase_admin.initialize_app(cred)
            self._db = firestore.client()
            print("✓ Firebase initialized successfully")
            
        except Exception as e:
            print(f"✗ Firebase initialization error: {e}")
            self._db = None
    
    @property
    def db(self):
        """Get Firestore database instance"""
        return self._db
    
    def is_connected(self) -> bool:
        """Check if Firebase is connected"""
        return self._db is not None


class FirebaseUserDB:
    """User management with Firebase Firestore"""
    
    def __init__(self, firebase_db: FirebaseDB):
        self.firebase = firebase_db
        self.collection_name = "users"
    
    def create_user(self, user_id: str, email: str, name: str = None, **kwargs) -> bool:
        """Create a new user in Firestore"""
        try:
            if not self.firebase.is_connected():
                return False
            
            user_data = {
                "user_id": user_id,
                "email": email,
                "name": name or email.split('@')[0],
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP,
                "last_active": firestore.SERVER_TIMESTAMP,
                "total_predictions": 0,
                "email_verified": kwargs.get("email_verified", False),
                "preferences": {
                    "theme": "light",
                    "notifications_enabled": True,
                    "sound_enabled": True
                },
                "profile": {
                    "avatar_url": kwargs.get("avatar_url"),
                    "bio": kwargs.get("bio", ""),
                    "favorite_breeds": []
                }
            }
            
            # Add any additional fields
            for key, value in kwargs.items():
                if key not in user_data:
                    user_data[key] = value
            
            self.firebase.db.collection(self.collection_name).document(user_id).set(user_data)
            print(f"✓ User {user_id} created in Firebase")
            return True
            
        except Exception as e:
            print(f"✗ Error creating user in Firebase: {e}")
            return False
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            if not self.firebase.is_connected():
                return None
            
            doc = self.firebase.db.collection(self.collection_name).document(user_id).get()
            
            if doc.exists:
                user_data = doc.to_dict()
                user_data['user_id'] = doc.id
                return user_data
            return None
            
        except Exception as e:
            print(f"✗ Error getting user from Firebase: {e}")
            return None
    
    def update_user(self, user_id: str, updates: Dict) -> bool:
        """Update user information"""
        try:
            if not self.firebase.is_connected():
                return False
            
            updates['updated_at'] = firestore.SERVER_TIMESTAMP
            
            self.firebase.db.collection(self.collection_name).document(user_id).update(updates)
            return True
            
        except Exception as e:
            print(f"✗ Error updating user in Firebase: {e}")
            return False
    
    def update_last_active(self, user_id: str) -> bool:
        """Update user's last active timestamp"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(user_id).update({
                'last_active': firestore.SERVER_TIMESTAMP
            })
            return True
            
        except Exception as e:
            print(f"✗ Error updating last active: {e}")
            return False
    
    def increment_prediction_count(self, user_id: str) -> bool:
        """Increment user's total prediction count"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(user_id).update({
                'total_predictions': firestore.Increment(1),
                'last_active': firestore.SERVER_TIMESTAMP
            })
            return True
            
        except Exception as e:
            print(f"✗ Error incrementing prediction count: {e}")
            return False
    
    def delete_user(self, user_id: str) -> bool:
        """Delete a user"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(user_id).delete()
            return True
            
        except Exception as e:
            print(f"✗ Error deleting user from Firebase: {e}")
            return False
    
    def get_all_users(self, limit: int = 100) -> List[Dict]:
        """Get all users (with limit)"""
        try:
            if not self.firebase.is_connected():
                return []
            
            users = []
            docs = self.firebase.db.collection(self.collection_name).limit(limit).stream()
            
            for doc in docs:
                user_data = doc.to_dict()
                user_data['user_id'] = doc.id
                users.append(user_data)
            
            return users
            
        except Exception as e:
            print(f"✗ Error getting all users: {e}")
            return []
    
    def update_preferences(self, user_id: str, preferences: Dict) -> bool:
        """Update user preferences"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(user_id).update({
                'preferences': preferences,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
            
        except Exception as e:
            print(f"✗ Error updating preferences: {e}")
            return False
    
    def add_favorite_breed(self, user_id: str, breed_name: str) -> bool:
        """Add a breed to user's favorites"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(user_id).update({
                'profile.favorite_breeds': firestore.ArrayUnion([breed_name])
            })
            return True
            
        except Exception as e:
            print(f"✗ Error adding favorite breed: {e}")
            return False
    
    def remove_favorite_breed(self, user_id: str, breed_name: str) -> bool:
        """Remove a breed from user's favorites"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(user_id).update({
                'profile.favorite_breeds': firestore.ArrayRemove([breed_name])
            })
            return True
            
        except Exception as e:
            print(f"✗ Error removing favorite breed: {e}")
            return False


class FirebasePredictionDB:
    """Prediction history management with Firebase"""
    
    def __init__(self, firebase_db: FirebaseDB):
        self.firebase = firebase_db
        self.collection_name = "predictions"
    
    def save_prediction(self, user_id: str, breed: str, confidence: float, 
                       image_name: str = None, top_predictions: List = None) -> Optional[str]:
        """Save a prediction to Firebase"""
        try:
            if not self.firebase.is_connected():
                return None
            
            prediction_data = {
                "user_id": user_id,
                "breed": breed,
                "confidence": confidence,
                "percentage": round(confidence * 100, 2),
                "image_name": image_name,
                "top_predictions": top_predictions or [],
                "timestamp": firestore.SERVER_TIMESTAMP,
                "created_at": datetime.utcnow().isoformat(),
                'image_url': image_url,  # 🔥 ADD THIS
                'thumbnail_url': thumbnail_url  # 🔥 ADD THIS
            }
            
            doc_ref = self.firebase.db.collection(self.collection_name).add(prediction_data)
            return doc_ref[1].id
            
        except Exception as e:
            print(f"✗ Error saving prediction to Firebase: {e}")
            return None
    
    def get_user_predictions(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's prediction history"""
        try:
            if not self.firebase.is_connected():
                return []
            
            predictions = []
            docs = (self.firebase.db.collection(self.collection_name)
                   .where('user_id', '==', user_id)
                   .order_by('timestamp', direction=firestore.Query.DESCENDING)
                   .limit(limit)
                   .stream())
            
            for doc in docs:
                pred_data = doc.to_dict()
                pred_data['id'] = doc.id
                predictions.append(pred_data)
            
            return predictions
            
        except Exception as e:
            print(f"✗ Error getting predictions: {e}")
            return []
    
    def get_prediction_count(self, user_id: str) -> int:
        """Get total number of predictions for a user"""
        try:
            if not self.firebase.is_connected():
                return 0
            
            docs = (self.firebase.db.collection(self.collection_name)
                   .where('user_id', '==', user_id)
                   .stream())
            
            return len(list(docs))
            
        except Exception as e:
            print(f"✗ Error getting prediction count: {e}")
            return 0
    
    def get_breed_stats(self, user_id: str) -> List[Dict]:
        """Get breed prediction statistics for a user"""
        try:
            if not self.firebase.is_connected():
                return []
            
            predictions = self.get_user_predictions(user_id, limit=1000)
            
            breed_counts = {}
            for pred in predictions:
                breed = pred.get('breed', 'Unknown')
                breed_counts[breed] = breed_counts.get(breed, 0) + 1
            
            stats = [
                {"breed": breed, "count": count}
                for breed, count in sorted(breed_counts.items(), key=lambda x: x[1], reverse=True)
            ]
            
            return stats
            
        except Exception as e:
            print(f"✗ Error getting breed stats: {e}")
            return []
    
    def delete_prediction(self, prediction_id: str) -> bool:
        """Delete a specific prediction"""
        try:
            if not self.firebase.is_connected():
                return False
            
            self.firebase.db.collection(self.collection_name).document(prediction_id).delete()
            return True
            
        except Exception as e:
            print(f"✗ Error deleting prediction: {e}")
            return False


# Initialize Firebase instances
firebase_db = FirebaseDB()
firebase_user_db = FirebaseUserDB(firebase_db)
firebase_prediction_db = FirebasePredictionDB(firebase_db)