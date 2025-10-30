# database.py
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class MongoDB:
    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDB, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self.connect()

    def connect(self):
        """Connect to MongoDB"""
        try:
            mongodb_uri = os.getenv("MONGODB_URI")
            db_name = os.getenv("MONGODB_DB_NAME", "dog_breed_predictor")
            
            if not mongodb_uri:
                raise ValueError("MONGODB_URI not found in environment variables")
            
            self._client = MongoClient(mongodb_uri)
            self._db = self._client[db_name]
            
            # Test connection
            self._client.admin.command('ping')
            print(f"✓ Connected to MongoDB: {db_name}")
            
        except ConnectionFailure as e:
            print(f"✗ MongoDB connection failed: {e}")
            raise
        except Exception as e:
            print(f"✗ MongoDB initialization error: {e}")
            raise

    def get_database(self):
        """Get database instance"""
        return self._db

    def get_collection(self, collection_name):
        """Get collection by name"""
        return self._db[collection_name]

    def close(self):
        """Close MongoDB connection"""
        if self._client:
            self._client.close()
            print("✓ MongoDB connection closed")

# Initialize MongoDB instance
mongodb = MongoDB()

# Database helper functions
class PredictionDB:
    """Handles prediction-related database operations"""
    
    def __init__(self):
        self.collection = mongodb.get_collection("predictions")
        # Create indexes
        self.collection.create_index("user_id")
        self.collection.create_index("timestamp")
    
    def save_prediction(self, user_id, breed, confidence, image_name=None):
        """Save a prediction to database"""
        prediction = {
            "user_id": user_id,
            "breed": breed,
            "confidence": confidence,
            "image_name": image_name,
            "timestamp": datetime.utcnow()
        }
        result = self.collection.insert_one(prediction)
        return str(result.inserted_id)
    
    def get_user_predictions(self, user_id, limit=50):
        """Get user's prediction history"""
        predictions = self.collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(limit)
        
        return [{
            "id": str(pred["_id"]),
            "breed": pred["breed"],
            "confidence": pred["confidence"],
            "image_name": pred.get("image_name"),
            "timestamp": pred["timestamp"].isoformat()
        } for pred in predictions]
    
    def get_prediction_count(self, user_id):
        """Get total predictions for a user"""
        return self.collection.count_documents({"user_id": user_id})
    
    def get_breed_stats(self, user_id):
        """Get breed prediction statistics for a user"""
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$breed",
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        results = self.collection.aggregate(pipeline)
        return [{
            "breed": stat["_id"],
            "count": stat["count"],
            "avg_confidence": stat["avg_confidence"]
        } for stat in results]

class UserDB:
    """Handles user-related database operations"""
    
    def __init__(self):
        self.collection = mongodb.get_collection("users")
        # Create unique index on user_id
        self.collection.create_index("user_id", unique=True)
    
    def create_or_update_user(self, user_id, email=None, name=None):
        """Create or update user profile"""
        user_data = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "last_active": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": user_data,
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return result.upserted_id or result.matched_count > 0
    
    def get_user(self, user_id):
        """Get user by ID"""
        user = self.collection.find_one({"user_id": user_id})
        if user:
            user["_id"] = str(user["_id"])
        return user
    
    def update_last_active(self, user_id):
        """Update user's last active timestamp"""
        self.collection.update_one(
            {"user_id": user_id},
            {"$set": {"last_active": datetime.utcnow()}}
        )

# Initialize database handlers
prediction_db = PredictionDB()
user_db = UserDB()