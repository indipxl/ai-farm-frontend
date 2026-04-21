import os
import base64
import json
import re
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, WebSocket, WebSocketDisconnect
from langchain_google_genai import ChatGoogleGenerativeAI
from io import BytesIO
from PIL import Image
#import numpy as np
from ultralytics import YOLO
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/image", tags=["image"])

# Load YOLO model
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'bestv4.pt')
    yolo_model = YOLO(model_path)
except Exception as e:
    yolo_model = None
    print(f"Failed to load YOLO model: {e}")

# Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY")
)

# Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert plant pathologist. Your task is to analyze images for pests and diseases."),
    ("human", [
        {
            "type": "text",
            "text": """
You are tasked with analyzing a crop image that is expected to be: {expected_crop}.

CRITICAL FIRST STEP: VERIFY CROP IDENTITY
What plant is actually in the image? If the plant in the image is NOT a {expected_crop} (for example, if expected_crop is "corn" but you see chili peppers, or vice versa), you MUST set "is_correct_crop": false. Do not analyze a plant if it is the wrong crop.

YOLO Model pre-analysis findings:
{yolo_findings}

Rules for Pathology Analysis:
1. Ignore all background objects (tractors, people, tools, buildings, or sky).
2. If shadows create dark spots, do not mistake them for fungus.
3. Carefully consider the YOLO findings (if any) when identifying issues.

Return ONLY JSON:
{{
  "is_correct_crop": true | false,
  "detection": "disease name or 'Healthy'",
  "confidence": 0-100,
  "status": "danger | warning | healthy",
  "detail": "Description focusing ONLY on the plant tissue",
  "suggestions": ["action 1", "action 2", "action 3"]
}}
""",
        },
        {
            "type": "image_url",
            "image_url": {"url": "data:image/jpeg;base64,{image}", "detail": "high"}
        }
    ])
])

chain = prompt | llm

def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode()

@router.post("/upload-image-analysis")
async def analysis(file: UploadFile = File(...), batch_id: str = Form(None)):
    try:
        expected_crop = "any tropical plant"
        if batch_id:
            all_batches = db.collection('batches').stream()
            for b in all_batches:
                data = b.to_dict()
                b_id = data.get('batch_id', b.id[:10].upper())
                if b_id == batch_id:
                    expected_crop = data.get('crop', 'any tropical plant').lower().strip()
                    break

        # Read and encode image
        image_bytes = await file.read()
        image_b64 = encode_image(image_bytes)

        # ---------------------------------------------
        # YOLO Pre-analysis
        # ---------------------------------------------
        predictions = []
        yolo_findings_str = "None"
        if yolo_model is not None:
            try:
                # Open image for YOLO
                pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
                results = yolo_model(pil_image, classes=[1,2,3,4])
                
                for r in results:
                    for box in r.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = box.conf[0].item()
                        cls_name = yolo_model.names[int(box.cls[0].item())]
                        predictions.append({
                            "box": [x1, y1, x2, y2],
                            "confidence": conf,
                            "class": cls_name
                        })
                
                if predictions:
                    detected_classes = [p['class'] for p in predictions]
                    yolo_findings_str = f"Found bounding boxes for: {', '.join(set(detected_classes))}."
                else:
                    yolo_findings_str = "No specific pest/disease regions detected by YOLO. It might be healthy or the issue is sub-clinical."
            except Exception as e:
                print(f"YOLO processing error: {e}")

        # Run Gemini analysis
        response = chain.invoke({
            "image": image_b64,
            "expected_crop": expected_crop,
            "yolo_findings": yolo_findings_str
        })

        raw = re.sub(r"```json|```", "", response.content).strip()
        result = json.loads(raw)

        # 4. Handle the "Wrong Plant" Error
        is_correct = result.get("is_correct_crop", True)
        if is_correct is False or str(is_correct).lower() == "false":
            result["status"] = "warning"
            result["detail"] = f"⚠️ WARNING: This does not appear to be {expected_crop.title()}. " + result.get("detail", "")
            result["suggestions"].insert(0, f"Verify you are scanning the correct crop for this batch ({expected_crop.title()}).")

        return {
            "success": True,
            "detection": result.get("detection"),
            "confidence": result.get("confidence"),
            "status": result.get("status"),
            "detail": result.get("detail"),
            "suggestions": result.get("suggestions"),
            "bounding_boxes": predictions,
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        return {"success": False, "detail": str(e)}
    
class ImageAnalysisCreate(BaseModel):
    batch_id: str
    detection: str
    confidence: float
    status: str
    detail: str
    suggestions: list
    image_base64: Optional[str] = None
    bounding_boxes: list = []

db = firestore.client()

@router.post("/create-image-analysis")
async def create_image_analysis(data: ImageAnalysisCreate):
    try:
        doc_ref = db.collection('image_analysis').add({
            'batch_id': data.batch_id,
            'detection': data.detection,
            'confidence': data.confidence,
            'status': data.status,
            'detail': data.detail,
            'suggestions': data.suggestions,
            'image_base64': data.image_base64,
            'bounding_boxes': data.bounding_boxes,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return {"success": True, "id": doc_ref[1].id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    if yolo_model is None:
        await websocket.close(code=1011)
        return
        
    try:
        while True:
            data = await websocket.receive_text()
            
            if "," in data:
                header, encoded = data.split(",", 1)
            else:
                encoded = data
                
            image_bytes_local = base64.b64decode(encoded)
            pil_image = Image.open(BytesIO(image_bytes_local)).convert("RGB")
            
            results = yolo_model(pil_image, classes=[1,2,3,4])
            
            predictions = []
            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    predictions.append({
                        "box": [x1, y1, x2, y2],
                        "confidence": box.conf[0].item(),
                        "class": yolo_model.names[int(box.cls[0].item())]
                    })
            
            await websocket.send_json({"predictions": predictions})
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in websocket predict: {e}")