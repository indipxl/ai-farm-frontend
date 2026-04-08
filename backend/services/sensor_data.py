from fastapi import APIRouter, HTTPException
from firebase_admin import firestore

router = APIRouter(prefix="/sensors", tags=["sensors"])
db = firestore.client()

@router.get("/", response_model=dict)
async def get_sensors():
    try:
        docs = db.collection('sensor_data').stream()
        sensors = []
        for doc in docs:
            data = doc.to_dict()
            sensors.append({
                "id": doc.id,
                "readable_time": data.get("readable_time", "Unknown")
            })
        return {"sensors": sensors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
