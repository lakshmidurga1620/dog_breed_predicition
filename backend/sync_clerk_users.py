"""
Sync Clerk Users to Firebase
This script fetches all users from Clerk and syncs them to Firebase/MongoDB
"""

import os
import requests
from dotenv import load_dotenv
from firebase_db import firebase_user_db, firebase_db
from database import user_db as mongo_user_db
from datetime import datetime
import json

# Load environment variables
load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
USE_FIREBASE = os.getenv("USE_FIREBASE", "true").lower() == "true"

class ClerkUserSync:
    def __init__(self):
        self.secret_key = CLERK_SECRET_KEY
        self.base_url = "https://api.clerk.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    def get_all_users(self, limit=100, offset=0):
        """Fetch all users from Clerk API"""
        all_users = []
        
        try:
            while True:
                print(f"\n📥 Fetching users (offset: {offset})...")
                
                url = f"{self.base_url}/users"
                params = {
                    "limit": limit,
                    "offset": offset
                }
                
                response = requests.get(url, headers=self.headers, params=params)
                
                if response.status_code != 200:
                    print(f"❌ Error: {response.status_code}")
                    print(f"Response: {response.text}")
                    break
                
                data = response.json()
                
                if not data:
                    break
                
                all_users.extend(data)
                print(f"✅ Fetched {len(data)} users")
                
                # If we got fewer users than the limit, we've reached the end
                if len(data) < limit:
                    break
                
                offset += limit
            
            print(f"\n🎉 Total users fetched from Clerk: {len(all_users)}")
            return all_users
            
        except Exception as e:
            print(f"❌ Error fetching users: {e}")
            return []
    
    def get_user_details(self, user_id):
        """Get detailed information for a specific user"""
        try:
            url = f"{self.base_url}/users/{user_id}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Error fetching user {user_id}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def parse_clerk_user(self, clerk_user):
        """Parse Clerk user data into our format"""
        try:
            # Get primary email
            email_addresses = clerk_user.get("email_addresses", [])
            primary_email = None
            email_verified = False
            
            for email in email_addresses:
                if email.get("id") == clerk_user.get("primary_email_address_id"):
                    primary_email = email.get("email_address")
                    email_verified = email.get("verification", {}).get("status") == "verified"
                    break
            
            # Get name
            first_name = clerk_user.get("first_name", "")
            last_name = clerk_user.get("last_name", "")
            name = f"{first_name} {last_name}".strip() or primary_email.split('@')[0] if primary_email else "Unknown"
            
            # Get profile image
            profile_image = clerk_user.get("profile_image_url") or clerk_user.get("image_url")
            
            # Parse timestamps
            created_at = clerk_user.get("created_at")
            updated_at = clerk_user.get("updated_at")
            last_sign_in_at = clerk_user.get("last_sign_in_at")
            
            return {
                "user_id": clerk_user.get("id"),
                "email": primary_email,
                "name": name,
                "first_name": first_name,
                "last_name": last_name,
                "email_verified": email_verified,
                "profile_image": profile_image,
                "phone_number": clerk_user.get("phone_numbers", [{}])[0].get("phone_number") if clerk_user.get("phone_numbers") else None,
                "created_at": created_at,
                "updated_at": updated_at,
                "last_sign_in_at": last_sign_in_at,
                "username": clerk_user.get("username"),
                "clerk_data": clerk_user  # Store full Clerk data for reference
            }
            
        except Exception as e:
            print(f"❌ Error parsing user: {e}")
            return None
    
    def sync_to_firebase(self, users):
        """Sync users to Firebase"""
        if not firebase_db.is_connected():
            print("❌ Firebase is not connected!")
            return 0
        
        print("\n🔥 Syncing users to Firebase...")
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for user_data in users:
            try:
                user_id = user_data["user_id"]
                
                # Check if user already exists
                existing_user = firebase_user_db.get_user(user_id)
                
                if existing_user:
                    print(f"⏭️  User {user_data['email']} already exists - skipping")
                    skipped_count += 1
                    continue
                
                # Create user in Firebase
                success = firebase_user_db.create_user(
                    user_id=user_id,
                    email=user_data["email"],
                    name=user_data["name"],
                    email_verified=user_data.get("email_verified", False),
                    avatar_url=user_data.get("profile_image"),
                    bio=f"Joined from Clerk on {datetime.now().strftime('%Y-%m-%d')}"
                )
                
                if success:
                    print(f"✅ Synced: {user_data['email']}")
                    success_count += 1
                else:
                    print(f"❌ Failed: {user_data['email']}")
                    error_count += 1
                    
            except Exception as e:
                print(f"❌ Error syncing user: {e}")
                error_count += 1
        
        print(f"\n📊 Firebase Sync Summary:")
        print(f"  ✅ Success: {success_count}")
        print(f"  ❌ Failed: {error_count}")
        print(f"  ⏭️  Skipped: {skipped_count}")
        
        return success_count
    
    def sync_to_mongodb(self, users):
        """Sync users to MongoDB"""
        print("\n🍃 Syncing users to MongoDB...")
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for user_data in users:
            try:
                user_id = user_data["user_id"]
                
                # Check if user already exists
                existing_user = mongo_user_db.get_user(user_id)
                
                if existing_user:
                    print(f"⏭️  User {user_data['email']} already exists - skipping")
                    skipped_count += 1
                    continue
                
                # Create user in MongoDB
                mongo_user_db.create_or_update_user(
                    user_id=user_id,
                    email=user_data["email"],
                    name=user_data["name"]
                )
                
                print(f"✅ Synced: {user_data['email']}")
                success_count += 1
                    
            except Exception as e:
                print(f"❌ Error syncing user: {e}")
                error_count += 1
        
        print(f"\n📊 MongoDB Sync Summary:")
        print(f"  ✅ Success: {success_count}")
        print(f"  ❌ Failed: {error_count}")
        print(f"  ⏭️  Skipped: {skipped_count}")
        
        return success_count
    
    def export_to_json(self, users, filename="clerk_users.json"):
        """Export users to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Users exported to {filename}")
            return True
            
        except Exception as e:
            print(f"❌ Error exporting to JSON: {e}")
            return False
    
    def print_user_summary(self, users):
        """Print a summary of fetched users"""
        print("\n" + "=" * 70)
        print("👥 USER SUMMARY")
        print("=" * 70)
        
        for i, user in enumerate(users, 1):
            print(f"\n{i}. {user['name']}")
            print(f"   📧 Email: {user['email']}")
            print(f"   🆔 User ID: {user['user_id']}")
            print(f"   ✓ Verified: {'Yes' if user.get('email_verified') else 'No'}")
            if user.get('phone_number'):
                print(f"   📱 Phone: {user['phone_number']}")
            if user.get('created_at'):
                created = datetime.fromtimestamp(user['created_at'] / 1000)
                print(f"   📅 Joined: {created.strftime('%Y-%m-%d %H:%M')}")
            if user.get('last_sign_in_at'):
                last_signin = datetime.fromtimestamp(user['last_sign_in_at'] / 1000)
                print(f"   🔐 Last Sign In: {last_signin.strftime('%Y-%m-%d %H:%M')}")
        
        print("\n" + "=" * 70)


def main():
    """Main function"""
    print("=" * 70)
    print("🔄 CLERK USER SYNC TOOL")
    print("=" * 70)
    
    if not CLERK_SECRET_KEY:
        print("\n❌ Error: CLERK_SECRET_KEY not found in .env file")
        return 1
    
    sync = ClerkUserSync()
    
    # Fetch all users from Clerk
    print("\n📥 Fetching users from Clerk...")
    clerk_users = sync.get_all_users()
    
    if not clerk_users:
        print("❌ No users found or error occurred")
        return 1
    
    # Parse users
    print(f"\n🔄 Parsing {len(clerk_users)} users...")
    parsed_users = []
    
    for clerk_user in clerk_users:
        parsed = sync.parse_clerk_user(clerk_user)
        if parsed:
            parsed_users.append(parsed)
    
    print(f"✅ Successfully parsed {len(parsed_users)} users")
    
    # Print summary
    sync.print_user_summary(parsed_users)
    
    # Ask what to do
    print("\n" + "=" * 70)
    print("What would you like to do?")
    print("=" * 70)
    print("1. Sync to Firebase")
    print("2. Sync to MongoDB")
    print("3. Sync to both Firebase and MongoDB")
    print("4. Export to JSON file")
    print("5. Do nothing (just view)")
    print("6. Exit")
    
    try:
        choice = input("\nEnter your choice (1-6): ").strip()
        
        if choice == "1":
            sync.sync_to_firebase(parsed_users)
        
        elif choice == "2":
            sync.sync_to_mongodb(parsed_users)
        
        elif choice == "3":
            sync.sync_to_firebase(parsed_users)
            sync.sync_to_mongodb(parsed_users)
        
        elif choice == "4":
            filename = input("Enter filename (default: clerk_users.json): ").strip()
            if not filename:
                filename = "clerk_users.json"
            sync.export_to_json(parsed_users, filename)
        
        elif choice == "5":
            print("\n👍 No changes made")
        
        elif choice == "6":
            print("\n👋 Goodbye!")
            return 0
        
        else:
            print("\n❌ Invalid choice")
            return 1
        
        print("\n✅ Operation completed successfully!")
        return 0
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())