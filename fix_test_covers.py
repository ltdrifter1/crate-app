"""
fix_test_covers.py
Finds all Firestore tracks using test.png and replaces with default.avif
Run: python fix_test_covers.py
"""

import firebase_admin
from firebase_admin import credentials, firestore

BUCKET_NAME = "crate-app-58494.firebasestorage.app"
DEFAULT_URL  = f"https://storage.googleapis.com/{BUCKET_NAME}/covers/default.avif"

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Scanning Firestore tracks...")
updated = 0

for doc in db.collection("tracks").stream():
    data = doc.to_dict()
    cover = data.get("albumCover") or ""
    if "test.png" in cover:
        doc.reference.update({"albumCover": DEFAULT_URL})
        print(f"  ✓ {data.get('title','?')[:50]}")
        updated += 1

print(f"\n✅ Updated {updated} tracks")
