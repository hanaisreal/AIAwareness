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

