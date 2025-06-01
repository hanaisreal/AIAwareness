import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json(); // Expected: { text?: string, name?: string, age?: string, voice_id?: string }

  // Determine the Python backend URL
  // For local development, this might be http://localhost:8000
  // For Vercel deployment, this would be your deployed backend URL
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000'; 
  const speechApiUrl = `${pythonBackendUrl}/api/generate-elevenlabs-speech`;

  console.log(`Forwarding speech generation request to Python backend: ${speechApiUrl}`);
  console.log(`Request body: ${JSON.stringify(body)}`);

  try {
    const backendResponse = await fetch(speechApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body), // Forward the same body
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Error from Python backend (${backendResponse.status}):`, errorText);
      return new NextResponse(`Error from speech generation service: ${errorText}`, { status: backendResponse.status });
    }

    // Stream the audio from Python backend to the client
    const audioBuffer = await backendResponse.arrayBuffer();
    return new NextResponse(Buffer.from(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    });

  } catch (error: any) {
    console.error('Error calling Python backend for speech generation:', error);
    return new NextResponse('Failed to connect to speech generation service. Is the Python backend running?', { status: 503 });
  }
}