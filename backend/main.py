from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from dateutil import parser
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import uvicorn

app = FastAPI(title="Ai Farm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://gaia-sabah-c3-group2-aifarm.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BatchCreate(BaseModel):
    crop: str
    location: str
    planted: str
    notes: Optional[str] = None

class BatchResponse(BaseModel):
    id: str
    crop: str
    location: str
    planted: str
    notes: Optional[str] = None

load_dotenv()
project_id = os.getenv("FIREBASE_PROJECT_ID")
service_account_path = "gaia-sabah-c3-group2-aifarm-02d42c9eeb6a.json"

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.post("/api/register-batch", response_model=BatchResponse)
async def register_batch(batch: BatchCreate):
    try:
        planted_date = parser.parse(batch.planted).date()
        planted_str = planted_date.strftime("%d %b %Y")
        doc_ref = db.collection('batches').add({
            'crop': batch.crop,
            'location': batch.location,
            'planted': planted_date.isoformat(),
            'notes': batch.notes,
            'created_at': firestore.SERVER_TIMESTAMP
        })
        doc_id = doc_ref[1].id[:10].upper()
        return BatchResponse(id=doc_id, crop=batch.crop, location=batch.location, planted=planted_str, notes=batch.notes)
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

@app.get("/api/batches")
async def get_batches():
    try:
        docs = db.collection('batches').order_by('created_at').stream()
        batches = []
        for doc in docs:
            data = doc.to_dict()
            doc_id = doc.id[:10].upper()
            planted_date = parser.parse(data.get('planted', '')).strftime("%d %b %Y") if data.get('planted') else 'Unknown'
            batches.append({
                'id': doc_id,
                'crop': data.get('crop', ''),
                'location': data.get('location', ''),
                'planted': planted_date,
                'notes': data.get('notes', '')
            })
        return {'batches': batches}
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

@app.put("/api/batches/{batch_id}", response_model=BatchResponse)
async def update_batch(batch_id: str, batch: BatchCreate):
    try:
        doc_ref = db.collection('batches').document(batch_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(404, "Batch not found")
        planted_date = parser.parse(batch.planted).date()
        planted_str = planted_date.strftime("%d %b %Y")
        doc_ref.update({
            'crop': batch.crop,
            'location': batch.location,
            'planted': planted_date.isoformat(),
            'notes': batch.notes,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        return BatchResponse(id=batch_id[:10].upper(), crop=batch.crop, location=batch.location, planted=planted_str, notes=batch.notes)
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

@app.delete("/api/batches/{batch_id}")
async def delete_batch(batch_id: str):
    try:
        doc_ref = db.collection('batches').document(batch_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(404, "Batch not found")
        doc_ref.delete()
        return {'message': 'Batch deleted'}
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
