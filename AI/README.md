# Edutopia AI Services

This directory contains the AI services used by Edutopia for video processing and analysis.

## Services

1. **Video Object Detection** (`video_detection/`)
   - Detects objects in videos using YOLO
   - Extracts and saves unique objects
   - Provides confidence scores and object metadata

2. **Transcript Analysis** (`transcript_analysis/`)
   - Downloads video transcripts from YouTube
   - Analyzes content using RAG (Retrieval Augmented Generation)
   - Provides comprehensive analysis and relevant sections

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
```

3. Place the YOLO model in `video_detection/models/colab_pretrained_aug.pt`

## Running the Services

1. Start the Transcript Analysis API:
```bash
cd transcript_analysis
python api.py
```
The service will run on `http://localhost:5001`

2. Start the Video Detection API:
```bash
cd video_detection
python api.py
```
The service will run on `http://localhost:5002`

## API Endpoints

### Transcript Analysis API

**POST** `/process_video`
```json
{
    "video_url": "https://www.youtube.com/watch?v=example"
}
```

### Video Detection API

**POST** `/detect_objects`
```json
{
    "video_url": "https://example.com/video.mp4"
}
```

## Directory Structure

```
AI/
├── requirements.txt
├── README.md
├── transcript_analysis/
│   ├── api.py
│   └── __init__.py
└── video_detection/
    ├── api.py
    ├── models/
    │   └── colab_pretrained_aug.pt
    └── __init__.py
``` 

To buid
// move to folder 
- cd AI
- python -m venv venv
>>
>> # Activate it
>> .\venv\Scripts\activate


// to run the digram extraction
pip install -r requirements.txt
pip install ultralytics
pip install flask python-dotenv opencv-python ultralytics yt-dlp moviepy torch torchvision
cd video_detection    
python api.py

// to run summerization 
cd transcript_analysis 
python api.py
