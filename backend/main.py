from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import uvicorn
import asyncio

app = FastAPI(title="Ai Farm API", version="1.0.0")

# @app.on_event("startup")
# async def startup_event():
#     from services.scheduler import automated_ai_loop
#     asyncio.create_task(automated_ai_loop())

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

if os.path.exists(service_account_path):
    # runs on your local/cloud shell
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
else:
    # runs on Cloud Run
    firebase_admin.initialize_app()
db = firestore.client()

# batches
from services.batches import router as batches_router
app.include_router(batches_router, prefix="/api")

# crops
from services.crops import router as crops_router
app.include_router(crops_router, prefix="/api")

# sensors
from services.sensor_data import router as sensors_router
app.include_router(sensors_router, prefix="/api")

# sensor analysis
from services.analysis_sensor_data import router as sensor_analysis_router
app.include_router(sensor_analysis_router, prefix="/api")

# image analysis
from services.image_analysis import router as image_router
app.include_router(image_router, prefix="/api")

# farm settings
from services.farm_settings import router as farm_settings_router
app.include_router(farm_settings_router, prefix="/api")

# disease prediction
from services.disease_prediction import router as disease_router
app.include_router(disease_router, prefix="/api")

# if __name__ == "__main__":
#     port = int(os.getenv('PORT', 8080))
#     uvicorn.run(app, host="0.0.0.0", port=port)
