#!/usr/bin/env python3

import os
from pymongo import MongoClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['upc_legal']
upc_texts_collection = db['upc_texts']

print("Testing UPC texts structure endpoint...")

# Check if we have any texts
count = upc_texts_collection.count_documents({})
print(f"Total UPC texts in database: {count}")

# Check a sample document
sample = upc_texts_collection.find_one()
if sample:
    print(f"Sample document keys: {list(sample.keys())}")
    print(f"Sample document type: {sample.get('document_type')}")
    print(f"Sample language: {sample.get('language')}")

# Test the aggregation pipeline
try:
    pipeline = [
        {"$match": {"language": "EN"}},
        {"$group": {
            "_id": "$document_type",
            "sections": {"$addToSet": "$section"},
            "count": {"$sum": 1}
        }}
    ]
    
    result = list(upc_texts_collection.aggregate(pipeline))
    print(f"Aggregation result: {result}")
    
    structure = {}
    for doc in result:
        structure[doc["_id"]] = {
            "sections": doc["sections"],
            "count": doc["count"]
        }
    
    print(f"Final structure: {structure}")
    
except Exception as e:
    print(f"Aggregation error: {e}")
    import traceback
    traceback.print_exc()