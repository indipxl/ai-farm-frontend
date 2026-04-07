from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
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

load_dotenv()
project_id = os.getenv("FIREBASE_PROJECT_ID")
service_account_path = "gaia-sabah-c3-group2-aifarm-02d42c9eeb6a.json"

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

# batches
from .services.batches import router as batches_router
app.include_router(batches_router, prefix="/api")

# crops
from .services.crops import router as crops_router
app.include_router(crops_router, prefix="/api")

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
