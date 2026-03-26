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

# CORS - support frontend ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173, https://gaia-sabah-c3-group2-aifarm.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BatchCreate(BaseModel):
    crop: str
    location: str
    planted: str  # YYYY-MM-DD
    notes: Optional[str] = None

class BatchResponse(BaseModel):
    id: str
    crop: str
    location: str
    planted: str  # Formatted
    notes: Optional[str] = None

# Firebase Firestore client
load_dotenv()
project_id = os.getenv("FIREBASE_PROJECT_ID")
service_account_path = "gaia-sabah-c3-group2-aifarm-02d42c9eeb6a.json"

if not project_id:
    print("WARNING: Missing FIREBASE_PROJECT_ID - API will fail without backend/.env")

if not os.path.exists(service_account_path):
    print("WARNING: Missing gaia-sabah-c3-group2-aifarm-02d42c9eeb6a.json - API will fail")

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred, {"projectId": project_id})
db = firestore.client()

@app.post("/api/register-batch", response_model=BatchResponse)
async def register_batch(batch: BatchCreate):
    try:
        planted_date = parser.parse(batch.planted).date()
        planted_str = planted_date.strftime("%d %b %Y")
    except:
        raise HTTPException(400, "Invalid date. Use YYYY-MM-DD")
    
    try:
        doc_ref = db.collection("batches").add({
            "crop": batch.crop,
            "location": batch.location,
            "planted": planted_date.isoformat(),
            "notes": batch.notes,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        doc_id = doc_ref[1].id
        return BatchResponse(
            id=doc_id[:10].upper(),
            crop=batch.crop,
            location=batch.location,
            planted=planted_str,
            notes=batch.notes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/batches")
async def get_batches():
    try:
        docs = db.collection("batches").order_by("created_at").stream()
        batches = []
        for doc in docs:
            item = doc.to_dict()
            doc_id = doc.id
            try:
                planted_date = parser.parse(item["planted"])
                formatted = planted_date.strftime("%d %b %Y")
            except:
                formatted = "Unknown"
            batches.append({
                "id": doc_id[:10].upper(),
                "crop": item["crop"],
                "location": item["location"],
                "planted": formatted,
                "notes": item.get("notes", "")
            })
        return {"batches": batches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
