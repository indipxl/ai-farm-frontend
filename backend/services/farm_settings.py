from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from firebase_admin import firestore

router = APIRouter(prefix="/farm-settings", tags=["farm_settings"])

class BlockDef(BaseModel):
    id: str  # e.g., "A1"
    row: int
    col: int
    label: str # e.g., "BLOCK A1"

class FarmSettingsUpdate(BaseModel):
    num_blocks: Optional[int] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    orientation: Optional[str] = None
    environment_type: Optional[str] = None
    farm_name: Optional[str] = None
    farm_location: Optional[str] = None
    blocks: Optional[List[BlockDef]] = None

db = firestore.client()
SETTINGS_DOC_ID = 'default_farm'

@router.get("", response_model=dict)
async def get_farm_settings():
    try:
        doc_ref = db.collection('farm_settings').document(SETTINGS_DOC_ID)
        doc = doc_ref.get()
        if not doc.exists:
            # Return default settings if none exist
            default_settings = {
                "num_blocks": 24,
                "location_lat": 5.9788,
                "location_lng": 116.0753,
                "orientation": "North",
                "environment_type": "open_air",
                "blocks": []
            }
            # Initialize with default blocks A1 to D6
            for r, row_char in enumerate(["A", "B", "C", "D"]):
                for c in range(1, 7):
                    default_settings["blocks"].append({
                        "id": f"{row_char}{c}",
                        "row": r,
                        "col": c - 1,
                        "label": f"BLOCK {row_char}{c}"
                    })
            doc_ref.set(default_settings)
            return default_settings
        
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("", response_model=dict)
async def update_farm_settings(settings: FarmSettingsUpdate):
    try:
        update_data = {}
        if settings.num_blocks is not None: update_data['num_blocks'] = settings.num_blocks
        if settings.location_lat is not None: update_data['location_lat'] = settings.location_lat
        if settings.location_lng is not None: update_data['location_lng'] = settings.location_lng
        if settings.orientation is not None: update_data['orientation'] = settings.orientation
        if settings.environment_type is not None: update_data['environment_type'] = settings.environment_type
        if settings.blocks is not None: update_data['blocks'] = [b.model_dump() for b in settings.blocks]

        doc_ref = db.collection('farm_settings').document(SETTINGS_DOC_ID)
        # check if exists
        if not doc_ref.get().exists:
            doc_ref.set(update_data)
        else:
            doc_ref.update(update_data)
        
        return {"status": "success", "message": "Farm settings updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
