import os
import json
import asyncio
from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from google import genai
from dotenv import load_dotenv

from services.weather import get_current_weather
from services.analysis_sensor_data import get_latest_sensor_data, LOCATION_SENSOR_MAP

load_dotenv()

router = APIRouter(prefix="/disease-prediction", tags=["Disease Prediction"])
db = firestore.client()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash"

async def fetch_latest_image_analysis(batch_id: str):
    """Fetch latest image analysis for a batch"""
    try:
        docs = db.collection('image_analysis').where('batch_id', '==', batch_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).get()
        if docs:
            return docs[0].to_dict()
    except Exception as e:
        print(f"Error fetching image analysis for {batch_id}: {e}")
    return None

@router.get("/analyze")
async def analyze_disease_spread():
    try:
        # 1. Fetch Layout & Weather
        farm_settings_doc = db.collection('farm_settings').document('default_farm').get()
        if not farm_settings_doc.exists:
            raise ValueError("Farm layout not configured.")
        settings = farm_settings_doc.to_dict()
        blocks = settings.get("blocks", [])
        
        lat = settings.get("location_lat", 5.9788)
        lng = settings.get("location_lng", 116.0753)
        weather = get_current_weather(lat, lng)

        # 2. Fetch Active Batches
        batches_ref = db.collection('batches').get()
        active_batches = [b.to_dict() for b in batches_ref if b.to_dict().get('status') != 'archived']

        # 3. Aggregate Data per Block
        grid_state = []
        for block in blocks:
            # Find batch for this block
            block_label = block.get('label', '')
            batch = next((b for b in active_batches if b.get('location', '').strip().upper() == block_label.upper()), None)
            
            block_data = {
                "block_id": block.get('id'),
                "row": block.get('row'),
                "col": block.get('col'),
                "crop": "Empty",
                "soil_sensor": None,
                "air_sensor": None,
                "image_analysis": None
            }

            if batch:
                block_data["crop"] = batch.get("crop", "Unknown")
                
                # Fetch sensor data
                location_key = block_label.upper().replace('BLOCK ', '').strip().lower()
                sensor_collection = f"sensor_{location_key}_data"
                sensor_reading = get_latest_sensor_data(sensor_collection)
                
                if sensor_reading:
                    block_data["soil_sensor"] = sensor_reading.get("soil", {})
                    block_data["air_sensor"] = sensor_reading.get("air", {})

                # Fetch image analysis
                batch_id = batch.get('__doc_id') or batch.get('id') or batch.get('batch_id')
                # Try fetching by batch.id from firestore 
                # (Active batches query doesn't have doc.id mapped yet, let's fix active_batches mapping above)
                pass # We will fix the batch id mapping below

            grid_state.append(block_data)

        # Let's fix active_batches mapping to include __doc_id
        active_batches_mapped = []
        for b_doc in batches_ref:
            b_dict = b_doc.to_dict()
            if b_dict.get('status') != 'archived':
                b_dict['__doc_id'] = b_doc.id
                active_batches_mapped.append(b_dict)

        grid_state = []
        for block in blocks:
            block_label = block.get('label', '')
            
            # Robust matching: check exact match or "BLOCK [LABEL]" match
            batch = next((b for b in active_batches_mapped if b.get('location', '').strip().upper() == block_label.upper() or b.get('location', '').strip().upper() == f"BLOCK {block_label.upper()}"), None)
            
            block_data = {
                "block_id": block.get('id'),
                "row": block.get('row'),
                "col": block.get('col'),
                "crop": "Empty",
                "soil_sensor": None,
                "air_sensor": None,
                "image_analysis": None
            }

            if batch:
                block_data["crop"] = batch.get("crop", "Unknown")
                location_key = block_label.upper().replace('BLOCK ', '').strip().lower()
                sensor_collection = f"sensor_{location_key}_data"
                sensor_reading = get_latest_sensor_data(sensor_collection)
                
                if sensor_reading:
                    block_data["soil_sensor"] = sensor_reading.get("soil", {})
                    block_data["air_sensor"] = sensor_reading.get("air", {})

                # Fetch image analysis
                img_data = await fetch_latest_image_analysis(batch.get('__doc_id'))
                if img_data:
                    block_data["image_analysis"] = {
                        "detection": img_data.get("detection"),
                        "status": img_data.get("status"),
                        "confidence": img_data.get("confidence")
                    }

            grid_state.append(block_data)

        # 4. Construct Gemini Prompt
        env_type = settings.get('environment_type', 'open_air')
        env_description = "Open Air / Field" if env_type == 'open_air' else "Inside Greenhouse"

        prompt = f"""
        You are an expert agricultural AI. Analyze the following farm grid state and predict disease spread.
        The farm is arranged in a 2D grid (rows A,B,C... and cols 1,2,3...). 

        FARM ENVIRONMENT: {env_description}
        (Note: If the farm is inside a greenhouse, external wind speed has drastically reduced impact on airborne spread between distant blocks compared to an open field.)

        CURRENT EXTERNAL WEATHER:
        - Wind Speed: {weather.get('wind_speed')} km/h
        - Wind Direction: {weather.get('wind_direction')} degrees (0 is North, 90 is East, 180 is South, 270 is West. Wind blows FROM this direction.)
        - Air Temperature: {weather.get('temperature')}°C
        - Humidity: {weather.get('humidity')}%

        FARM GRID STATE:
        {json.dumps(grid_state, indent=2)}

        INSTRUCTIONS:
        1. Analyze "soil_borne" risks: Look at soil sensors (pH, moisture, NPK) and image analysis. Diseases like root rot, nematodes spread slowly to adjacent blocks.
        2. Analyze "air_borne" risks: Look at air sensors (humidity, temp), image analysis, AND weather. Consider the FARM ENVIRONMENT when determining how wind affects the spread.
        3. Identify existing hotspots and predict spread to neighboring blocks. Assign risk: "Low", "Medium", "High".
        4. If a block has "Empty" crop, it has no risk.
        5. For blocks lacking image analysis, rely on sensor anomalies (e.g. high moisture + high temp = fungal risk), but note that a visual scan is needed.

        Return strictly ONLY a JSON object in this exact format:
        {{
          "blocks": [
            {{
              "block_id": "A1",
              "soil_borne": {{
                "risk_level": "Low|Medium|High",
                "disease_name": "Name of disease or None",
                "reason": "Why this risk exists",
                "needs_scan": true|false
              }},
              "air_borne": {{
                "risk_level": "Low|Medium|High",
                "disease_name": "Name of disease or None",
                "reason": "Why this risk exists",
                "needs_scan": true|false
              }}
            }}
          ],
          "weather_summary": "Short summary of how weather and environment ({env_description}) affect current spread"
        }}
        """

        response = client.models.generate_content(
            model=MODEL_ID, 
            contents=prompt
        )

        import re
        raw = re.sub(r"```json|```", "", response.text).strip()
        result = json.loads(raw)

        # Save to database
        db.collection('disease_predictions').add({
            'prediction': result,
            'timestamp': firestore.SERVER_TIMESTAMP
        })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest")
async def get_latest_prediction():
    try:
        docs = db.collection('disease_predictions').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).get()
        if not docs:
            return None
        data = docs[0].to_dict()
        return data.get('prediction')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
