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
    model="gemini-3.1-flash-lite",
    api_key=os.getenv("GEMINI_API_KEY")
)

# Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert plant pathologist. Your task is to analyze images for pests and diseases."),
    ("human", [
        {
            "type": "text",
            "text": """
Analyze this image focusing ONLY on the {expected_crop}. 

Rules for Hallucination Prevention:
1. Ignore all background objects (tractors, people, tools, buildings, or sky). 
2. If shadows create dark spots, do not mistake them for fungus.
3. Determine if the main subject is actually a {expected_crop}.

Return ONLY JSON:
{{
  "is_correct_crop": true | false,
  "detection": "disease name or 'Healthy'",
  "confidence": 0-100,
  "status": "danger | warning | healthy",
  "detail": "Description focusing ONLY on the plant tissue",
  "suggestions": ["action 1", "action 2", "action 3"]
}}

If the image is NOT a {expected_crop}, set "is_correct_crop": false.
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
async def analysis(file: UploadFile = File(...), batch_id: str = None):
    try:
        # Fetch the expected crop name from Firestore using batch_id
        expected_crop = "any tropical plant"
        if batch_id:
            batch_doc = db.collection('batches').document(batch_id).get()
            if batch_doc.exists:
                expected_crop = batch_doc.to_dict()['crop'].lower().strip()

        # Read and encode image
        image_bytes = await file.read()
        image_b64 = encode_image(image_bytes)

        # Run Gemini analysis
        response = chain.invoke({
            "image": image_b64,
            "expected_crop": expected_crop
        })

        raw = re.sub(r"```json|```", "", response.content).strip()
        result = json.loads(raw)

        # 4. Handle the "Wrong Plant" Error
        if result.get("is_correct_crop") is False:
            raise HTTPException(
                status_code=400, 
                detail=f"Verification Failed: The uploaded image does not appear to be {expected_crop}. Please upload the correct crop image."
            )

        return {
            "success": True,
            "detection": result.get("detection"),
            "confidence": result.get("confidence"),
            "status": result.get("status"),
            "detail": result.get("detail"),
            "suggestions": result.get("suggestions"),
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