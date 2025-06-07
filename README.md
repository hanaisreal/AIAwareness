# Voice Cloning Deepfake Awareness Project

## 📢 Project Overview

This project is a mobile-friendly Progressive Web App (PWA) designed to raise awareness, particularly among elderly users, about the risks of AI-generated deepfakes and cloned voice scams.

Users interact with the app by recording their voice directly on the site. The app then sends their voice to an AI voice cloning service (ElevenLabs via a custom backend). The system uses this cloned voice to play back a realistic scam scenario, such as an impersonation of a family member asking for personal documents or financial help. This interactive experience aims to provoke reflection, increase digital literacy, and encourage caution when encountering suspicious digital interactions.

The user journey includes:
1.  Recording a short voice sample.
2.  (Optionally) Viewing a short educational piece about voice cloning risks.
3.  Hearing their own cloned voice used in a simulated scam scenario.
4.  Reflecting on the experience and the potential risks.

## 🛠️ Tech Stack

**Frontend:**
*   **Framework:** Next.js (a React framework)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Core Library:** React
*   **Audio:** Browser's MediaRecorder API for in-browser voice recording
*   **Development Environment & Build Tools:** Node.js and npm

**Backend:**
*   **Framework:** FastAPI (Python)
*   **Language:** Python
*   **Functionality:**
    *   Accepts recorded audio files from the frontend.
    *   Interfaces with the ElevenLabs API to clone the user's voice.
    *   Generates synthetic speech using the cloned voice and a predefined scam script.
    *   Returns the generated audio to the frontend.
*   **Environment Config:** `.env` file for API keys and settings.

**External APIs:**
*   **Voice Cloning & TTS:** ElevenLabs API

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   **Node.js and npm:** Required for the Next.js frontend development environment, package management, and build scripts. Ensure you have a recent LTS version of Node.js installed, which includes npm. You can download it from [nodejs.org](https://nodejs.org/).
*   **Python:** (For the backend) - Python 3.8 or higher is recommended. You can download it from [python.org](https://www.python.org/).
*   **Git:** For cloning the repository.
*   **ElevenLabs API Key:** You'll need an API key from [ElevenLabs](https://elevenlabs.io/).

### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd voiceCloning # Or your project's root folder name
    ```

2.  **Backend Setup:**
    *   Navigate to the backend directory:
        ```bash
        cd backend
        ```
    *   Create a Python virtual environment (recommended):
        ```bash
        python -m venv venv
        ```
    *   Activate the virtual environment:
        *   On macOS/Linux: `source venv/bin/activate`
        *   On Windows: `venv\Scripts\activate`
    *   Install Python dependencies:
        ```bash
        pip install -r requirements.txt
        ```
    *   Create a `.env` file in the `backend` directory (`backend/.env`):
        ```env
        ELEVEN_LABS_API_KEY="YOUR_ELEVENLABS_API_KEY_HERE"
        CORS_ORIGINS="http://localhost:3000" # Allows frontend to connect
        ```
        Replace `"YOUR_ELEVENLABS_API_KEY_HERE"` with your actual ElevenLabs API key.

3.  **Frontend Setup (Next.js):**
    *   Navigate to the frontend directory (from the project root):
        ```bash
        cd ../frontend # If you are in the backend folder
        # OR from project root:
        # cd frontend
        ```
    *   Install Node.js dependencies (for Next.js and other tools):
        ```bash
        npm install
        ```
    *   (Optional) If you need to specify the backend API URL and it's different from the default (`http://localhost:8000`), you can create a `.env.local` file in the `frontend` directory (`frontend/.env.local`):
        ```env
        NEXT_PUBLIC_API_URL=http://localhost:8000
        ```

### Running the Application

You'll need to run both the backend and frontend servers simultaneously in separate terminal windows.

1.  **Start the Backend Server:**
    *   Open a terminal, navigate to the `backend` directory, and ensure your virtual environment is activated.
    *   Run the FastAPI application using Uvicorn:
        ```bash
        uvicorn main:app --reload
        ```
    *   The backend will typically be available at `http://localhost:8000`.

2.  **Start the Frontend Development Server (Next.js):**
    *   Open another terminal and navigate to the `frontend` directory.
    *   Run the Next.js development server:
        ```bash
        npm run dev
        ```
    *   The frontend will typically be available at `http://localhost:3000`.
    *   Open `http://localhost:3000` in your web browser to use the application.

## 📝 Scripts Overview

**Backend (`backend/` directory):**
*   `uvicorn main:app --reload`: Starts the FastAPI backend server with auto-reload enabled for development.

**Frontend (`frontend/` directory - Next.js):**
*   `npm run dev`: Starts the Next.js development server.
*   `npm run build`: Builds the Next.js application for production.
*   `npm run start`: Starts the Next.js production server (after running `npm run build`).
*   `npm run lint`: Lints the frontend codebase (if ESLint is configured).

##  contributing

Details on how to contribute to the project, coding standards, and pull request processes will be added here in the future.

## 📄 License

Specify your project's license here (e.g., MIT, Apache 2.0). If not yet decided, you can state "License TBD".

# Voice Cloning and Face Swap Implementation Guide

## Overview
This project implements voice cloning using ElevenLabs and face swapping using Akool. The application consists of a Next.js frontend and a FastAPI backend.

## Backend Implementation (FastAPI)

### ElevenLabs Integration
1. **Setup**
   ```python
   # Environment Variables Required
   ELEVEN_LABS_API_KEY=your_api_key_here
   ```

2. **API Endpoints**
   ```python
   # Text-to-Speech Generation
   @app.post("/api/generate-elevenlabs-speech")
   async def generate_elevenlabs_speech_endpoint(payload: ElevenLabsSpeechRequest):
       # Generates speech from text using ElevenLabs
       # Returns audio stream

   # Voice Cloning
   @app.post("/api/clone-voice")
   async def clone_voice(audio_file: UploadFile):
       # Clones voice from uploaded audio
       # Returns voice_id
   ```

3. **Usage Flow**
   - Upload audio file for voice cloning
   - Get voice_id from cloning response
   - Use voice_id for text-to-speech generation

### Akool Integration
1. **Setup**
   ```python
   # Environment Variables Required
   AKOOL_API_KEY=your_api_key_here
   AKOOL_CLIENT_ID=your_client_id
   AKOOL_CLIENT_SECRET=your_client_secret
   ```

2. **API Endpoints**
   ```python
   # Face Swap for Images
   @app.post("/api/initiate-faceswap")
   async def initiate_faceswap_endpoint(
       user_image: UploadFile,
       section: str,
       scenario: str,
       gender: str
   ):
       # Initiates face swap process
       # Returns task_id for status polling

   # Face Swap Status Check
   @app.get("/api/faceswap-status/{task_id}")
   async def get_faceswap_status_endpoint(task_id: str):
       # Checks status of face swap process
       # Returns status and result URL if complete

   # Video Streaming Proxy
   @app.get("/api/stream-video")
   async def stream_video(url: str):
       # Proxies video streaming with proper authentication
   ```

3. **Usage Flow**
   - Upload user image
   - Initiate face swap
   - Poll for status
   - Get result URL
   - Display result through proxy

## Frontend Implementation (Next.js)

### ElevenLabs Integration
1. **API Routes**
   ```typescript
   // /api/generate-speech/route.ts
   export async function POST(req: NextRequest) {
     // Forwards speech generation request to backend
     // Returns audio stream
   }
   ```

2. **Usage**
   ```typescript
   // Example component usage
   const generateSpeech = async (text: string, voiceId: string) => {
     const response = await fetch('/api/generate-speech', {
       method: 'POST',
       body: JSON.stringify({ text, voice_id: voiceId })
     });
     // Handle audio response
   };
   ```

### Akool Integration
1. **API Routes**
   ```typescript
   // /api/stream-video/route.ts
   export async function GET(request: Request) {
     // Proxies video requests with proper authentication
   }
   ```

2. **Usage**
   ```typescript
   // Example video component
   <video controls>
     <source 
       src={`/api/stream-video?url=${encodeURIComponent(videoUrl)}`} 
       type="video/mp4" 
     />
   </video>
   ```

## Important Notes

### Authentication
- Both ElevenLabs and Akool require API keys
- Keys should be stored in environment variables
- Never expose API keys in frontend code

### Proxying
- All external requests are proxied through the backend
- This ensures proper authentication and CORS handling
- Use proxy endpoints instead of direct URLs

### Error Handling
- Implement proper error handling for both services
- Handle network errors, authentication failures
- Provide user feedback for failures

### Security
- Validate all inputs
- Sanitize URLs
- Handle authentication properly
- Use HTTPS for all requests

## Environment Setup

### Backend (.env)
```env
ELEVEN_LABS_API_KEY=your_key_here
AKOOL_API_KEY=your_key_here
AKOOL_CLIENT_ID=your_client_id
AKOOL_CLIENT_SECRET=your_client_secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Common Issues and Solutions

1. **CORS Errors**
   - Use proxy endpoints
   - Ensure proper CORS headers

2. **Authentication Failures**
   - Check API keys
   - Verify headers
   - Use proxy endpoints

3. **Video/Image Loading Issues**
   - Use proxy endpoints
   - Check URL encoding
   - Verify authentication

4. **Audio Generation Issues**
   - Check text format
   - Verify voice_id
   - Ensure proper error handling

## Detailed Implementation Guide

### Authorization Headers and Streaming

#### 1. Akool CloudFront Authorization
```python
# Backend (index.py)
headers = {
    "Authorization": f"Bearer {AKOOL_API_KEY}",
    "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
}

# For CloudFront URLs specifically
if 'cloudfront.net' in decoded_url:
    headers["Authorization"] = f"Bearer {AKOOL_API_KEY}"
```

#### 2. Video Streaming Implementation

A. **Backend Proxy** (`/api/stream-video`):
```python
@app.get("/api/stream-video")
async def stream_video(url: str = Query(...)):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            response = await client.get(decoded_url, headers=headers)
            return StreamingResponse(
                response.aiter_bytes(),
                media_type="video/mp4",
                headers={
                    "Content-Type": "video/mp4",
                    "Content-Length": response.headers.get("Content-Length", ""),
                    "Accept-Ranges": "bytes",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

B. **Frontend Implementation**:
```typescript
// In your video component
<video 
  controls
  className="w-full h-full"
  onError={(e) => {
    console.error('Video error:', e);
    // Handle error appropriately
  }}
>
  <source 
    src={`/api/stream-video?url=${encodeURIComponent(videoUrl)}`} 
    type="video/mp4" 
  />
  Your browser does not support the video tag.
</video>
```

#### 3. Common Authorization Issues and Solutions

1. **403 Forbidden Errors**:
   - Ensure AKOOL_API_KEY is properly set in .env
   - Verify the Authorization header format: `Bearer {API_KEY}`
   - Check if the API key has proper permissions

2. **CORS Issues**:
   ```python
   # Backend CORS configuration
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

3. **URL Encoding Issues**:
   ```typescript
   // Always encode URLs properly
   const encodedUrl = encodeURIComponent(videoUrl);
   // Use in source
   src={`/api/stream-video?url=${encodedUrl}`}
   ```

4. **Streaming Headers**:
   ```python
   # Essential headers for streaming
   headers = {
       "Content-Type": "video/mp4",
       "Content-Length": content_length,
       "Accept-Ranges": "bytes",
       "Access-Control-Allow-Origin": "*",
       "Access-Control-Allow-Methods": "GET, OPTIONS",
       "Access-Control-Allow-Headers": "Content-Type, Authorization",
   }
   ```

#### 4. Troubleshooting Steps

1. **Check Network Tab**:
   - Look for 403 errors
   - Verify Authorization header is present
   - Check if URL is properly encoded

2. **Backend Logs**:
   ```python
   print(f"Request headers: {headers}")
   print(f"Response status: {response.status_code}")
   print(f"Response headers: {response.headers}")
   ```

3. **Frontend Console**:
   ```typescript
   // Add error handling
   <video
     onError={(e) => {
       console.error('Video error:', e);
       // Log specific error details
       const videoElement = e.target as HTMLVideoElement;
       console.error('Error code:', videoElement.error?.code);
     }}
   >
   ```

4. **Common Fixes**:
   - Ensure proper URL encoding
   - Verify API key is valid
   - Check CORS configuration
   - Use proxy endpoints instead of direct URLs
   - Implement proper error handling

