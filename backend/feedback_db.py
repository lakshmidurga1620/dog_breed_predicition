# feedback_db.py
# Create this file in your backend folder

from datetime import datetime
from typing import List, Optional, Dict
import firebase_admin
from firebase_admin import firestore
from database import mongodb
from bson import ObjectId
import os

# ============================================
# FIREBASE FEEDBACK DATABASE
# ============================================

class FirebaseFeedbackDB:
    """Firebase Firestore implementation for feedback storage"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.collection('feedback')
    
    def submit_feedback(
        self,
        user_id: str,
        feedback_type: str,
        message: str,
        rating: Optional[int] = None,
        prediction_id: Optional[str] = None,
        breed_predicted: Optional[str] = None,
        actual_breed: Optional[str] = None,
        is_private: bool = False,
        metadata: Optional[Dict] = None
    ) -> str:
        """Submit new feedback"""
        try:
            feedback_data = {
                'user_id': user_id,
                'type': feedback_type,
                'message': message,
                'rating': rating,
                'prediction_id': prediction_id,
                'breed_predicted': breed_predicted,
                'actual_breed': actual_breed,
                'is_private': is_private,
                'status': 'pending',
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'metadata': metadata or {},
                'admin_response': None,
                'admin_responded_at': None,
                'helpful_count': 0
            }
            
            doc_ref = self.collection.document()
            doc_ref.set(feedback_data)
            
            print(f"✅ Feedback submitted: {doc_ref.id} (Private: {is_private})")
            return doc_ref.id
            
        except Exception as e:
            print(f"❌ Error submitting feedback: {e}")
            return None
    
    def get_user_feedback(
        self,
        user_id: str,
        limit: int = 50,
        feedback_type: Optional[str] = None
    ) -> List[Dict]:
        """Get all feedback from a specific user"""
        try:
            query = self.collection.where('user_id', '==', user_id)
            
            if feedback_type:
                query = query.where('type', '==', feedback_type)
            
            query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
            query = query.limit(limit)
            
            docs = query.stream()
            
            feedback_list = []
            for doc in docs:
                feedback_data = doc.to_dict()
                feedback_data['id'] = doc.id
                
                # Convert timestamps
                if feedback_data.get('created_at'):
                    feedback_data['created_at'] = feedback_data['created_at'].isoformat()
                if feedback_data.get('updated_at'):
                    feedback_data['updated_at'] = feedback_data['updated_at'].isoformat()
                if feedback_data.get('admin_responded_at'):
                    feedback_data['admin_responded_at'] = feedback_data['admin_responded_at'].isoformat()
                
                feedback_list.append(feedback_data)
            
            return feedback_list
            
        except Exception as e:
            print(f"❌ Error fetching user feedback: {e}")
            return []
    
    def get_all_feedback(
        self,
        limit: int = 100,
        status: Optional[str] = None,
        feedback_type: Optional[str] = None
    ) -> List[Dict]:
        """Get all feedback (for admin)"""
        try:
            query = self.collection
            
            if status:
                query = query.where('status', '==', status)
            
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
                if feedback_data.get('admin_responded_at'):
                    feedback_data['admin_responded_at'] = feedback_data['admin_responded_at'].isoformat()
                
                feedback_list.append(feedback_data)
            
            return feedback_list
            
        except Exception as e:
            print(f"❌ Error fetching all feedback: {e}")
            return []
    
    def update_feedback_status(
        self,
        feedback_id: str,
        status: str,
        admin_response: Optional[str] = None
    ) -> bool:
        """Update feedback status (for admin)"""
        try:
            doc_ref = self.collection.document(feedback_id)
            
            update_data = {
                'status': status,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            if admin_response:
                update_data['admin_response'] = admin_response
                update_data['admin_responded_at'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.update(update_data)
            
            print(f"✅ Feedback status updated: {feedback_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error updating feedback status: {e}")
            return False
    
    def get_feedback_stats(self) -> Dict:
        """Get feedback statistics"""
        try:
            all_feedback = self.collection.stream()
            
            stats = {
                'total': 0,
                'by_type': {
                    'prediction_correct': 0,
                    'prediction_wrong': 0,
                    'feature': 0,
                    'bug': 0,
                    'general': 0
                },
                'by_status': {'pending': 0, 'reviewed': 0, 'resolved': 0},
                'average_rating': 0,
                'total_ratings': 0,
                'prediction_accuracy': 0,
                'public_feedback': 0,
                'private_feedback': 0
            }
            
            rating_sum = 0
            rating_count = 0
            correct_predictions = 0
            wrong_predictions = 0
            
            for doc in all_feedback:
                data = doc.to_dict()
                stats['total'] += 1
                
                # Count privacy
                if data.get('is_private', False):
                    stats['private_feedback'] += 1
                else:
                    stats['public_feedback'] += 1
                
                feedback_type = data.get('type', 'general')
                if feedback_type in stats['by_type']:
                    stats['by_type'][feedback_type] += 1
                
                if feedback_type == 'prediction_correct':
                    correct_predictions += 1
                elif feedback_type == 'prediction_wrong':
                    wrong_predictions += 1
                
                status = data.get('status', 'pending')
                if status in stats['by_status']:
                    stats['by_status'][status] += 1
                
                if data.get('rating'):
                    rating_sum += data['rating']
                    rating_count += 1
            
            if rating_count > 0:
                stats['average_rating'] = round(rating_sum / rating_count, 2)
                stats['total_ratings'] = rating_count
            
            total_prediction_feedback = correct_predictions + wrong_predictions
            if total_prediction_feedback > 0:
                stats['prediction_accuracy'] = round(
                    (correct_predictions / total_prediction_feedback) * 100, 2
                )
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting feedback stats: {e}")
            return {}


# ============================================
# MONGODB FEEDBACK DATABASE  
# ============================================

class MongoFeedbackDB:
    """MongoDB implementation for feedback storage"""
    
    def __init__(self, db):
        self.collection = db['feedback']
    
    def submit_feedback(
        self,
        user_id: str,
        feedback_type: str,
        message: str,
        rating: Optional[int] = None,
        prediction_id: Optional[str] = None,
        breed_predicted: Optional[str] = None,
        actual_breed: Optional[str] = None,
        is_private: bool = False,
        metadata: Optional[Dict] = None
    ) -> str:
        """Submit new feedback"""
        try:
            feedback_doc = {
                'user_id': user_id,
                'type': feedback_type,
                'message': message,
                'rating': rating,
                'prediction_id': prediction_id,
                'breed_predicted': breed_predicted,
                'actual_breed': actual_breed,
                'is_private': is_private,
                'status': 'pending',
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'metadata': metadata or {},
                'admin_response': None,
                'admin_responded_at': None,
                'helpful_count': 0
            }
            
            result = self.collection.insert_one(feedback_doc)
            print(f"✅ Feedback submitted: {result.inserted_id} (Private: {is_private})")
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"❌ Error submitting feedback: {e}")
            return None
    
    def get_user_feedback(
        self,
        user_id: str,
        limit: int = 50,
        feedback_type: Optional[str] = None
    ) -> List[Dict]:
        """Get all feedback from a specific user"""
        try:
            query = {'user_id': user_id}
            if feedback_type:
                query['type'] = feedback_type
            
            cursor = self.collection.find(query).sort('created_at', -1).limit(limit)
            
            feedback_list = []
            for doc in cursor:
                doc['id'] = str(doc['_id'])
                del doc['_id']
                
                if doc.get('created_at'):
                    doc['created_at'] = doc['created_at'].isoformat()
                if doc.get('updated_at'):
                    doc['updated_at'] = doc['updated_at'].isoformat()
                if doc.get('admin_responded_at'):
                    doc['admin_responded_at'] = doc['admin_responded_at'].isoformat()
                
                feedback_list.append(doc)
            
            return feedback_list
            
        except Exception as e:
            print(f"❌ Error fetching user feedback: {e}")
            return []
    
    def get_all_feedback(
        self,
        limit: int = 100,
        status: Optional[str] = None,
        feedback_type: Optional[str] = None
    ) -> List[Dict]:
        """Get all feedback (for admin)"""
        try:
            query = {}
            if status:
                query['status'] = status
            if feedback_type:
                query['type'] = feedback_type
            
            cursor = self.collection.find(query).sort('created_at', -1).limit(limit)
            
            feedback_list = []
            for doc in cursor:
                doc['id'] = str(doc['_id'])
                del doc['_id']
                
                if doc.get('created_at'):
                    doc['created_at'] = doc['created_at'].isoformat()
                if doc.get('updated_at'):
                    doc['updated_at'] = doc['updated_at'].isoformat()
                if doc.get('admin_responded_at'):
                    doc['admin_responded_at'] = doc['admin_responded_at'].isoformat()
                
                feedback_list.append(doc)
            
            return feedback_list
            
        except Exception as e:
            print(f"❌ Error fetching all feedback: {e}")
            return []
    
    def update_feedback_status(
        self,
        feedback_id: str,
        status: str,
        admin_response: Optional[str] = None
    ) -> bool:
        """Update feedback status"""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.now()
            }
            
            if admin_response:
                update_data['admin_response'] = admin_response
                update_data['admin_responded_at'] = datetime.now()
            
            result = self.collection.update_one(
                {'_id': ObjectId(feedback_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"❌ Error updating feedback status: {e}")
            return False
    
    def get_feedback_stats(self) -> Dict:
        """Get feedback statistics"""
        try:
            all_docs = list(self.collection.find())
            
            stats = {
                'total': len(all_docs),
                'by_type': {},
                'by_status': {},
                'average_rating': 0,
                'prediction_accuracy': 0,
                'public_feedback': 0,
                'private_feedback': 0
            }
            
            rating_sum = 0
            rating_count = 0
            correct = 0
            wrong = 0
            
            for doc in all_docs:
                # Count privacy
                if doc.get('is_private', False):
                    stats['private_feedback'] += 1
                else:
                    stats['public_feedback'] += 1
                
                t = doc.get('type', 'general')
                stats['by_type'][t] = stats['by_type'].get(t, 0) + 1
                
                if t == 'prediction_correct':
                    correct += 1
                elif t == 'prediction_wrong':
                    wrong += 1
                
                s = doc.get('status', 'pending')
                stats['by_status'][s] = stats['by_status'].get(s, 0) + 1
                
                if doc.get('rating'):
                    rating_sum += doc['rating']
                    rating_count += 1
            
            if rating_count > 0:
                stats['average_rating'] = round(rating_sum / rating_count, 2)
            
            total_pred = correct + wrong
            if total_pred > 0:
                stats['prediction_accuracy'] = round((correct / total_pred) * 100, 2)
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting stats: {e}")
            return {}


# ============================================
# Initialize Feedback Database
# ============================================

from firebase_db import firebase_db
from database import mongodb

USE_FIREBASE = os.getenv("USE_FIREBASE", "true").lower() == "true"

if USE_FIREBASE:
    feedback_db = FirebaseFeedbackDB(firebase_db._db)
    print("✓ Firebase Feedback DB initialized")
else:
    feedback_db = MongoFeedbackDB(mongodb._db)
    print("✓ MongoDB Feedback DB initialized")