"""
Firebase Connection Test Script
Run this to verify your Firebase setup is working correctly
"""

import sys
from firebase_db import firebase_db, firebase_user_db, firebase_prediction_db
from datetime import datetime

def test_connection():
    """Test Firebase connection"""
    print("=" * 60)
    print("🔥 Firebase Connection Test")
    print("=" * 60)
    
    if firebase_db.is_connected():
        print("✅ Firebase connected successfully!")
        return True
    else:
        print("❌ Firebase connection failed!")
        print("\nPossible issues:")
        print("  1. Check if firebase-service-account.json exists")
        print("  2. Verify FIREBASE_SERVICE_ACCOUNT_PATH in .env")
        print("  3. Ensure Firebase Admin SDK is installed")
        return False

def test_user_operations():
    """Test user CRUD operations"""
    print("\n" + "=" * 60)
    print("👤 Testing User Operations")
    print("=" * 60)
    
    test_user_id = f"test_user_{int(datetime.now().timestamp())}"
    test_email = f"test_{int(datetime.now().timestamp())}@example.com"
    
    try:
        # Create user
        print("\n1️⃣ Creating test user...")
        success = firebase_user_db.create_user(
            user_id=test_user_id,
            email=test_email,
            name="Test User",
            email_verified=True
        )
        
        if success:
            print(f"✅ User created: {test_user_id}")
        else:
            print("❌ Failed to create user")
            return False
        
        # Read user
        print("\n2️⃣ Reading user data...")
        user = firebase_user_db.get_user(test_user_id)
        
        if user:
            print(f"✅ User retrieved: {user['email']}")
            print(f"   Name: {user.get('name')}")
            print(f"   Created: {user.get('created_at')}")
        else:
            print("❌ Failed to retrieve user")
            return False
        
        # Update user
        print("\n3️⃣ Updating user preferences...")
        success = firebase_user_db.update_preferences(
            test_user_id,
            {
                "theme": "dark",
                "notifications_enabled": False,
                "sound_enabled": True
            }
        )
        
        if success:
            print("✅ Preferences updated")
        else:
            print("❌ Failed to update preferences")
        
        # Add favorite breed
        print("\n4️⃣ Adding favorite breed...")
        success = firebase_user_db.add_favorite_breed(test_user_id, "Golden Retriever")
        
        if success:
            print("✅ Favorite breed added")
        else:
            print("❌ Failed to add favorite")
        
        # Increment prediction count
        print("\n5️⃣ Incrementing prediction count...")
        success = firebase_user_db.increment_prediction_count(test_user_id)
        
        if success:
            print("✅ Prediction count incremented")
        else:
            print("❌ Failed to increment count")
        
        # Delete user (cleanup)
        print("\n6️⃣ Cleaning up test user...")
        success = firebase_user_db.delete_user(test_user_id)
        
        if success:
            print("✅ Test user deleted")
        else:
            print("❌ Failed to delete user")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during user operations: {e}")
        return False

def test_prediction_operations():
    """Test prediction CRUD operations"""
    print("\n" + "=" * 60)
    print("🎯 Testing Prediction Operations")
    print("=" * 60)
    
    test_user_id = f"test_user_{int(datetime.now().timestamp())}"
    
    try:
        # Create user first
        firebase_user_db.create_user(
            user_id=test_user_id,
            email=f"test_{int(datetime.now().timestamp())}@example.com",
            name="Test User"
        )
        
        # Save prediction
        print("\n1️⃣ Saving test prediction...")
        prediction_id = firebase_prediction_db.save_prediction(
            user_id=test_user_id,
            breed="Labrador Retriever",
            confidence=0.95,
            image_name="test_dog.jpg",
            top_predictions=[
                {"breed": "Labrador Retriever", "confidence": 0.95},
                {"breed": "Golden Retriever", "confidence": 0.03},
                {"breed": "German Shepherd", "confidence": 0.02}
            ]
        )
        
        if prediction_id:
            print(f"✅ Prediction saved: {prediction_id}")
        else:
            print("❌ Failed to save prediction")
            return False
        
        # Get predictions
        print("\n2️⃣ Retrieving predictions...")
        predictions = firebase_prediction_db.get_user_predictions(test_user_id, limit=10)
        
        if predictions:
            print(f"✅ Found {len(predictions)} prediction(s)")
            for pred in predictions:
                print(f"   - {pred['breed']} ({pred['percentage']}%)")
        else:
            print("❌ No predictions found")
        
        # Get prediction count
        print("\n3️⃣ Getting prediction count...")
        count = firebase_prediction_db.get_prediction_count(test_user_id)
        print(f"✅ Total predictions: {count}")
        
        # Get breed stats
        print("\n4️⃣ Getting breed statistics...")
        stats = firebase_prediction_db.get_breed_stats(test_user_id)
        
        if stats:
            print(f"✅ Breed statistics generated")
            for stat in stats:
                print(f"   - {stat['breed']}: {stat['count']} time(s)")
        else:
            print("⚠️  No statistics available")
        
        # Cleanup
        print("\n5️⃣ Cleaning up test data...")
        firebase_user_db.delete_user(test_user_id)
        print("✅ Test data cleaned up")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during prediction operations: {e}")
        # Cleanup on error
        try:
            firebase_user_db.delete_user(test_user_id)
        except:
            pass
        return False

def test_list_users():
    """List all users in Firebase"""
    print("\n" + "=" * 60)
    print("📋 Listing All Users")
    print("=" * 60)
    
    try:
        users = firebase_user_db.get_all_users(limit=10)
        
        if users:
            print(f"\n✅ Found {len(users)} user(s):")
            for i, user in enumerate(users, 1):
                print(f"\n{i}. User ID: {user['user_id']}")
                print(f"   Email: {user.get('email', 'N/A')}")
                print(f"   Name: {user.get('name', 'N/A')}")
                print(f"   Predictions: {user.get('total_predictions', 0)}")
                print(f"   Last Active: {user.get('last_active', 'N/A')}")
        else:
            print("\n⚠️  No users found in Firebase")
        
        return True
        
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        return False

def main():
    """Run all tests"""
    print("\n")
    print("🧪 Starting Firebase Integration Tests")
    print("=" * 60)
    
    results = {
        "Connection": False,
        "User Operations": False,
        "Prediction Operations": False,
        "List Users": False
    }
    
    # Test connection
    results["Connection"] = test_connection()
    
    if not results["Connection"]:
        print("\n❌ Firebase connection failed. Please fix connection issues first.")
        sys.exit(1)
    
    # Test user operations
    results["User Operations"] = test_user_operations()
    
    # Test prediction operations
    results["Prediction Operations"] = test_prediction_operations()
    
    # List users
    results["List Users"] = test_list_users()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All tests passed! Firebase is ready to use.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)