from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from firebase_admin import firestore
import dateutil.parser as parser

router = APIRouter(prefix="/crops", tags=["crops"])

class CropCreate(BaseModel):
    name: str
    status: str = "Active"
    alert: Optional[str] = None
    notes: Optional[str] = None
    batch_id: str
    sensor_data_id: str

class CropResponse(BaseModel):
    id: str
    name: str
    status: str
    alert: Optional[str]
    notes: Optional[str]
    batch_id: str
    sensor_data_id: str
    batch: Optional[Dict[str, Any]] = None
    sensor_data: Optional[Dict[str, Any]] = None

db = firestore.client()

@router.post("/create-crops", response_model=CropResponse)
async def create_crop(crop: CropCreate):
    try:
        doc_ref = db.collection('crops').add({
            'name': crop.name,
            'status': crop.status,
            'alert': crop.alert,
            'notes': crop.notes,
            'batch_id': crop.batch_id,
            'sensor_data_id': crop.sensor_data_id,
            'created_at': firestore.SERVER_TIMESTAMP
        })
        return await get_crop(doc_ref[1].id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=dict)
async def get_crops():
    try:
        # Fetch the single latest sensor data
        latest_sensor_data = None
        latest_sid = None
        sensor_docs = db.collection('sensor_data').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
        for sdoc in sensor_docs:
            latest_sensor_data = sdoc.to_dict()
            latest_sid = sdoc.id

        docs = db.collection('crops').stream()
        crops = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Batch by batch_id
            if data.get('batch_id'):
                batch_docs = db.collection('batches').where('batch_id', '==', data.get('batch_id')).stream()
                for batch_doc in batch_docs:
                    bdata = batch_doc.to_dict()
                    bdata['id'] = bdata.get('batch_id')
                    data['batch'] = bdata
                    break
            
            # Use latest sensor data
            data['sensor_data_id'] = latest_sid
            data['sensor_data'] = latest_sensor_data
                    
            crops.append(data)
        return {'crops': crops}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_crop(crop_id: str) -> CropResponse:
    try:
        doc = db.collection('crops').document(crop_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Crop not found")
        
        data = doc.to_dict()
        data['id'] = crop_id
        
        # Batch by batch_id field match
        batch_docs = db.collection('batches').where('batch_id', '==', data.get('batch_id')).stream()
        for batch_doc in batch_docs:
            bdata = batch_doc.to_dict()
            bdata['id'] = bdata.get('batch_id')
            data['batch'] = bdata
            break
        
        # Sensor by document ID
        sensor_doc = db.collection('sensor_data').document(data.get('sensor_data_id')).get()
        if sensor_doc.exists:
            data['sensor_data'] = sensor_doc.to_dict()
        
        return CropResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop_endpoint(crop_id: str):
    return await get_crop(crop_id)

@router.put("/{crop_id}", response_model=CropResponse)
async def update_crop(crop_id: str, crop: CropCreate):
    try:
        doc_ref = db.collection('crops').document(crop_id)
        doc_ref.update({
            'name': crop.name,
            'status': crop.status,
            'alert': crop.alert,
            'notes': crop.notes,
            'batch_id': crop.batch_id,
            'sensor_data_id': crop.sensor_data_id,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        return await get_crop(crop_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{crop_id}")
async def delete_crop(crop_id: str):
    try:
        doc_ref = db.collection('crops').document(crop_id).delete()
        return {"message": "Crop deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

