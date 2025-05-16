import os
from dotenv import load_dotenv
import httpx
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGINS", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateSpeechRequest(BaseModel):
    voice_id: str
    text: str
    model_id: str = "eleven_multilingual_v2"
    stability: float = 0.75
    similarity_boost: float = 0.75

@app.get("/")
async def read_root():
    return {"message": "Voice Cloning API is running"}

@app.post("/api/clone-voice")
async def clone_voice(audio_file: UploadFile = File(...)):
    ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
    if not ELEVEN_LABS_API_KEY:
        print("ERROR: ElevenLabs API key not found in environment variables.")
        raise HTTPException(status_code=500, detail="Server configuration error: ElevenLabs API key missing.")

    audio_data = await audio_file.read()
    print(f"Received audio file: {audio_file.filename}, size: {len(audio_data)}, type: {audio_file.content_type}")

    elevenlabs_url = "https://api.elevenlabs.io/v1/voices/add"
    headers = {
        "Accept": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY,
    }

    files_payload = [
        ('files', (audio_file.filename, audio_data, audio_file.content_type))
    ]

    data_payload = {
        'name': 'My Cloned Voice Sample'
    }
    
    print("Sending request to ElevenLabs to add voice...")
    print(f"Data payload: {data_payload}")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                elevenlabs_url,
                headers=headers,
                files=files_payload,
                data=data_payload
            )
        
        print(f"ElevenLabs Response Status: {response.status_code}")
        response_data = response.json()
        print(f"ElevenLabs Response Data: {response_data}")

        if response.status_code == 200:
            return {"voice_id": response_data.get("voice_id"), "status": "success", "elevenlabs_response": response_data}
        else:
            error_detail = response_data.get("detail", "Unknown error from ElevenLabs.")
            if isinstance(error_detail, dict) and "message" in error_detail:
                 error_detail = error_detail["message"]
            elif isinstance(error_detail, list) and len(error_detail) > 0 and "msg" in error_detail[0]:
                error_detail = error_detail[0]["msg"]

            print(f"Error from ElevenLabs: {error_detail}")
            raise HTTPException(status_code=response.status_code, detail=error_detail)

    except httpx.RequestError as exc:
        print(f"An error occurred while requesting {exc.request.url!r}: {exc!r}")
        raise HTTPException(status_code=503, detail=f"Service unavailable: Could not connect to ElevenLabs. {str(exc)}")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")

@app.post("/api/generate-speech")
async def generate_speech_endpoint(payload: GenerateSpeechRequest):
    print(f"--- Backend /api/generate-speech --- Received payload: voice_id={payload.voice_id}, text='{payload.text[:20]}...', model_id={payload.model_id}")
    ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
    if not ELEVEN_LABS_API_KEY:
        raise HTTPException(status_code=500, detail="Server configuration error: ElevenLabs API key missing.")

    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{payload.voice_id}/stream"
    print(f"--- Backend /api/generate-speech --- Calling ElevenLabs TTS URL: {tts_url}")

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY,
    }

    data = {
        "text": payload.text,
        "model_id": payload.model_id,
        "voice_settings": {
            "stability": payload.stability,
            "similarity_boost": payload.similarity_boost,
        }
    }
    print(f"--- Backend TTS --- Using voice_settings: {data['voice_settings']}")

    print(f"Requesting TTS from ElevenLabs for voice_id: {payload.voice_id} with text: \"{payload.text[:50]}...\"")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(tts_url, json=data, headers=headers)

        if response.status_code == 200:
            async def audio_stream_generator():
                async for chunk in response.aiter_bytes():
                    yield chunk
            
            return StreamingResponse(audio_stream_generator(), media_type="audio/mpeg")
        else:
            error_response_data = response.json()
            error_detail = error_response_data.get("detail", "Unknown error from ElevenLabs TTS.")
            if isinstance(error_detail, dict) and "message" in error_detail:
                 error_detail = error_detail["message"]
            print(f"ElevenLabs TTS Error ({response.status_code}): {error_detail}")
            raise HTTPException(status_code=response.status_code, detail=error_detail)

    except httpx.RequestError as exc:
        print(f"HTTPX RequestError during TTS: {str(exc)}")
        raise HTTPException(status_code=503, detail=f"Service unavailable: Could not connect to ElevenLabs for TTS. {str(exc)}")
    except Exception as e:
        print(f"Unexpected error during TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred during TTS: {str(e)}") 