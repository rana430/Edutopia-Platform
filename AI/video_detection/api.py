import os
import sys
from pathlib import Path

# Add the path to the Charts CV Model directory
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent  # Go up one level to AI directory
charts_cv_path = project_root / 'AI_GP' / 'Charts CV Model'
sys.path.append(str(charts_cv_path))

# Define project paths
PROJECT_ROOT = project_root.parent  # Go up one more level to Edutopia root
MODELS_DIR = project_root / 'AI_GP' / 'models'
OUTPUT_DIR = PROJECT_ROOT.parent / 'Frontend' / 'Edutopia-frontend' / 'public' / 'images' / 'uploads' / 'detected_objects'

# Print the path for debugging
print(f"Added to sys.path: {charts_cv_path}")
print(f"Current sys.path: {sys.path}")

from flask import Flask, request, jsonify
from dotenv import load_dotenv
import logging
import cv2
import numpy as np
from ultralytics import YOLO
import tempfile
import requests
import uuid
import torch
from ultralytics.nn.tasks import DetectionModel
from torch.nn import Sequential, Module, Conv2d, BatchNorm2d, SiLU, ModuleList, Upsample, MaxPool2d
from ultralytics.nn.modules import C2f, SPPF, Detect, Conv
import yt_dlp
import shutil
from classification import infer_and_save
import threading
from queue import Queue

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app initialization
app = Flask(__name__)

# Add all necessary PyTorch classes to safe globals for PyTorch 2.6
torch.serialization.add_safe_globals([
    DetectionModel,
    Sequential,
    Module,
    Conv2d,
    BatchNorm2d,
    SiLU,
    ModuleList,
    Upsample,
    MaxPool2d,
    C2f,
    SPPF,
    Detect,
    Conv
])

# Initialize YOLO model
try:
    model = YOLO(str(MODELS_DIR / 'YOLOv8 fine-tuned model for object detection.pt'))
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Error loading YOLO model: {str(e)}")
    model = None

# Store processing status and results
processing_status = {}
processing_results = {}

def download_video(video_url):
    """Download video from URL using yt-dlp."""
    try:
        # Create a temporary directory for the video
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, "video.mp4")
        
        # Configure yt-dlp options
        opts = {
            'format': 'best',
            'outtmpl': video_path,
            'noplaylist': True,
            'postprocessors': [{'key': 'FFmpegVideoConvertor', 'preferedformat': 'mp4'}]
        }
        
        # Download the video
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([video_url])
        
        return video_path, temp_dir
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return None, None

def process_video(video_path, output_folder):
    """Process video to extract diagrams using YOLO."""
    try:
        # Create output folder if it doesn't exist
        os.makedirs(output_folder, exist_ok=True)
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error("Error: Could not open video file")
            return 0
            
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration = total_frames / fps
        logger.info(f"Video duration: {video_duration:.2f} seconds, FPS: {fps}, Total frames: {total_frames}")
        
        # Calculate frame interval (every 10 seconds)
        frame_interval = fps * 10
        logger.info(f"Processing every {frame_interval} frames (every 10 seconds)")
        
        frame_count = 0
        object_count = 0
        confidence_threshold = 0.5
        min_size_threshold = 5000
        min_resolution_threshold = 200
        margin = 40
        hash_threshold = 9
        
        # Store hashes of saved images grouped by class
        saved_hashes = {}
        
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
                
            # Resize frame
            height, width = frame.shape[:2]
            new_width = 640
            new_height = int((new_width / width) * height)
            frame = cv2.resize(frame, (new_width, new_height))
            
            if frame_count % frame_interval == 0:
                logger.info(f"Processing frame {frame_count}/{total_frames} ({(frame_count/total_frames)*100:.1f}%)")
                results = model(frame)
                
                for result in results:
                    for box, conf, cls in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                        conf = float(conf)
                        class_id = int(cls)
                        class_name = model.names[class_id]
                        
                        if class_name.lower() == "legend":
                            continue
                            
                        if conf >= confidence_threshold:
                            x1, y1, x2, y2 = map(int, box)
                            width = x2 - x1
                            height = y2 - y1
                            
                            if width < min_resolution_threshold and height < min_resolution_threshold:
                                continue
                                
                            # Add margin
                            x1 = max(0, x1 - margin)
                            y1 = max(0, y1 - margin)
                            x2 = min(frame.shape[1], x2 + margin)
                            y2 = min(frame.shape[0], y2 + margin)
                            
                            width_with_margin = x2 - x1
                            height_with_margin = y2 - y1
                            area_with_margin = width_with_margin * height_with_margin
                            
                            if area_with_margin >= min_size_threshold:
                                cropped_object = frame[y1:y2, x1:x2]
                                
                                if cropped_object.size > 0:
                                    # Save the image
                                    object_count += 1
                                    resolution = f"{width_with_margin}x{height_with_margin}"
                                    save_path = os.path.join(output_folder, f"{class_name}_{conf:.2f}_{resolution}.jpg")
                                    cv2.imwrite(save_path, cropped_object)
                                    logger.info(f"Saved object {object_count} to {save_path}")
            
            frame_count += 1
            
            # Break if we've processed all frames
            if frame_count >= total_frames:
                break
        
        cap.release()
        cv2.destroyAllWindows()
        logger.info(f"Video processing completed. Total frames processed: {frame_count}, Objects detected: {object_count}")
        return object_count
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return 0

def process_video_background(video_url, session_id):
    """Background task to process video and detect objects."""
    with app.app_context():  # Create application context for the background thread
        try:
            # Download video
            video_path, download_dir = download_video(video_url)
            if not video_path:
                processing_status[session_id] = {'status': 'error', 'message': 'Failed to download video'}
                return

            # Process video to extract objects
            output_folder = os.path.join(OUTPUT_DIR, session_id)
            logger.info(f"Detected objects will be saved to: {output_folder}")
            
            object_count = process_video(video_path, output_folder)
            
            if object_count == 0:
                processing_status[session_id] = {'status': 'error', 'message': 'No objects detected in video'}
                return
                
            # Classify detected objects
            classified_folder = os.path.join(OUTPUT_DIR, session_id, "classified")
            logger.info(f"Classified diagrams will be saved to: {classified_folder}")
            
            infer_and_save(output_folder, classified_folder, str(MODELS_DIR / "efficientnet_b3 fine-tuned model for image classification.pth"))
            
            # Get list of classified objects
            classified_objects = []
            for filename in os.listdir(classified_folder):
                if filename.endswith(('.jpg', '.jpeg', '.png')):
                    classified_objects.append({
                        'filename': filename,
                        'path': os.path.join(classified_folder, filename)
                    })
                    logger.info(f"Classified object: {filename}")
            
            # Store results
            processing_results[session_id] = {
                'success': True,
                'message': f'Successfully processed video and detected {object_count} objects',
                'detected_objects': classified_objects,
                'object_count': object_count,
                'output_path': classified_folder
            }
            processing_status[session_id] = {'status': 'completed'}
            
            # Clean up temporary files
            shutil.rmtree(download_dir)

            return jsonify(processing_results[session_id])
            
        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            processing_status[session_id] = {'status': 'error', 'message': str(e)}

@app.route('/process_video', methods=['POST'])
def process_video_endpoint():
    """API endpoint to start video processing."""
    try:
        data = request.json
        if not data or 'video_url' not in data:
            return jsonify({'error': 'Missing video_url in request'}), 400
            
        video_url = data['video_url']
        session_id = data.get('session_id')  # Get the session_id from the request
        if not session_id:
            return jsonify({'error': 'Missing session_id in request'}), 400
            
        logger.info(f"Processing video URL: {video_url} with session ID: {session_id}")
        
        # Initialize status
        processing_status[session_id] = {'status': 'processing'}
        
        # Start background processing
        thread = threading.Thread(
            target=process_video_background,
            args=(video_url, session_id)
        )
        thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Video processing started',
            'session_id': session_id
        })
        
    except Exception as e:
        logger.error(f"Error starting video processing: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_results/<session_id>', methods=['GET'])
def get_results(session_id):
    """API endpoint to get processing results."""
    try:
        if session_id not in processing_status:
            return jsonify({'error': 'Invalid session ID'}), 404
            
        status = processing_status[session_id]
        logger.info(f"Processing status: {status}")
        
        if status['status'] == 'processing':
            return jsonify({
                'status': 'processing',
                'message': 'Video is still being processed'
            })
            
        elif status['status'] == 'error':
            return jsonify({
                'status': 'error',
                'message': status['message']
            })
            
        elif status['status'] == 'completed':
            logger.info(f"Processing results: {processing_results[session_id]}")
            return jsonify(processing_results[session_id])
            
        else:
            return jsonify({'error': 'Unknown status'}), 500
            
    except Exception as e:
        logger.error(f"Error getting results: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)