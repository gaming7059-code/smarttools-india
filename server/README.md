# SmartTools India — Local Companion Neural TTS Engine 2.0

High-fidelity, zero-API-key neural speech synthesis companion service for SmartTools India.

## Features
- **Authentic Studio-Grade Quality**: Generates 24kHz natural neural audio with human cadence, natural breathing pauses, and expressive prosody.
- **Multilingual Support**:
  - **Bengali (বাংলা)**: Female (`bn-IN-TanishaaNeural`, `bn-BD-NabanitaNeural`) & Male (`bn-IN-BashkarNeural`, `bn-BD-PradeepNeural`).
  - **Hindi (हिंदी)**: Female (`hi-IN-SwaraNeural`) & Male (`hi-IN-MadhurNeural`).
  - **English**: Female (`en-IN-NeerjaNeural`, `en-US-AvaNeural`) & Male (`en-IN-PrabhatNeural`, `en-US-GuyNeural`).
  - **Urdu (اردو)**: Female (`ur-IN-GulNeural`, `ur-PK-UzmaNeural`) & Male (`ur-IN-SalmanNeural`, `ur-PK-AsadNeural`).
- **100% Free & Private**: No API keys, no paid subscriptions, no user signups.
- **Local Security**: Binds strictly to `127.0.0.1:8000` (localhost only).
- **Fast CPU Inference**: Synthesizes standard paragraphs in ~1.2 to 2.0 seconds with <90 MB RAM usage on modest Intel Core i5 CPUs.

## Quick Start on Windows 11
1. Double-click `run_tts.bat` or run:
   ```powershell
   pip install -r requirements.txt
   python tts_server.py
   ```
2. Open SmartTools India (`/tools/text-to-speech`). The web interface automatically detects `http://127.0.0.1:8000` and displays:
   `🟢 Companion Neural Engine Connected`.

## API Endpoints
- `GET /api/health`: Health status & CPU specs.
- `GET /api/voices`: Returns voice catalog for Bengali, Hindi, English, and Urdu.
- `POST /api/synthesize`: Synthesizes speech and streams high-fidelity `audio/mpeg`.
