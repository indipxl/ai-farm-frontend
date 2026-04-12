from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

app = FastAPI(title="Ai Farm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://gaia-sabah-c3-group2-aifarm.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service_account_path = "gaia-sabah-c3-group2-aifarm-02d42c9eeb6a.json"

if os.path.exists(service_account_path):
    # runs on your local/cloud shell
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
else:
    # runs on Cloud Run
    firebase_admin.initialize_app()
db = firestore.client()

from services.batches import router as batches_router
from services.crops import router as crops_router
from services.sensor_data import router as sensors_router
from services.image_analysis import router as image_router

app.include_router(batches_router, prefix="/api")
app.include_router(crops_router, prefix="/api")
app.include_router(sensors_router, prefix="/api")
app.include_router(image_router, prefix="/api")