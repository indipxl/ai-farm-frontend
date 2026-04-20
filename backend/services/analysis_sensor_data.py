import os
import re
import json
from fastapi import APIRouter, HTTPException
from firebase_admin import credentials, firestore, _apps, initialize_app
from google import genai
from dotenv import load_dotenv


load_dotenv()

router = APIRouter(prefix="/soil", tags=["AI Analysis from IoT Sensors"])

db = firestore.client()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash"

# Automatically generate mappings for BLOCK A1 to D6
LOCATION_SENSOR_MAP = {
    f"BLOCK {block}{num}": f"sensor_{block.lower()}{num}_data"
    for block in ["A", "B", "C", "D"]
    for num in range(1, 7)
}

def get_batch_data(batch_id: str):
    """
    Fetch specific batch document by ID or short frontend ID
    """
    try:
        # First try fetching exactly by document ID
        doc = db.collection('batches').document(batch_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['__doc_id'] = doc.id
            return data
            
        # Query frontend 'batch_id' field
        docs = db.collection('batches').where('batch_id', '==', batch_id).limit(1).get()
        if docs:
            data = docs[0].to_dict()
            data['__doc_id'] = docs[0].id
            return data
            
        return None
    except Exception as e:
        print(f"Error fetching batch: {e}")
        return None

def get_latest_sensor_data(sensor_collection: str):
    """
    Pulls the most recent soil data entry from the dynamically mapped Firestore collection.
    """
    try:
        docs_sensor = db.collection(sensor_collection).order_by(
            "timestamp", direction=firestore.Query.DESCENDING
        ).limit(1).get()
        
        if not docs_sensor:
            print(f"No data found in {sensor_collection}.")
            return None

        doc_snapshot = docs_sensor[0]
        sensor_data = doc_snapshot.to_dict()
        sensor_id = doc_snapshot.id  # unique Firestore string ID in sensor_x_data collection
        sensor_data['id'] = sensor_id
        
        return sensor_data

    except Exception as e:
        print(f"Error accessing Firestore {sensor_collection}: {e}")
        return None

# AI thingy    
def analyze_soil_with_llm(data, crop_retrieved):
    """
    Sends raw data to Gemini for classification and recommendations.
    """

    air = data.get('air', {})
    soil = data.get('soil', {})

    prompt = f"""
    You are an expert AI Agronomist specializing in Plant Health Management.
    Analyze the following real-time soil sensor data for the specific crop:

    - Crop: {crop_retrieved}
    - Air Temperature: {air.get('temp', 'N/A')}°C
    - Humidity: {air.get('hum', 'N/A')}%
    - Soil Temperature: {soil.get('temp', 'N/A')}°C
    - Soil Moisture: {soil.get('moisture', 'N/A')}%
    - Soil EC: {soil.get('ec', 'N/A')} uS/cm
    - NPK (Estimated): N:{soil.get('est_n', 'N/A')}, P:{soil.get('est_p', 'N/A')}, K:{soil.get('est_k', 'N/A')} mg/kg
    - Soil pH: {soil.get('ph', 'N/A')}
    
    Using strictly English language, please provide a response in the following format:
    1. THE CROP IS: 
    2. SOIL HEALTH CLASSIFICATION: Only for the specific mentioned crop.
    (Provide on the classification of either one of these:
    - Healthy
    - Warning
    - Critical)
    3. SOIL HEALTH SCORE: Give a score based on all the sensor reading and the classification above. (Provide only the integer between 0 and 100)
    4. RECOMMENDED ACTIONS: Briefly state what disease or pest attack is likely. If none, state "No risk of disease or pest attack". 
    If there is a risk of disease or pest attack, provide exactly 3 short actionable recommendations in this format: 
    Action 1: 
    Action 2:
    Action 3: 
    Formatting Rules:
    - You MUST put a double line break (press Enter twice) after the summary.
    - Every bullet point MUST start on a brand new line.
    - Do not use a paragraph format.
    """

    response = client.models.generate_content(
        model=MODEL_ID, 
        contents=prompt
    )
    return response.text

# Function to extract integer from AI text (untuk display score)
def extract_score(text):
    """
    Searches the AI text for the number following 'SOIL HEALTH SCORE:'.
    """
    try:
        # Looks for "SOIL HEALTH SCORE:" followed by any number of spaces and digits
        match = re.search(r"SOIL HEALTH SCORE:\s*(\d+)", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 0 # Default if no number found
    except Exception:
        return 0

# Function to extract AI Recommendation from the response
def extract_recommendation(text):
    """
    Searches the AI text for the recommendation following 'RECOMMENDED ACTIONS:'.
    """
    try:
        # Remove markdown asterisks if Gemini bolded the headers
        clean_text = text.replace('*', '')
        # Match everything to the end of the string using re.DOTALL
        import re
        match = re.search(r"RECOMMENDED ACTIONS:\s*(.*)", clean_text, re.IGNORECASE | re.DOTALL)
        if match:
            rec = match.group(1).strip()
            return rec if rec else "No recommendation found"
        return "No recommendation found"
    except Exception:
        return "No recommendation found"

# Function to extract soil classification from the response (untuk display status)
def extract_soil_classification(text):
    """
    Searches the AI text for the classification following 'SOIL HEALTH CLASSIFICATION:'.
    """
    try:
        clean_text = text.replace('*', '')
        import re
        # Stop matching at the first newline so we don't accidentally grab the health score 
        match = re.search(r"SOIL HEALTH CLASSIFICATION:\s*([^\n\r]+)", clean_text, re.IGNORECASE)
        if match:
            cls = match.group(1).strip()
            return cls if cls else "No soil classification found"
        return "No soil classification found"
    except Exception:
        return "No soil classification found"

# Function to save the AI generated report with the integer score. Called "ai_reports" in the firestore collection
def save_ai_report(analysis_text, sensor_data, document_id):
    """
    Saves analysis, the extracted recommendation, the extracted integer score, the extracted soil classification and sensor data to 'ai_reports'.
    """
    # Extract the score using the helper function
    health_score = extract_score(analysis_text)
    ai_recommendation = extract_recommendation(analysis_text)
    soil_classification = extract_soil_classification(analysis_text)

    try:
        report_ref = db.collection("ai_reports").document()
        report_data = {
            "analysis": analysis_text,
            "health_score": health_score, # This is integer for health score tu
            "ai_recommendation": ai_recommendation, # This is the text for the recommendation
            "soil_classification": soil_classification, # This is the text for the soil classification
            "timestamp": firestore.SERVER_TIMESTAMP,
            "sensor_snapshot": {
                "readable_time": sensor_data.get('readable_time'),
                "sensor_data_id": sensor_data['id'],
                "batch_id": document_id
            }
        }
        report_ref.set(report_data)
        print(f"AI Reports saved (ID: {report_ref.id}), (sensor data ID: {sensor_data['id']})")
        return report_ref.id
    except Exception as e:
        print(f"Error saving report: {e}")
        return None
    

def process_batch_analysis(batch_data: dict, batch_id: str):
    """
    Core sequence to pull sensor data and trigger Gemini for a specific batch.
    Designed to be reusable by both HTTP endpoint and background scheduler.
    """
    crop_type = batch_data.get('crop', 'Unknown Crop')
    location = batch_data.get('location', '')
    if not location:
        raise ValueError(f"Batch {batch_id} has no location assigned.")
        
    location_key = location.strip().upper()
    
    sensor_collection = 'sensor_data'
    if location_key.startswith('BLOCK '):
        block_id = location_key.replace('BLOCK ', '').strip().lower()
        sensor_collection = f"sensor_{block_id}_data"

    sensor_reading = get_latest_sensor_data(sensor_collection)
    if not sensor_reading:
        raise ValueError(f"No sensor data found in {sensor_collection}.")

    analysis = analyze_soil_with_llm(sensor_reading, crop_type)
    
    # Tied the report to the true Firestore document ID
    true_doc_id = batch_data.get('__doc_id', batch_id)
    report_id = save_ai_report(analysis, sensor_reading, true_doc_id)
    
    return {
        "status": "success",
        "report_id": report_id,
        "sensor_data_id": sensor_reading['id'],
        "batch_id": batch_id,
        "crop": crop_type,
        "analysis": analysis
    }

# API endpoint for single batch
@router.get("/analyze/{batch_id}")
async def trigger_analysis(batch_id: str):
    batch_data = get_batch_data(batch_id)
    if not batch_data:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found.")

    try:
        import asyncio
        result = await asyncio.to_thread(process_batch_analysis, batch_data, batch_id)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API endpoint for all batches
@router.get("/analyze")
async def trigger_analysis_all():
    batches_ref = db.collection('batches').get()
    processed_count = 0
    errors = []
    
    for doc in batches_ref:
        batch_data = doc.to_dict()
        batch_id = doc.id
        batch_data['__doc_id'] = batch_id 
        
        if batch_data.get('status') == 'archived':
            continue
            
        location = batch_data.get('location', '')
        if not location or location.strip() == '':
            continue
            
        try:
            import asyncio
            await asyncio.to_thread(process_batch_analysis, batch_data, batch_id)
            processed_count += 1
        except Exception as e:
            errors.append(f"Batch {batch_id}: {str(e)}")
            
    return {"status": "success", "processed": processed_count, "errors": errors}