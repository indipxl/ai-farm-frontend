from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from dateutil import parser

router = APIRouter(prefix="/batches", tags=["batches"])

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

db = firestore.client()

@router.post("/register-batch", response_model=BatchResponse)
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
        batch_display_id = doc_ref[1].id[:10].upper()
        db.collection('batches').document(doc_ref[1].id).update({
            'batch_id': batch_display_id
        })
        return BatchResponse(id=batch_display_id, crop=batch.crop, location=batch.location, planted=planted_str, notes=batch.notes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=dict)
async def get_batches():
    try:
        docs = db.collection('batches').stream()
        batches = []
        for doc in docs:
            data = doc.to_dict()
            batch_id = data.get('batch_id', doc.id[:10].upper())
            planted_str = parser.parse(data.get('planted', '')).strftime("%d %b %Y") if data.get('planted') else 'Unknown'
            batches.append({
                'id': batch_id,
                'doc_id': doc.id,
                'crop': data.get('crop', ''),
                'location': data.get('location', ''),
                'planted': planted_str,
                'notes': data.get('notes', '')
            })
        return {'batches': batches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

