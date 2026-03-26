from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic.v1 import BaseModel
from typing import Optional
from datetime import datetime
from dateutil import parser
from uuid import uuid4
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uvicorn

app = FastAPI(title="Ai Farm API", version="1.0.0")

# CORS - support frontend ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

# Supabase client
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    print("WARNING: Missing SUPABASE_URL or SUPABASE_KEY - API will fail without backend/.env")
supabase = create_client(supabase_url, supabase_key)

@app.post("/api/register-batch", response_model=BatchResponse)
async def register_batch(batch: BatchCreate):
    try:
        planted_date = parser.parse(batch.planted)
    except:
        raise HTTPException(400, "Invalid date. Use YYYY-MM-DD")
    
    try:
        response = supabase.table("batches").insert({
            "crop": batch.crop,
            "location": batch.location,
            "planted": planted_date.isoformat(),
            "notes": batch.notes
        }).execute()
        
        data = response.data
        if not data:
            raise HTTPException(500, "Failed to create batch")
        
        inserted = data[0]
        formatted_planted = planted_date.strftime("%d %b %Y")
        
        return BatchResponse(
            id=str(inserted["id"])[:10].upper() if inserted["id"] else "LOCAL",
            crop=inserted["crop"],
            location=inserted["location"],
            planted=formatted_planted,
            notes=inserted["notes"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/batches")
async def get_batches():
    try:
        response = supabase.table("batches").select("*").order("created_at", desc=False).execute()
        data = response.data
        batches = []
        for item in data:
            try:
                planted_date = parser.parse(item["planted"])
                formatted = planted_date.strftime("%d %b %Y")
            except:
                formatted = "Unknown"
            batches.append({
                "id": str(item["id"])[:10].upper() if item["id"] else "LOCAL",
                "crop": item["crop"],
                "location": item["location"],
                "planted": formatted,
                "notes": item["notes"]
            })
        return {"batches": batches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
