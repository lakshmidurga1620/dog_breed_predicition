from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()

try:
    client = MongoClient(os.getenv("MONGODB_URI"))
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    print(f"Connected to: {os.getenv('MONGODB_DB_NAME')}")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")