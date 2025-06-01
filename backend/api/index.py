import os
import httpx
import uuid
import json # For debugging payloads
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from typing import Optional, Dict
import sys
import traceback
from .face_configs import FACE_CONFIGS
import io
import urllib.parse

# ElevenLabs SDK
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings, Voice

# Load environment variables from the root directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# --- Environment Variable Loading and Validation ---
ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
AKOOL_API_KEY = os.getenv("AKOOL_API_KEY", "")
AKOOL_CLIENT_ID = os.getenv("AKOOL_CLIENT_ID", "")
AKOOL_CLIENT_SECRET = os.getenv("AKOOL_CLIENT_SECRET", "")
AKOOL_API_BASE_URL = "https://openapi.akool.com/api/open/v3"

EDUCATIONAL_VIDEO_URL = os.getenv("EDUCATIONAL_VIDEO_URL")

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")

AKOOL_WEBHOOK_URL = os.getenv("AKOOL_WEBHOOK_URL") # Optional

# Validate essential configurations
if not ELEVEN_LABS_API_KEY:
    print("CRITICAL ERROR: ELEVEN_LABS_API_KEY not set in .env")
if not AKOOL_API_KEY:
    print("CRITICAL ERROR: AKOOL_API_KEY not set in .env (checked AKOOL_API_KEY and MY_AKOOL_API_KEY)")
if not all([EDUCATIONAL_VIDEO_URL]):
    print("Warning: Akool educational video variables are not fully set (EDUCATIONAL_VIDEO_URL).")
if not all([S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION]):
    print("Warning: AWS S3 environment variables are not fully set for user image uploads. (S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)")


# --- FastAPI Application Setup ---
app = FastAPI(
    title="Voice Cloning API",
    description="API for voice cloning and face swapping",
    version="1.0.0"
)

# CORS configuration
CORS_ORIGINS = [
    "https://ai-awareness-frontend.vercel.app",
    "http://localhost:3000",
    "https://ai-awareness-frontend-10dpc500r-hanaisreals-projects.vercel.app",
    "https://*.vercel.app",  # Allow all Vercel preview deployments
    "http://localhost:8000",  # Allow local backend
    "https://ai-awarenesss-backend.vercel.app"  # Add your backend Vercel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handling middleware
@app.middleware("http")
async def catch_exceptions_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        print(f"Unhandled error: {str(e)}")
        print("Traceback:")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

# --- AWS S3 Client Initialization ---
s3_client = None
if all([S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION]):
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        print("S3 client initialized successfully.")
    except Exception as e:
        print(f"Error initializing S3 client: {e}. S3 dependent features will not work.")
else:
    print("S3 client not initialized due to missing AWS credentials in .env.")


# --- ElevenLabs Client Initialization ---
elevenlabs_client = None
if ELEVEN_LABS_API_KEY:
    try:
        elevenlabs_client = ElevenLabs(api_key=ELEVEN_LABS_API_KEY)
        print("ElevenLabs client initialized successfully.")
    except Exception as e:
        print(f"Error initializing ElevenLabs client: {e}")
else:
    print("ElevenLabs client not initialized due to missing API key.")


# --- Pydantic Models ---
class NarratorSpeechRequest(BaseModel):
    text: str
    voice_id: str # Voice ID will now be sent from frontend
    model_id: str = "eleven_multilingual_v2"
    # Optional: add stability and similarity_boost if you want to control them for narrator
    # stability: Optional[float] = 0.7
    # similarity_boost: Optional[float] = 0.7

class ElevenLabsSpeechRequest(BaseModel):
    text: Optional[str] = None
    name: Optional[str] = None
    age: Optional[str] = None # Age is not used in speech text but good to have if needed later
    voice_id: Optional[str] = "uyVNoMrnUku1dZyVEXwD" # Default to a standard voice
    model_id: Optional[str] = "eleven_multilingual_v2"


# --- Helper Functions ---
async def upload_to_s3(file: UploadFile, bucket_name: str, object_name: Optional[str] = None) -> str:
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 client not initialized. Check server logs and .env configuration.")
    if object_name is None:
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png' # Default extension
        object_name = f"user_uploads/{uuid.uuid4()}.{file_extension}"

    try:
        s3_client.upload_fileobj(
            file.file, 
            bucket_name, 
            object_name, 
            ExtraArgs={'ACL': 'public-read', 'ContentType': file.content_type}
        )
        # Construct the public URL
        public_url = f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
        print(f"File uploaded to S3: {public_url}")
        return public_url
    except NoCredentialsError:
        print("S3 Upload Error: AWS credentials not found.")
        raise HTTPException(status_code=500, detail="S3 configuration error: Credentials not found.")
    except PartialCredentialsError:
        print("S3 Upload Error: Incomplete AWS credentials.")
        raise HTTPException(status_code=500, detail="S3 configuration error: Incomplete credentials.")
    except ClientError as e:
        print(f"S3 ClientError during upload: {e}")
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "AccessDenied":
             print("S3 Access Denied: Check IAM user permissions for s3:PutObject and s3:PutObjectAcl on the bucket.")
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {e.response.get('Error',{}).get('Message', str(e))}")
    except Exception as e:
        print(f"An unexpected error occurred during S3 upload: {e}")
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")


async def get_akool_face_opts(image_url: str, api_key: str) -> Optional[str]:
    """Calls Akool's /detect API to get face landmarks_str."""
    if not api_key:
        raise HTTPException(status_code=500, detail="Akool API key not configured on server for face detection.")
        
    detect_url = "https://sg3.akool.com/detect"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "single_face": True,
        "image_url": image_url
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(detect_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            if data.get("error_code") == 0 and "landmarks_str" in data:
                landmarks_str_data = data["landmarks_str"]
                if isinstance(landmarks_str_data, list) and len(landmarks_str_data) > 0:
                    return landmarks_str_data[0] # API doc for /detect shows it as an array ["str"]
                elif isinstance(landmarks_str_data, str): # User's curl output showed direct string
                    return landmarks_str_data
                else:
                    print(f"Akool /detect unexpected landmarks_str format: {landmarks_str_data}")
                    return None
            else:
                print(f"Akool /detect API error: Code {data.get('error_code')} - {data.get('error_msg', 'Unknown error')}")
                return None
        except httpx.HTTPStatusError as e:
            print(f"Akool /detect HTTP error: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            print(f"Error calling Akool /detect: {e}")
            return None


# New helper to stream video from a URL
async def stream_video_from_url_helper(video_url: str):
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        try:
            async with client.stream("GET", video_url) as response:
                response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
                async for chunk in response.aiter_bytes():
                    yield chunk
        except httpx.HTTPStatusError as e:
            print(f"Error fetching video from URL {video_url}: {e.response.status_code} - {e.response.text}")
            # You might want to yield a specific error message or handle differently
            # For now, it will just stop yielding if there's an error from the source.
            yield b"" # Send empty bytes to signify an issue or handle as needed
        except Exception as e:
            print(f"Unexpected error streaming video from URL {video_url}: {e}")
            yield b""


# --- API Endpoints ---
@app.get("/")
async def read_root():
    return {
        "message": "Voice Cloning & Faceswap API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.post("/api/test-elevenlabs-tts")
async def test_elevenlabs_tts():
    if not elevenlabs_client:
        raise HTTPException(status_code=500, detail="ElevenLabs client not initialized.")
    
    test_text = "딥페이크 영상은 누구나 손쉽게 만들 수 있는데요."
    test_voice_id = "z6Kj0hecH20CdetSElRT"  # Rachel's voice ID (standard ElevenLabs voice)
    test_model_id = "eleven_multilingual_v2"

    print(f"Testing ElevenLabs TTS with: VoiceID='{test_voice_id}', Model='{test_model_id}', Text='{test_text}'")

    try:
        audio_stream = elevenlabs_client.text_to_speech.convert(
            text=test_text,
            voice_id=test_voice_id,
            model_id=test_model_id,
            voice_settings=VoiceSettings(
                stability=0.7,
                similarity_boost=0.7,
                style=0.0,
                use_speaker_boost=True
            ),
            output_format="mp3_44100_128"
        )
        return StreamingResponse(audio_stream, media_type="audio/mpeg")
    except Exception as e:
        error_message = f"ElevenLabs TTS test failed: {str(e)}"
        print(error_message)
        # Attempt to parse more specific error from ElevenLabs client if available
        error_detail_msg = error_message
        if hasattr(e, 'body') and isinstance(e.body, dict) and 'detail' in e.body:
            detail = e.body['detail']
            if isinstance(detail, list) and detail and isinstance(detail[0], dict) and 'msg' in detail[0]:
                error_detail_msg = f"ElevenLabs TTS test failed: {detail[0]['msg']}"
            elif isinstance(detail, str):
                 error_detail_msg = f"ElevenLabs TTS test failed: {detail}"
        raise HTTPException(status_code=500, detail=error_detail_msg)

@app.post("/api/generate-elevenlabs-speech")
async def generate_elevenlabs_speech_endpoint(payload: ElevenLabsSpeechRequest):
    if not elevenlabs_client:
        raise HTTPException(status_code=500, detail="ElevenLabs client not initialized. Check API key.")

    speech_text = payload.text
    if not speech_text and payload.name:
        speech_text = f"안녕하세요, {payload.name}님! 그럼 체험을 시작해볼까요?"
    elif not speech_text:
        raise HTTPException(status_code=400, detail="No text provided for speech generation, and name was also missing.")

    print(f"ElevenLabs Speech Request: Text='{speech_text[:70]}...', VoiceID='{payload.voice_id}', Model='{payload.model_id}'")

    try:
        audio_stream = elevenlabs_client.text_to_speech.convert(
            text=speech_text,
            voice_id=payload.voice_id,
            model_id=payload.model_id,
            voice_settings=VoiceSettings(
                stability=0.7, 
                similarity_boost=0.75, 
                style=0.0, # adjust if using stylistic voices
                use_speaker_boost=True
            ),
            output_format="mp3_44100_128" # Ensure this matches your needs
        )
        
        # It's better to stream the response directly if the client supports it.
        # accumulate all chunks and then return
        
        audio_bytes_list = []
        for chunk in audio_stream:
            audio_bytes_list.append(chunk)
        audio_content = b"".join(audio_bytes_list)

        return StreamingResponse(io.BytesIO(audio_content), media_type="audio/mpeg")

    except Exception as e:
        error_message = f"ElevenLabs speech generation failed: {str(e)}"
        print(error_message)
        # Attempt to parse more specific error from ElevenLabs client if available
        error_detail_msg = error_message
        if hasattr(e, 'body') and isinstance(e.body, dict) and 'detail' in e.body:
            detail = e.body['detail']
            if isinstance(detail, list) and detail and isinstance(detail[0], dict) and 'msg' in detail[0]:
                error_detail_msg = f"ElevenLabs API Error: {detail[0]['msg']}"
            elif isinstance(detail, str):
                 error_detail_msg = f"ElevenLabs API Error: {detail}"
        raise HTTPException(status_code=500, detail=error_detail_msg)

@app.post("/api/clone-voice")
async def clone_voice(audio_file: UploadFile = File(...)):
    if not elevenlabs_client:
        raise HTTPException(status_code=500, detail="ElevenLabs client not initialized. Check API key.")
    try:
        # Ensure audio_file.file is directly passed if the SDK expects a file-like object
        # The SDK's add method for voices typically expects a list of file-like objects or paths
        voice = elevenlabs_client.voices.add(
            name=f"UserClonedVoice_{uuid.uuid4().hex[:6]}", # Unique name
            description="Voice cloned from user recording for deepfake awareness.",
            files=[audio_file.file], # Changed this line
        )
        return {"voice_id": voice.voice_id if voice else None}
    except Exception as e:
        print(f"Error cloning voice with ElevenLabs: {e}")
        # Attempt to parse ElevenLabs specific error if possible
        error_detail = str(e)
        if hasattr(e, 'body') and isinstance(e.body, dict) and 'detail' in e.body: # type: ignore
            error_detail = e.body['detail'] # type: ignore
        raise HTTPException(status_code=500, detail=f"Error cloning voice: {error_detail}")


@app.post("/api/generate-narrator-speech")
async def generate_narrator_speech_endpoint(request_data: NarratorSpeechRequest):
    if not elevenlabs_client:
        print("Error: ElevenLabs client not initialized. Check API key in .env")
        raise HTTPException(status_code=500, detail="ElevenLabs client not available. Configuration issue.")
    
    try:
        print(f"Narrator speech request: Text='{request_data.text[:50]}...', VoiceID='{request_data.voice_id}', Model='{request_data.model_id}'")
        
        # Corrected to use text_to_speech.convert and adjusted parameters
        audio_stream = elevenlabs_client.text_to_speech.convert(
            text=request_data.text,
            voice_id=request_data.voice_id, # Use the voice_id from the request
            model_id=request_data.model_id,
            voice_settings=VoiceSettings( # Added explicit voice settings
                stability=0.7, # Default or adjust as needed
                similarity_boost=0.7, # Default or adjust as needed
                style=0.0, # Default or adjust as needed
                use_speaker_boost=True # Default or adjust as needed
            ),
            output_format="mp3_44100_128"
        )
        
        return StreamingResponse(audio_stream, media_type="audio/mpeg")

    except Exception as e:
        error_message = f"Failed to generate narrator speech: {str(e)}"
        print(f"Error in /api/generate-narrator-speech: {error_message}")
        # Attempt to parse more specific error from ElevenLabs client if available
        if hasattr(e, 'body') and isinstance(e.body, dict) and 'detail' in e.body:
            detail = e.body['detail']
            if isinstance(detail, list) and detail and isinstance(detail[0], dict) and 'msg' in detail[0]:
                error_message = f"ElevenLabs API Error: {detail[0]['msg']}"
            elif isinstance(detail, str):
                 error_message = f"ElevenLabs API Error: {detail}"
        
        raise HTTPException(status_code=500, detail=error_message)


@app.post("/api/initiate-faceswap")
async def initiate_faceswap_endpoint(
    user_image: UploadFile = File(...),
    section: str = Query(...),  # "FAKE_NEWS" or "IDENTITY_THEFT"
    scenario: str = Query(...),  # "SCENARIO1" or "SCENARIO2"
    gender: str = Query(...)  # "male" or "female"
):
    print(f"Received faceswap request for file: {user_image.filename}")
    
    if not s3_client:
        error_msg = "S3 client not initialized. Check server logs and .env configuration."
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    
    if not AKOOL_API_KEY:
        error_msg = "Akool API key not configured"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    
    try:
        # Get the face configuration for the selected scenario
        if section not in FACE_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Invalid section: {section}")
        
        scenario_config = FACE_CONFIGS[section].get(scenario)
        if not scenario_config:
            raise HTTPException(status_code=400, detail=f"Invalid scenario: {scenario}")
        
        # Get gender-specific configuration
        if gender not in scenario_config:
            raise HTTPException(status_code=400, detail=f"Invalid gender: {gender}")
        
        gender_specific_config = scenario_config[gender]
        if "image_swap" not in gender_specific_config or not gender_specific_config["image_swap"]:
            raise HTTPException(status_code=400, detail=f"No image_swap configuration found for {section}/{scenario}/{gender}.")

        target_config = gender_specific_config["image_swap"]["targetImage"]
        
        # Upload image to S3
        print("Uploading image to S3...")
        image_url = await upload_to_s3(user_image, S3_BUCKET_NAME)
        print(f"Image uploaded to S3: {image_url}")
        
        # Get face landmarks for source image (user's uploaded image)
        print("Getting face landmarks for source image from Akool...")
        source_landmarks = await get_akool_face_opts(image_url, AKOOL_API_KEY)
        if not source_landmarks:
            error_msg = "Failed to detect face in the uploaded image using Akool /detect. Check uploaded image or Akool /detect logs."
            print(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        print(f"Source face landmarks obtained: {source_landmarks}")
        
        # Call Akool faceswap API
        print("Calling Akool faceswap API...")
        faceswap_url = f"{AKOOL_API_BASE_URL}/faceswap/highquality/specifyimage"
        headers = {
            "Authorization": f"Bearer {AKOOL_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "sourceImage": [
                {
                    "path": image_url,
                    "opts": source_landmarks
                }
            ],
            "targetImage": [
                {
                    "path": target_config["path"],
                    "opts": target_config["opts"]
                }
            ],
            "face_enhance": 0,
            "modifyImage": target_config["path"],
            "webhookUrl": AKOOL_WEBHOOK_URL if AKOOL_WEBHOOK_URL else None
        }
        
        print(f"Akool Faceswap Request URL: {faceswap_url}")
        print(f"Akool Faceswap Request Headers: {json.dumps(headers, indent=2)}")
        print(f"Akool Faceswap Request Payload: {json.dumps(payload, indent=2)}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(faceswap_url, headers=headers, json=payload)
            response_text = response.text
            print(f"Akool Faceswap Raw Response Status: {response.status_code}")
            print(f"Akool Faceswap Raw Response Headers: {json.dumps(dict(response.headers), indent=2)}")
            print(f"Akool Faceswap Raw Response Body: {response_text}")

            response.raise_for_status()
            
            try:
                data = response.json()
            except json.JSONDecodeError:
                error_msg = "Failed to decode JSON response from Akool faceswap API."
                print(f"{error_msg} Response text was: {response_text}")
                raise HTTPException(status_code=502, detail=error_msg)

            print(f"Akool faceswap Parsed JSON Response: {json.dumps(data, indent=2)}")
            
            if data.get("code") != 1000:
                error_msg = f"Akool faceswap API error. Code: {data.get('code')}. Message: {data.get('msg', 'No specific error message provided by Akool.')}"
                print(error_msg)
                print(f"Full Akool error response: {json.dumps(data)}")
                raise HTTPException(status_code=500, detail=error_msg)
            
            return {
                "akool_task_id": data.get("data", {}).get("_id"),
                "akool_job_id": data.get("data", {}).get("job_id"),
                "message": data.get("msg", "Faceswap image generation completed"),
                "details": None,
                "direct_url": data.get("data", {}).get("url")
            }
            
    except httpx.HTTPStatusError as hse:
        error_body = hse.response.text
        print(f"Akool Faceswap API returned HTTP error: {hse.response.status_code}. Response: {error_body}")
        detail_message = f"Akool API request failed with status {hse.response.status_code}."
        try:
            error_json = hse.response.json()
            detail_message += f" Akool message: {error_json.get('msg', error_json.get('error_msg', 'No specific message.'))}"
        except json.JSONDecodeError:
            detail_message += f" Response body: {error_body[:200]}"
        raise HTTPException(status_code=502, detail=detail_message)
    except HTTPException as he:
        print(f"HTTP Exception in faceswap: {str(he.detail)}")
        raise he
    except Exception as e:
        error_msg = f"Unexpected error in faceswap: {str(e)}"
        print(error_msg)
        print("Traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/api/faceswap-status/{task_id}")
async def get_faceswap_status_endpoint(task_id: str):
    if not AKOOL_API_KEY:
        raise HTTPException(status_code=500, detail="Server configuration error: AKOOL_API_KEY not set.")

    status_api_url = f"https://openapi.akool.com/api/open/v3/faceswap/result/listbyids?_ids={task_id}"
    headers = {"Authorization": f"Bearer {AKOOL_API_KEY}"}

    print(f"Polling Akool status for task_id: {task_id}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(status_api_url, headers=headers)
            response.raise_for_status()
            status_data = response.json()
            print(f"Akool status API response for {task_id}: {status_data}")

            if status_data.get("code") == 1000 and "data" in status_data and "result" in status_data["data"]:
                results = status_data["data"]["result"]
                if results:
                    # Return the first result, which should correspond to the task_id
                    return {"task_id": task_id, "status_details": results[0]}
                else:
                    # Akool might return an empty result list if the task ID is very new or invalid
                    return {"task_id": task_id, "status_details": {"faceswap_status": 0, "msg": "No results found for this task ID yet or ID is invalid."}}
            else:
                error_msg = status_data.get("msg", "Unknown error from Akool status API.")
                print(f"Akool status API returned non-1000 code: {status_data.get('code')} - {error_msg}")
                raise HTTPException(status_code=502, detail=f"Akool Status API Error: {error_msg}")

        except httpx.HTTPStatusError as e:
            error_details = e.response.text
            try: error_details = e.response.json().get("msg", error_details)
            except json.JSONDecodeError: pass
            print(f"Akool status API HTTP error: {e.response.status_code} - {error_details}")
            raise HTTPException(status_code=e.response.status_code, detail=f"Akool status API request failed: {error_details}")
        except Exception as e:
            print(f"Unexpected error calling Akool status API: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get faceswap status: {str(e)}")


@app.get("/api/stream-video")
async def stream_video(url: str = Query(...)):
    print(f"[STREAM_VIDEO] Received request for URL: {url}")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            print(f"[STREAM_VIDEO] Fetching video from: {url}")
            
            # Add headers that might help with CloudFront access
            request_headers = {
                "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Origin": "http://localhost:3000",
                "Referer": "http://localhost:3000"
            }
            
            # Add Akool API key for CloudFront URLs
            if "cloudfront.net" in url:
                print(f"[STREAM_VIDEO] CloudFront URL detected, adding Authorization header")
                request_headers["Authorization"] = f"Bearer {AKOOL_API_KEY}"
            elif "openapi.akool.com" in url or "sg3.akool.com" in url:
                print(f"[STREAM_VIDEO] Akool API domain detected, adding Authorization header")
                request_headers["Authorization"] = f"Bearer {AKOOL_API_KEY}"
            
            # Make the GET request
            resp = await client.get(url, headers=request_headers)
            
            print(f"[STREAM_VIDEO] Source response status: {resp.status_code}")
            print(f"[STREAM_VIDEO] Source response headers: {resp.headers}")

            if resp.status_code == 200:
                print(f"[STREAM_VIDEO] Successfully fetched video. Content-Type from source: {resp.headers.get('Content-Type')}. Streaming as video/mp4.")
                # Ensure the client knows it's getting mp4. The source Content-Type might be different.
                response_headers = {
                    "Content-Type": "video/mp4",
                    "Content-Length": resp.headers.get("Content-Length", ""),
                    "Accept-Ranges": resp.headers.get("Accept-Ranges", "bytes"),
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Cache-Control": "public, max-age=31536000"  # Cache for 1 year
                }
                # Filter out empty headers
                response_headers = {k: v for k, v in response_headers.items() if v}

                return StreamingResponse(resp.aiter_bytes(), media_type="video/mp4", headers=response_headers)
            elif resp.status_code == 206:  # Partial Content
                print(f"[STREAM_VIDEO] Successfully fetched partial video content (206). Content-Type from source: {resp.headers.get('Content-Type')}. Streaming as video/mp4.")
                response_headers = {
                    "Content-Type": "video/mp4",
                    "Content-Range": resp.headers.get("Content-Range", ""),
                    "Content-Length": resp.headers.get("Content-Length", ""),
                    "Accept-Ranges": resp.headers.get("Accept-Ranges", "bytes"),
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Cache-Control": "public, max-age=31536000"  # Cache for 1 year
                }
                response_headers = {k: v for k, v in response_headers.items() if v}
                return StreamingResponse(resp.aiter_bytes(), status_code=206, media_type="video/mp4", headers=response_headers)
            else:
                body_bytes = await resp.aread()
                error_body_for_log = body_bytes[:500].decode(errors='replace')
                print(f"[STREAM_VIDEO] Error fetching video from source. Status: {resp.status_code}, Body (first 500 bytes): {error_body_for_log!r}")
                
                # If it's a CloudFront error, try to get a fresh URL from the backend
                if "cloudfront" in url.lower() and resp.status_code == 403:
                    raise HTTPException(status_code=503, detail="CloudFront URL expired. Please try again.")
                else:
                    raise HTTPException(status_code=resp.status_code, detail=f"Error fetching video from source: {error_body_for_log}")

    except httpx.RequestError as e:
        print(f"[STREAM_VIDEO] httpx.RequestError while fetching video: {e}")
        raise HTTPException(status_code=500, detail=f"Request error while fetching video: {str(e)}")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"[STREAM_VIDEO] General Exception while fetching video: {e} (Type: {type(e)})")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while trying to stream video: {str(e)}")


@app.get("/api/stream-image")
async def stream_image(url: str = Query(...)):
    print(f"[STREAM_IMAGE] Received request for image URL: {url}")
    
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid URL format for streaming.")
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            print(f"[STREAM_IMAGE] Fetching image from: {url}")
            
            # Add headers that might help with CloudFront access
            headers = {
                "Accept": "image/*,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            }
            
            # Make the GET request with headers
            resp = await client.get(url, headers=headers)
            
            print(f"[STREAM_IMAGE] Source response status: {resp.status_code}")
            print(f"[STREAM_IMAGE] Source response headers: {resp.headers}")

            if resp.status_code == 200:
                print(f"[STREAM_IMAGE] Successfully fetched image. Content-Type from source: {resp.headers.get('Content-Type')}")
                
                # Determine the correct content type from the response
                content_type = resp.headers.get('Content-Type', 'image/png')
                
                # Create response headers
                response_headers = {
                    "Content-Type": content_type,
                    "Content-Length": resp.headers.get("Content-Length", ""),
                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                }
                # Filter out empty headers
                response_headers = {k: v for k, v in response_headers.items() if v}

                # Read the entire image data
                image_data = await resp.aread()
                return Response(content=image_data, media_type=content_type, headers=response_headers)
            else:
                body_bytes = await resp.aread()
                error_body_for_log = body_bytes[:500].decode(errors='replace')
                print(f"[STREAM_IMAGE] Error fetching image from source. Status: {resp.status_code}, Body (first 500 bytes): {error_body_for_log!r}")
                
                # If it's a CloudFront error, try to get a fresh URL from the backend
                if "cloudfront" in url.lower() and resp.status_code == 403:
                    raise HTTPException(status_code=503, detail="CloudFront URL expired. Please try again.")
                else:
                    raise HTTPException(status_code=resp.status_code, detail=f"Error fetching image from source: {error_body_for_log}")

    except httpx.RequestError as e:
        print(f"[STREAM_IMAGE] httpx.RequestError while fetching image: {e}")
        raise HTTPException(status_code=500, detail=f"Request error while fetching image: {str(e)}")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"[STREAM_IMAGE] General Exception while fetching image: {e} (Type: {type(e)})")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while trying to stream image: {str(e)}")


# Add OPTIONS handler for CORS preflight requests
@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )


@app.post("/api/initiate-video-faceswap")
async def initiate_video_faceswap_endpoint(
    user_image: UploadFile = File(...),
    section: str = Query(...),      # e.g., "IDENTITY_THEFT"
    scenario: str = Query(...),     # e.g., "SCENARIO1"
    gender: str = Query(...)       # "male" or "female"
):
    print(f"Received video faceswap request for file: {user_image.filename}, section: {section}, scenario: {scenario}, gender: {gender}")

    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 client not initialized.")
    if not AKOOL_API_KEY:
        raise HTTPException(status_code=500, detail="Akool API key not configured.")

    try:
        # Get the video_swap configuration
        if section not in FACE_CONFIGS or scenario not in FACE_CONFIGS[section] or gender not in FACE_CONFIGS[section][scenario]:
            raise HTTPException(status_code=400, detail="Invalid section, scenario, or gender for video swap config.")
        
        gender_config = FACE_CONFIGS[section][scenario][gender]
        if "video_swap" not in gender_config or not gender_config["video_swap"]:
            raise HTTPException(status_code=400, detail=f"No video_swap configuration found for {section}/{scenario}/{gender}.")
        
        video_swap_config = gender_config["video_swap"]
        target_modify_video_url = video_swap_config["modifyVideoUrl"]
        target_faces_in_video = video_swap_config["targetFacesInVideo"]

        if not target_modify_video_url or not target_faces_in_video:
            raise HTTPException(status_code=400, detail="Incomplete video_swap configuration: modifyVideoUrl or targetFacesInVideo missing.")

        # Upload user image to S3
        print("Uploading user image to S3 for video faceswap...")
        source_image_s3_url = await upload_to_s3(user_image, S3_BUCKET_NAME)
        print(f"User image uploaded to S3: {source_image_s3_url}")

        # Get face landmarks for the user's uploaded image (sourceImage)
        print("Getting face landmarks for source user image from Akool...")
        source_image_landmarks = await get_akool_face_opts(source_image_s3_url, AKOOL_API_KEY)
        if not source_image_landmarks:
            raise HTTPException(status_code=400, detail="Failed to detect face in the uploaded user image.")
        print(f"Source user image face landmarks: {source_image_landmarks}")

        # Prepare payload for Akool /faceswap/highquality/specifyvideo
        akool_faceswap_video_url = f"{AKOOL_API_BASE_URL}/faceswap/highquality/specifyvideo"
        headers = {
            "Authorization": f"Bearer {AKOOL_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "sourceImage": [
                {
                    "path": source_image_s3_url,
                    "opts": source_image_landmarks
                }
            ],
            "targetImage": target_faces_in_video, # This comes from our config
            "face_enhance": 0,
            "modifyVideo": target_modify_video_url, # This also from config
            "webhookUrl": AKOOL_WEBHOOK_URL if AKOOL_WEBHOOK_URL else None
        }

        print(f"Akool Video Faceswap Request URL: {akool_faceswap_video_url}")
        print(f"Akool Video Faceswap Payload: {json.dumps(payload, indent=2)}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(akool_faceswap_video_url, headers=headers, json=payload)
            response_text = response.text
            print(f"Akool Video Faceswap Raw Response Status: {response.status_code}")
            print(f"Akool Video Faceswap Raw Response Body: {response_text}")
            response.raise_for_status()
            data = response.json()

            if data.get("code") != 1000:
                raise HTTPException(status_code=500, detail=f"Akool video faceswap API error. Code: {data.get('code')}. Msg: {data.get('msg')}")
            
            # For video, Akool returns a task ID that needs to be polled.
            # The frontend will use this task ID with the existing /api/faceswap-status/{task_id} endpoint.
            return {
                "akool_task_id": data.get("data", {}).get("_id"),
                "akool_job_id": data.get("data", {}).get("job_id"),
                "message": data.get("msg", "Video faceswap generation started. Poll for status."),
            }

    except httpx.HTTPStatusError as hse:
        print(f"Akool Video Faceswap API HTTP error: {hse.response.status_code}. Response: {hse.response.text}")
        raise HTTPException(status_code=502, detail=f"Akool Video API request failed: {hse.response.status_code} - {hse.response.text[:200]}")
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error in video faceswap: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Video faceswap error: {str(e)}")


@app.get("/api/proxy-image")
async def proxy_image(url: str, request: Request):
    try:
        # Validate URL format
        if not url:
            raise HTTPException(status_code=400, detail="URL parameter is required")
            
        # Decode the URL if it's encoded
        try:
            decoded_url = urllib.parse.unquote(url)
        except Exception as e:
            print(f"Error decoding URL: {e}")
            raise HTTPException(status_code=400, detail="Invalid URL encoding")

        # Validate URL format after decoding
        if not decoded_url.startswith(('http://', 'https://')):
            print(f"Invalid URL format: {decoded_url}")
            raise HTTPException(status_code=400, detail="Invalid URL format. URL must start with http:// or https://")

        print(f"Proxying image from URL: {decoded_url}")
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # Base headers for all requests
            headers = {
                "Accept": "image/*,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Origin": request.headers.get("origin", "http://localhost:3000"),
                "Referer": request.headers.get("origin", "http://localhost:3000")
            }
            
            # Add Authorization header for CloudFront URLs (Akool images)
            if 'cloudfront.net' in decoded_url:
                headers["Authorization"] = f"Bearer {AKOOL_API_KEY}"
                print(f"Added Authorization header for CloudFront URL")
            elif 'openapi.akool.com' in decoded_url or 'sg3.akool.com' in decoded_url:
                headers["Authorization"] = f"Bearer {AKOOL_API_KEY}"
                print(f"Added Authorization header for Akool API URL")
            
            try:
                response = await client.get(decoded_url, headers=headers)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                print(f"HTTP error while fetching image: {e.response.status_code} - {e.response.text}")
                if e.response.status_code == 403:
                    raise HTTPException(status_code=403, detail="Access denied to image resource. Please try again.")
                elif e.response.status_code == 404:
                    raise HTTPException(status_code=404, detail="Image not found.")
                else:
                    raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch image: {e.response.text}")
            except Exception as e:
                print(f"Error fetching image: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error fetching image: {str(e)}")
            
            # Get the content type from the original response
            content_type = response.headers.get('content-type', 'image/png')
            
            # Read the entire image data
            try:
                image_data = await response.aread()
            except Exception as e:
                print(f"Error reading image data: {str(e)}")
                raise HTTPException(status_code=500, detail="Error reading image data")
            
            # Add CORS and caching headers
            headers = {
                "Content-Type": content_type,
                "Access-Control-Allow-Origin": request.headers.get("origin", "http://localhost:3000"),
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
                "Pragma": "public"
            }
            
            # Return the image with the appropriate content type and headers
            return Response(
                content=image_data,
                media_type=content_type,
                headers=headers
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error in proxy_image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


if __name__ == "__main__": 
    import uvicorn
    import sys
    import pathlib

    # Get the absolute path to the directory containing this file (backend/)
    current_dir = pathlib.Path(__file__).resolve().parent
    # Get the absolute path to the workspace root (parent of backend/)
    workspace_root = current_dir.parent

    # Add the workspace root to sys.path if it's not already there
    # This helps the reloader find the 'backend' module
    if str(workspace_root) not in sys.path:
        sys.path.insert(0, str(workspace_root))

    print(f"Starting Uvicorn server for backend API from: {current_dir}")
    print(f"Workspace root added to sys.path: {workspace_root}")
    
    # Explicitly tell Uvicorn how to import the app for reloading
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=[str(current_dir)]) 