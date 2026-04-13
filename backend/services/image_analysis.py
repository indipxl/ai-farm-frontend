import os
import base64
import json
import re
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from fastapi import APIRouter, File, UploadFile, HTTPException
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/image", tags=["image"])

# Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY")
)

# Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert agricultural scientist and plant pathologist specialising in crop disease and pest detection in Malaysian tropical farms."),
    ("human", [
        {
            "type": "text",
            "text": """You are a crop disease and pest detection AI. Analyze the plant image provided and respond ONLY in this exact JSON format with no extra text or markdown:

{{
  "detection": "detected disease or pest name, or 'No Disease or Pest Detected'",
  "confidence": 91,
  "status": "danger | warning | healthy",
  "detail": "one sentence description of what you see in the image",
  "suggestions": [
    "action 1",
    "action 2",
    "action 3"
  ]
}}

Rules:
- confidence is a number between 0 and 100
- status is exactly one of: danger, warning, healthy
- suggestions must be an array of 3 practical farming actions
- Be specific to Malaysian tropical farming conditions
- If image is not a plant, return status: healthy with detection: 'Unable to analyse — please upload a clear plant photo'
""",
        },
        {
            "type": "image_url",
            "image_url": {
                "url": "data:image/jpeg;base64,{image}",
                "detail": "low",
            }
        }
    ])
])

chain = prompt | llm

def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode()

@router.post("/upload-image-analysis")
async def analysis(file: UploadFile = File(...)):
    try:
        # Read and encode image
        image_bytes = await file.read()
        image_b64 = encode_image(image_bytes)

        # Run Gemini analysis
        response = chain.invoke({"image": image_b64})

        # Parse JSON from Gemini response
        raw = response.content.strip()

        # Strip markdown code fences if Gemini wraps in ```json ... ```
        raw = re.sub(r"```json|```", "", raw).strip()

        result = json.loads(raw)

        return {
            "success":    True,
            "detection":  result.get("detection",  "Unknown"),
            "confidence": result.get("confidence", 0),
            "status":     result.get("status",     "healthy"),
            "detail":     result.get("detail",     ""),
            "suggestions":result.get("suggestions",[]),
        }

    except Exception as e:
        return {
            "success":    False,
            "detection":  "Analysis Failed",
            "confidence": 0,
            "status":     "healthy",
            "detail":     f"Error: {str(e)}",
            "suggestions":["Please try again", "Ensure image is clear", "Check internet connection"],
        }
    
class ImageAnalysisCreate(BaseModel):
    batch_id: str
    detection: str
    confidence: float
    status: str
    detail: str
    suggestions: list
    image_base64: Optional[str] = None

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
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return {"success": True, "id": doc_ref[1].id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))