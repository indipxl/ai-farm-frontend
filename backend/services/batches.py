from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from firebase_admin import firestore
from dateutil import parser

router = APIRouter(prefix="/batches", tags=["batches"])

class BatchCreate(BaseModel):
    crop: str
    location: str
    notes: Optional[str] = None

class BatchUpdate(BaseModel):
    crop: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class BatchResponse(BaseModel):
    id: str
    crop: str
    location: str
    notes: Optional[str] = None
    sensor_data_id: Optional[str] = None
    sensor_data: Optional[Dict[str, Any]] = None

db = firestore.client()

@router.post("/register-batch", response_model=BatchResponse)
async def register_batch(batch: BatchCreate):
    try:
        # Prevent planting in an occupied location
        existing_batches = db.collection('batches').where('location', '==', batch.location).limit(1).stream()
        for _ in existing_batches:
            raise HTTPException(status_code=400, detail=f"Location '{batch.location}' is already occupied.")

        doc_ref = db.collection('batches').add({
            'crop': batch.crop,
            'location': batch.location,
            'notes': batch.notes,
            'created_at': firestore.SERVER_TIMESTAMP
        })
        batch_display_id = doc_ref[1].id[:10].upper()
        db.collection('batches').document(doc_ref[1].id).update({
            'batch_id': batch_display_id
        })
        return BatchResponse(id=batch_display_id, crop=batch.crop, location=batch.location, notes=batch.notes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Automatically generate mappings for BLOCK A1 to D6
LOCATION_SENSOR_MAP = {
    f"BLOCK {block}{num}": f"sensor_{block.lower()}{num}_data"
    for block in ["A", "B", "C", "D"]
    for num in range(1, 7)
}

@router.get("/", response_model=dict)
async def get_batches():
    try:
        docs = db.collection('batches').stream()
        batches = []
        for doc in docs:
            data = doc.to_dict()
            batch_id = data.get('batch_id', doc.id[:10].upper())
            location = data.get('location', '')
            
            # Fetch the single latest sensor data based on location hardware mapping
            location_key = location.strip().upper()
            sensor_collection = 'sensor_data'
            if location_key.startswith('BLOCK '):
                block_id = location_key.replace('BLOCK ', '').strip().lower()
                sensor_collection = f"sensor_{block_id}_data"
            latest_sensor_data = None
            latest_sid = None
            sensor_docs = db.collection(sensor_collection).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
            for sdoc in sensor_docs:
                latest_sensor_data = sdoc.to_dict()
                latest_sid = sdoc.id
        
            # Fetch the latest AI report for this specific batch
            latest_ai_report = None
            latest_soil_classification = None

            report_docs = db.collection('ai_reports') \
                            .where('sensor_snapshot.batch_id', '==', doc.id) \
                            .stream()
            
            # Safely sort in Python to avoid Firestore composite index errors
            latest_report_data = None
            latest_ts = None
            for rdoc in report_docs:
                rdata = rdoc.to_dict()
                ts = rdata.get('timestamp')
                if ts and (not latest_ts or ts > latest_ts):
                    latest_ts = ts
                    latest_report_data = rdata

            if latest_report_data:
                latest_ai_report = latest_report_data.get('ai_recommendation') or latest_report_data.get('analysis')
                latest_soil_classification = latest_report_data.get('soil_classification')

            mapped_status = 'healthy'
            if latest_soil_classification:
                cls_lower = latest_soil_classification.lower()
                if 'critical' in cls_lower:
                    mapped_status = 'danger'
                elif 'warning' in cls_lower:
                    mapped_status = 'warning'
                else:
                    mapped_status = 'healthy'

            # Fetch latest image analysis by batch_id
            image_analysis = None
            cam_docs = db.collection('image_analysis').where('batch_id', '==', batch_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
            for cam_doc in cam_docs:
                image_analysis = cam_doc.to_dict()
                if image_analysis.get('timestamp'):
                    image_analysis['timestamp'] = image_analysis['timestamp'].isoformat()

            batches.append({
                'id': batch_id,
                'doc_id': doc.id,
                'crop': data.get('crop', ''),
                'location': location,
                'notes': data.get('notes', ''),
                'status': mapped_status,
                'sensor_data_id': latest_sid,
                'sensor_data': latest_sensor_data,
                'ai_report': {'analysis': latest_ai_report} if latest_ai_report else None,
                'image_analysis': image_analysis,
                'created_at': data.get('created_at', '').isoformat() if data.get('created_at') else ''
            })
        return {'batches': batches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{doc_id}")
async def update_batch_route(doc_id: str, batch: BatchUpdate):
    try:
        update_data = {}
        if batch.crop is not None: update_data['crop'] = batch.crop
        if batch.location is not None: 
            # Check if attempting to move to an occupied location
            existing_batches = db.collection('batches').where('location', '==', batch.location).limit(1).stream()
            for existing in existing_batches:
                if existing.id != doc_id:
                    raise HTTPException(status_code=400, detail=f"Location '{batch.location}' is already occupied.")
            update_data['location'] = batch.location
        if batch.notes is not None: update_data['notes'] = batch.notes
        
        if update_data:
            db.collection('batches').document(doc_id).update(update_data)
        
        return {"status": "success", "message": "Batch updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{doc_id}")
async def delete_batch_route(doc_id: str):
    try:
        db.collection('batches').document(doc_id).delete()
        return {"status": "success", "message": "Batch deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

