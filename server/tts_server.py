"""
SmartTools India - Local Companion Neural TTS Engine 2.0
=========================================================
High-fidelity, API-key-free neural speech synthesis server.
Binds strictly to 127.0.0.1:8000 for private local operation.

Supported Languages:
- Bengali (bn-IN, bn-BD)
- Hindi (hi-IN)
- English (en-IN, en-US)
- Urdu (ur-IN, ur-PK)
"""

import os
import sys
import time
import io
import asyncio
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import edge_tts

app = FastAPI(
    title="SmartTools India Neural TTS Engine",
    version="2.0.0",
    description="Local high-fidelity neural speech synthesis companion service."
)

# Allow CORS for local development and GitHub Pages production site
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "https://gaming7059-code.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICE_CATALOG = [
    # Bengali (bn)
    {
        "id": "bn-IN-TanishaaNeural",
        "name": "Tanishaa (Natural Female)",
        "displayName": "Tanishaa • Bengali (India)",
        "lang": "bn-IN",
        "locale": "bn-IN",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "আজকের দিনটা খুব সুন্দর। আমি তোমার সঙ্গে কথা বলতে পেরে আনন্দিত।",
        "sampleRate": 24000
    },
    {
        "id": "bn-IN-BashkarNeural",
        "name": "Bashkar (Natural Male)",
        "displayName": "Bashkar • Bengali (India)",
        "lang": "bn-IN",
        "locale": "bn-IN",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "নমস্কার! স্মার্ট টুলস ইন্ডিয়াতে আপনাকে স্বাগতম।",
        "sampleRate": 24000
    },
    {
        "id": "bn-BD-NabanitaNeural",
        "name": "Nabanita (Natural Female)",
        "displayName": "Nabanita • Bengali (Bangladesh)",
        "lang": "bn-BD",
        "locale": "bn-BD",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "কেমন আছেন? আজকের আবহাওয়া বেশ চমৎকার।",
        "sampleRate": 24000
    },
    {
        "id": "bn-BD-PradeepNeural",
        "name": "Pradeep (Natural Male)",
        "displayName": "Pradeep • Bengali (Bangladesh)",
        "lang": "bn-BD",
        "locale": "bn-BD",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "আজকের দিনটা অত্যন্ত সুন্দর ও আনন্দময়।",
        "sampleRate": 24000
    },

    # Hindi (hi)
    {
        "id": "hi-IN-SwaraNeural",
        "name": "Swara (Natural Female)",
        "displayName": "Swara • Hindi (India)",
        "lang": "hi-IN",
        "locale": "hi-IN",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "आज का दिन बहुत सुंदर है। मुझे आपसे बात करके खुशी हुई।",
        "sampleRate": 24000
    },
    {
        "id": "hi-IN-MadhurNeural",
        "name": "Madhur (Natural Male)",
        "displayName": "Madhur • Hindi (India)",
        "lang": "hi-IN",
        "locale": "hi-IN",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "नमस्ते! स्मार्ट टूल्स इंडिया में आपका हार्दिक स्वागत है।",
        "sampleRate": 24000
    },

    # English (en)
    {
        "id": "en-IN-NeerjaNeural",
        "name": "Neerja (Natural Female)",
        "displayName": "Neerja • English (India)",
        "lang": "en-IN",
        "locale": "en-IN",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "Welcome to SmartTools India. Experience high quality natural neural speech.",
        "sampleRate": 24000
    },
    {
        "id": "en-IN-PrabhatNeural",
        "name": "Prabhat (Natural Male)",
        "displayName": "Prabhat • English (India)",
        "lang": "en-IN",
        "locale": "en-IN",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "Hello! I am Prabhat, bringing clear and natural voice narration.",
        "sampleRate": 24000
    },
    {
        "id": "en-US-AvaNeural",
        "name": "Ava (Expressive Female)",
        "displayName": "Ava • English (US)",
        "lang": "en-US",
        "locale": "en-US",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "Hello! Welcome to SmartTools India. I hope you are having a wonderful day.",
        "sampleRate": 24000
    },
    {
        "id": "en-US-GuyNeural",
        "name": "Guy (Natural Male)",
        "displayName": "Guy • English (US)",
        "lang": "en-US",
        "locale": "en-US",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "Hi there! This is Guy, presenting clean studio audio synthesis.",
        "sampleRate": 24000
    },

    # Urdu (ur)
    {
        "id": "ur-IN-GulNeural",
        "name": "Gul (Natural Female)",
        "displayName": "Gul • Urdu (India)",
        "lang": "ur-IN",
        "locale": "ur-IN",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "آج کا دن بہت خوبصورت ہے۔ آپ سے بات کرکے مجھے خوشی ہوئی۔",
        "sampleRate": 24000
    },
    {
        "id": "ur-IN-SalmanNeural",
        "name": "Salman (Natural Male)",
        "displayName": "Salman • Urdu (India)",
        "lang": "ur-IN",
        "locale": "ur-IN",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "السلام علیکم! اسمارٹ ٹولز انڈیا میں آپ کا خیر مقدم ہے۔",
        "sampleRate": 24000
    },
    {
        "id": "ur-PK-UzmaNeural",
        "name": "Uzma (Natural Female)",
        "displayName": "Uzma • Urdu (Pakistan)",
        "lang": "ur-PK",
        "locale": "ur-PK",
        "gender": "Female",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "امید ہے آپ خیریت سے ہوں گے۔ یہ ایک نیورل آواز کا نمونہ ہے۔",
        "sampleRate": 24000
    },
    {
        "id": "ur-PK-AsadNeural",
        "name": "Asad (Natural Male)",
        "displayName": "Asad • Urdu (Pakistan)",
        "lang": "ur-PK",
        "locale": "ur-PK",
        "gender": "Male",
        "tier": "neural-hq",
        "tierLabel": "24kHz Neural",
        "previewText": "خوش آمدید! آواز کی کوالٹی قدرتی اور صاف ہے۔",
        "sampleRate": 24000
    }
]

class SynthesisRequest(BaseModel):
    text: str = Field(..., max_length=5000, description="Input text to speak")
    voice: str = Field("hi-IN-SwaraNeural", description="Voice ID")
    rate: float = Field(1.0, ge=0.5, le=2.0, description="Speech rate multiplier")
    pitch: float = Field(1.0, ge=0.5, le=1.5, description="Speech pitch multiplier")
    volume: float = Field(1.0, ge=0.0, le=1.0, description="Volume multiplier")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "engine": "SmartTools Neural Engine 2.0 (FastAPI)",
        "version": "2.0.0",
        "voices_count": len(VOICE_CATALOG),
        "supported_languages": ["bn", "hi", "en", "ur"],
        "hardware": {
            "os": sys.platform,
            "cpu_cores": os.cpu_count() or 4
        }
    }

@app.get("/api/voices")
async def get_voices(lang: Optional[str] = Query(None)):
    if not lang or lang == "all":
        return VOICE_CATALOG
    lang_lower = lang.lower()
    return [
        v for v in VOICE_CATALOG
        if v["lang"].lower().startswith(lang_lower) or v["locale"].lower().startswith(lang_lower)
    ]

@app.post("/api/synthesize")
async def synthesize_speech(req: SynthesisRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Match voice
    voice_id = req.voice
    matched = next((v for v in VOICE_CATALOG if v["id"] == voice_id), None)
    if not matched:
        # Fallback to Swara or Ava
        voice_id = "hi-IN-SwaraNeural" if any(ord(c) > 127 for c in text) else "en-US-AvaNeural"

    # Convert rate to edge-tts format: e.g. "+10%" or "-15%"
    rate_percent = int((req.rate - 1.0) * 100)
    rate_str = f"{rate_percent:+d}%"

    # Convert pitch to edge-tts format: e.g. "+5Hz" or "-5Hz"
    pitch_hz = int((req.pitch - 1.0) * 50)
    pitch_str = f"{pitch_hz:+d}Hz"

    # Convert volume to edge-tts format: e.g. "+0%" or "-20%"
    vol_percent = int((req.volume - 1.0) * 100)
    vol_str = f"{vol_percent:+d}%"

    start_time = time.perf_counter()
    try:
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice_id,
            rate=rate_str,
            pitch=pitch_str,
            volume=vol_str
        )
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])

        audio_bytes = audio_stream.getvalue()
        elapsed = round(time.perf_counter() - start_time, 3)

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-Synthesis-Time-Sec": str(elapsed),
                "X-Audio-Bytes": str(len(audio_bytes)),
                "X-Voice-Used": voice_id,
                "Content-Disposition": f'attachment; filename="smarttools-neural-{voice_id}.mp3"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Bind strictly to localhost / 127.0.0.1 for maximum security
    print("Starting SmartTools Neural TTS Engine 2.0 on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
