import os
import httpx
import uuid
import json # For debugging payloads
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from typing import Optional, Dict

# ElevenLabs SDK
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings, Voice

load_dotenv()

# --- Environment Variable Loading and Validation ---
ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
AKOOL_API_KEY = os.getenv("AKOOL_API_KEY", "")
AKOOL_CLIENT_ID = os.getenv("AKOOL_CLIENT_ID", "")
AKOOL_CLIENT_SECRET = os.getenv("AKOOL_CLIENT_SECRET", "")
AKOOL_API_BASE_URL = "https://openapi.akool.com/api/open/v3"

EDUCATIONAL_VIDEO_URL = os.getenv("EDUCATIONAL_VIDEO_URL")
TARGET_FACE_IMAGE_URL = os.getenv("TARGET_FACE_IMAGE_URL") # URL of image used to get TARGET_FACE_OPTS_STR
TARGET_FACE_OPTS_STR = os.getenv("TARGET_FACE_OPTS") # Expected format: "x1,y1:x2,y2:x3,y3:x4,y4"

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
if not all([EDUCATIONAL_VIDEO_URL, TARGET_FACE_IMAGE_URL, TARGET_FACE_OPTS_STR]):
    print("Warning: Akool educational video/target face variables are not fully set (EDUCATIONAL_VIDEO_URL, TARGET_FACE_IMAGE_URL, TARGET_FACE_OPTS_STR).")
if not all([S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION]):
    print("Warning: AWS S3 environment variables are not fully set for user image uploads. (S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)")


# --- FastAPI Application Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGINS", "http://localhost:3000"), "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"message": "Voice Cloning & Faceswap API is running"}

@app.post("/api/test-elevenlabs-tts")
async def test_elevenlabs_tts():
    if not elevenlabs_client:
        raise HTTPException(status_code=500, detail="ElevenLabs client not initialized.")
    
    test_text = "딥페이크 영상은 누구나 손쉽게 만들 수 있는데요."
    test_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel's voice ID (standard ElevenLabs voice)
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
async def initiate_faceswap_endpoint(user_image: UploadFile = File(...)):
    if not all([AKOOL_API_KEY, EDUCATIONAL_VIDEO_URL, TARGET_FACE_IMAGE_URL, TARGET_FACE_OPTS_STR]):
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Akool video processing variables.")
    if not S3_BUCKET_NAME: # S3 client init check is done by upload_to_s3
        raise HTTPException(status_code=500, detail="Server configuration error: S3_BUCKET_NAME not set.")

    # 1. Upload user's image to S3
    source_image_s3_url = await upload_to_s3(user_image, S3_BUCKET_NAME)

    # 2. Get face opts for the uploaded source image
    source_face_opts = await get_akool_face_opts(source_image_s3_url, AKOOL_API_KEY)
    if not source_face_opts:
        # Optional: Consider deleting the S3 object if face detection fails
        # try: s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=source_image_s3_url.split(S3_BUCKET_NAME + '/')[-1])
        # except Exception as del_e: print(f"Could not delete S3 object {source_image_s3_url} after face detect fail: {del_e}")
        raise HTTPException(status_code=400, detail="Could not detect a face in the uploaded image, or Akool API error during detection.")

    # 3. Prepare payload for Akool Video Faceswap API
    faceswap_api_url = "https://openapi.akool.com/api/open/v3/faceswap/highquality/specifyvideo"
    headers = {
        "Authorization": f"Bearer {AKOOL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "sourceImage": [{"path": source_image_s3_url, "opts": source_face_opts}],
        "targetImage": [{"path": TARGET_FACE_IMAGE_URL, "opts": TARGET_FACE_OPTS_STR}],
        "modifyVideo": EDUCATIONAL_VIDEO_URL,
        "face_enhance": 0, # 0 for no enhancement, 1 for enhancement
    }
    if AKOOL_WEBHOOK_URL:
        payload["webhookUrl"] = AKOOL_WEBHOOK_URL
    
    print(f"Calling Akool Video Faceswap API with payload: {json.dumps(payload, indent=2)}")

    # 4. Call Akool Video Faceswap API
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(faceswap_api_url, headers=headers, json=payload)
            response.raise_for_status()
            akool_response_data = response.json()
            print(f"Akool faceswap API submission response: {akool_response_data}")

            if akool_response_data.get("code") == 1000 and "data" in akool_response_data:
                akool_data = akool_response_data["data"]
                return {
                    "message": "Faceswap initiated successfully.",
                    "akool_task_id": akool_data.get("_id"), 
                    "akool_job_id": akool_data.get("job_id"),
                    "details": akool_response_data.get("msg"),
                    "direct_url": akool_data.get("url") # Extract the direct URL if Akool provides it
                }
            else:
                error_msg = akool_response_data.get("msg", "Unknown error from Akool faceswap API submission.")
                print(f"Akool faceswap API returned non-1000 code: {akool_response_data.get('code')} - {error_msg}")
                raise HTTPException(status_code=502, detail=f"Akool API Error (submission): {error_msg}")

        except httpx.HTTPStatusError as e:
            error_details = e.response.text
            try: error_details = e.response.json().get("msg", error_details)
            except json.JSONDecodeError: pass
            print(f"Akool faceswap API HTTP error (submission): {e.response.status_code} - {error_details}")
            raise HTTPException(status_code=e.response.status_code, detail=f"Akool faceswap API request failed: {error_details}")
        except Exception as e:
            print(f"Unexpected error calling Akool faceswap API (submission): {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initiate faceswap: {str(e)}")


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
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client: # Added follow_redirects and timeout here
            print(f"[STREAM_VIDEO] Fetching video from: {url}")
            
            request_headers = {
                "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
                # "Range": "bytes=0-" # Range header might be problematic for some CDNs if not handled perfectly, let browser decide for now or add back if seeking issues.
            }
            
            # Only add Akool API key for actual Akool API domains, not general CDNs like CloudFront
            # Akool might use CloudFront, but those URLs are typically pre-signed and don't use the API bearer token.
            if "openapi.akool.com" in url or "sg3.akool.com" in url: # Be more specific about Akool domains
                print(f"[STREAM_VIDEO] Akool API domain detected, adding Authorization header.")
                request_headers["Authorization"] = f"Bearer {AKOOL_API_KEY}"
            else:
                print(f"[STREAM_VIDEO] Not an Akool API domain, no Authorization header added for URL: {url}")
            
            # Make the GET request
            resp = await client.get(url, headers=request_headers)
            
            print(f"[STREAM_VIDEO] Source response status: {resp.status_code}")
            print(f"[STREAM_VIDEO] Source response headers: {resp.headers}")

            if resp.status_code == 200:
                print(f"[STREAM_VIDEO] Successfully fetched video. Content-Type from source: {resp.headers.get('Content-Type')}. Streaming as video/mp4.")
                # Ensure the client knows it's getting mp4. The source Content-Type might be different.
                response_headers = {
                    "Content-Type": "video/mp4",
                    "Content-Length": resp.headers.get("Content-Length", ""), # Pass through content length if available
                    "Accept-Ranges": resp.headers.get("Accept-Ranges", "bytes"), # Pass through accept ranges
                }
                # Filter out empty headers
                response_headers = {k: v for k, v in response_headers.items() if v}

                return StreamingResponse(resp.aiter_bytes(), media_type="video/mp4", headers=response_headers)
            elif resp.status_code == 206: # Partial Content - for range requests, though we removed explicit range for now
                print(f"[STREAM_VIDEO] Successfully fetched partial video content (206). Content-Type from source: {resp.headers.get('Content-Type')}. Streaming as video/mp4.")
                response_headers = {
                    "Content-Type": "video/mp4", # Or use resp.headers.get('Content-Type') if reliable
                    "Content-Range": resp.headers.get("Content-Range", ""),
                    "Content-Length": resp.headers.get("Content-Length", ""),
                    "Accept-Ranges": resp.headers.get("Accept-Ranges", "bytes"),
                }
                response_headers = {k: v for k, v in response_headers.items() if v}
                return StreamingResponse(resp.aiter_bytes(), status_code=206, media_type="video/mp4", headers=response_headers)
            else:
                body_bytes = await resp.aread()
                error_body_for_log = body_bytes[:500].decode(errors='replace') # Log first 500 bytes
                print(f"[STREAM_VIDEO] Error fetching video from source. Status: {resp.status_code}, Body (first 500 bytes): {error_body_for_log!r}")
                raise HTTPException(status_code=resp.status_code, detail=f"Error fetching video from source: {error_body_for_log}")

    except httpx.RequestError as e:
        print(f"[STREAM_VIDEO] httpx.RequestError while fetching video: {e}")
        raise HTTPException(status_code=500, detail=f"Request error while fetching video: {str(e)}")
    except HTTPException as e:
        # Re-raise HTTPException directly so its original status code is preserved
        raise e
    except Exception as e:
        print(f"[STREAM_VIDEO] General Exception while fetching video: {e} (Type: {type(e)})")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while trying to stream video: {str(e)}")


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