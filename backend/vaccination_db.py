"""
Vaccination Database Module
Handles user-specific vaccination records with support for both MongoDB and Firebase
"""

from datetime import datetime
from typing import Optional, List, Dict
import os

# Database imports
from database import mongodb
from firebase_db import firebase_db

USE_FIREBASE = os.getenv("USE_FIREBASE", "true").lower() == "true"


class VaccinationDB:
    """Manages vaccination records for users"""
    
    def __init__(self):
        self.use_firebase = USE_FIREBASE
        if self.use_firebase:
            self.db = firebase_db._db
        else:
            self.db = mongodb._db
    
    def create_vaccination(
        self,
        user_id: str,
        name: str,
        due_date: str,
        status: str = "pending",
        last_date: Optional[str] = None,
        notes: str = "",
        required: bool = False,
        pet_name: Optional[str] = None
    ) -> str:
        """Create a new vaccination record"""
        try:
            vaccination_data = {
                "user_id": user_id,
                "name": name,
                "due_date": due_date,
                "status": status,
                "last_date": last_date,
                "notes": notes,
                "required": required,
                "pet_name": pet_name,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            if self.use_firebase:
                from google.cloud import firestore
                
                vaccination_data["created_at"] = firestore.SERVER_TIMESTAMP
                vaccination_data["updated_at"] = firestore.SERVER_TIMESTAMP
                
                doc_ref = self.db.collection('vaccinations').document()
                doc_ref.set(vaccination_data)
                
                print(f"✅ Vaccination created in Firebase: {doc_ref.id}")
                return doc_ref.id
            else:
                result = self.db['vaccinations'].insert_one(vaccination_data)
                vaccination_id = str(result.inserted_id)
                
                print(f"✅ Vaccination created in MongoDB: {vaccination_id}")
                return vaccination_id
                
        except Exception as e:
            print(f"❌ Error creating vaccination: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_user_vaccinations(
        self,
        user_id: str,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Dict]:
        """Get all vaccinations for a user"""
        try:
            if self.use_firebase:
                query = self.db.collection('vaccinations').where('user_id', '==', user_id)
                
                if status:
                    query = query.where('status', '==', status)
                
                query = query.order_by('due_date').limit(limit)
                
                docs = query.stream()
                
                vaccinations = []
                for doc in docs:
                    vacc_data = doc.to_dict()
                    vacc_data['id'] = doc.id
                    
                    # Convert timestamps
                    if vacc_data.get('created_at'):
                        vacc_data['created_at'] = vacc_data['created_at'].isoformat()
                    if vacc_data.get('updated_at'):
                        vacc_data['updated_at'] = vacc_data['updated_at'].isoformat()
                    
                    vaccinations.append(vacc_data)
                
                return vaccinations
            else:
                from bson import ObjectId
                
                query = {'user_id': user_id}
                if status:
                    query['status'] = status
                
                cursor = self.db['vaccinations'].find(query).sort('due_date', 1).limit(limit)
                
                vaccinations = []
                for doc in cursor:
                    doc['id'] = str(doc['_id'])
                    del doc['_id']
                    
                    if doc.get('created_at'):
                        doc['created_at'] = doc['created_at'].isoformat()
                    if doc.get('updated_at'):
                        doc['updated_at'] = doc['updated_at'].isoformat()
                    
                    vaccinations.append(doc)
                
                return vaccinations
                
        except Exception as e:
            print(f"❌ Error fetching vaccinations: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_vaccination_by_id(self, vaccination_id: str, user_id: str) -> Optional[Dict]:
        """Get a specific vaccination by ID (with user ownership check)"""
        try:
            if self.use_firebase:
                doc_ref = self.db.collection('vaccinations').document(vaccination_id)
                doc = doc_ref.get()
                
                if not doc.exists:
                    return None
                
                vacc_data = doc.to_dict()
                
                # Check ownership
                if vacc_data.get('user_id') != user_id:
                    return None
                
                vacc_data['id'] = doc.id
                
                if vacc_data.get('created_at'):
                    vacc_data['created_at'] = vacc_data['created_at'].isoformat()
                if vacc_data.get('updated_at'):
                    vacc_data['updated_at'] = vacc_data['updated_at'].isoformat()
                
                return vacc_data
            else:
                from bson import ObjectId
                
                vacc = self.db['vaccinations'].find_one({
                    '_id': ObjectId(vaccination_id),
                    'user_id': user_id
                })
                
                if not vacc:
                    return None
                
                vacc['id'] = str(vacc['_id'])
                del vacc['_id']
                
                if vacc.get('created_at'):
                    vacc['created_at'] = vacc['created_at'].isoformat()
                if vacc.get('updated_at'):
                    vacc['updated_at'] = vacc['updated_at'].isoformat()
                
                return vacc
                
        except Exception as e:
            print(f"❌ Error fetching vaccination: {e}")
            return None
    
    def update_vaccination(
        self,
        vaccination_id: str,
        user_id: str,
        update_data: Dict
    ) -> bool:
        """Update a vaccination record"""
        try:
            # Add updated_at timestamp
            update_data['updated_at'] = datetime.now()
            
            if self.use_firebase:
                from google.cloud import firestore
                
                doc_ref = self.db.collection('vaccinations').document(vaccination_id)
                doc = doc_ref.get()
                
                if not doc.exists:
                    print(f"⚠️  Vaccination not found: {vaccination_id}")
                    return False
                
                # Check ownership
                if doc.to_dict().get('user_id') != user_id:
                    print(f"⚠️  User {user_id} doesn't own vaccination {vaccination_id}")
                    return False
                
                update_data['updated_at'] = firestore.SERVER_TIMESTAMP
                doc_ref.update(update_data)
                
                print(f"✅ Vaccination updated in Firebase: {vaccination_id}")
                return True
            else:
                from bson import ObjectId
                
                result = self.db['vaccinations'].update_one(
                    {
                        '_id': ObjectId(vaccination_id),
                        'user_id': user_id
                    },
                    {'$set': update_data}
                )
                
                if result.matched_count == 0:
                    print(f"⚠️  Vaccination not found or user doesn't own it")
                    return False
                
                print(f"✅ Vaccination updated in MongoDB: {vaccination_id}")
                return True
                
        except Exception as e:
            print(f"❌ Error updating vaccination: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def delete_vaccination(self, vaccination_id: str, user_id: str) -> bool:
        """Delete a vaccination record"""
        try:
            if self.use_firebase:
                doc_ref = self.db.collection('vaccinations').document(vaccination_id)
                doc = doc_ref.get()
                
                if not doc.exists:
                    return False
                
                # Check ownership
                if doc.to_dict().get('user_id') != user_id:
                    return False
                
                doc_ref.delete()
                print(f"✅ Vaccination deleted from Firebase: {vaccination_id}")
                return True
            else:
                from bson import ObjectId
                
                result = self.db['vaccinations'].delete_one({
                    '_id': ObjectId(vaccination_id),
                    'user_id': user_id
                })
                
                if result.deleted_count == 0:
                    return False
                
                print(f"✅ Vaccination deleted from MongoDB: {vaccination_id}")
                return True
                
        except Exception as e:
            print(f"❌ Error deleting vaccination: {e}")
            return False
    
    def get_vaccination_stats(self, user_id: str) -> Dict:
        """Get vaccination statistics for a user"""
        try:
            vaccinations = self.get_user_vaccinations(user_id, limit=1000)
            
            total = len(vaccinations)
            completed = sum(1 for v in vaccinations if v.get('status') == 'completed')
            overdue = sum(1 for v in vaccinations if v.get('status') == 'overdue')
            upcoming = sum(1 for v in vaccinations if v.get('status') == 'upcoming')
            pending = sum(1 for v in vaccinations if v.get('status') == 'pending')
            required = sum(1 for v in vaccinations if v.get('required', False))
            
            return {
                "total": total,
                "completed": completed,
                "overdue": overdue,
                "upcoming": upcoming,
                "pending": pending,
                "required": required,
                "optional": total - required,
                "completion_rate": round((completed / total * 100), 2) if total > 0 else 0
            }
            
        except Exception as e:
            print(f"❌ Error calculating stats: {e}")
            return {
                "total": 0,
                "completed": 0,
                "overdue": 0,
                "upcoming": 0,
                "pending": 0,
                "required": 0,
                "optional": 0,
                "completion_rate": 0
            }
    
    def get_upcoming_vaccinations(self, user_id: str, days: int = 30) -> List[Dict]:
        """Get vaccinations due within the next X days"""
        try:
            from datetime import timedelta
            
            today = datetime.now().date()
            future_date = today + timedelta(days=days)
            
            vaccinations = self.get_user_vaccinations(user_id, limit=1000)
            
            upcoming = []
            for vacc in vaccinations:
                if vacc.get('due_date'):
                    try:
                        due_date = datetime.strptime(vacc['due_date'], '%Y-%m-%d').date()
                        if today <= due_date <= future_date:
                            # Calculate days until due
                            days_until = (due_date - today).days
                            vacc['days_until_due'] = days_until
                            upcoming.append(vacc)
                    except ValueError:
                        continue
            
            # Sort by due date
            upcoming.sort(key=lambda x: x.get('due_date', ''))
            
            return upcoming
            
        except Exception as e:
            print(f"❌ Error fetching upcoming vaccinations: {e}")
            return []


# Global instance
vaccination_db = VaccinationDB()