# Voice Cloning Backend

This is the backend service for the Voice Cloning project, built with Python and FastAPI. It provides the core voice cloning functionality and API endpoints for the frontend application.

## Features

- Voice cloning API endpoints
- Audio file processing
- Model inference and generation
- File management and cleanup
- CORS support for frontend integration

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Getting Started

1. Clone the repository:
```bash
git clone <your-backend-repo-url>
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your environment variables:
```env
MODEL_PATH=path_to_your_model
UPLOAD_FOLDER=temp_uploaded_files
```

5. Run the development server:
```bash
uvicorn api.index:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000)

## API Documentation

Once the server is running, you can access:
- Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative API documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure

```
backend/
├── main.py              # Main application file
├── requirements.txt     # Python dependencies
├── temp_uploaded_files/ # Temporary storage for uploaded files
└── venv/               # Virtual environment (not tracked in git)
```

## API Endpoints

- `POST /clone-voice`: Upload and process audio files for voice cloning
- `GET /health`: Health check endpoint
- Additional endpoints as documented in the API documentation

## Development

### Running Tests
```bash
pytest
```

### Code Style
The project follows PEP 8 style guidelines. You can check your code style using:
```bash
flake8
```

## Deployment

The backend can be deployed to various platforms:

- Docker container
- Cloud platforms (AWS, GCP, Azure)
- Traditional VPS
- Serverless functions

### Docker Deployment
```bash
docker build -t voice-cloning-backend .
docker run -p 8000:8000 voice-cloning-backend
```

## Environment Variables

- `MODEL_PATH`: Path to the voice cloning model
- `UPLOAD_FOLDER`: Directory for temporary file storage
- `MAX_UPLOAD_SIZE`: Maximum file upload size (in bytes)
- `ALLOWED_ORIGINS`: CORS allowed origins

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 