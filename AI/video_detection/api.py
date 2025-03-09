from flask import Flask, request, jsonify
import cv2
import os
import sys
from ultralytics import YOLO
import imagehash
from PIL import Image
import uuid
from urllib.request import urlretrieve
import logging
import tempfile
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

try:
    # Get the directory containing this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Construct path to model
    model_path = os.path.join(current_dir, "models", "colab_pretrained_aug.pt")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    # Load the YOLO model
    logger.info(f"Loading model from {model_path}")
    model = YOLO(model_path)
    logger.info("Model loaded successfully")

except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    sys.exit(1)

def process_video(video_path, output_folder):
    """Process video and detect objects using YOLO."""
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_folder, exist_ok=True)

        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Failed to open video file")

        fps = int(cap.get(cv2.CAP_PROP_FPS))
        frame_interval = fps * 10  # Extract frame every 10 seconds

        # Initialize parameters
        frame_count = 0
        object_count = 0
        confidence_threshold = 0
        min_size_threshold = 0
        min_resolution_threshold = 200
        margin = 40
        hash_threshold = 9
        saved_hashes = {}
        detected_objects = []

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
                                    pil_image = Image.fromarray(cv2.cvtColor(cropped_object, cv2.COLOR_BGR2RGB))
                                    image_hash = imagehash.phash(pil_image)

                                    if class_name not in saved_hashes:
                                        saved_hashes[class_name] = set()

                                    is_similar = False
                                    for saved_hash in saved_hashes[class_name]:
                                        if image_hash - saved_hash < hash_threshold:
                                            is_similar = True
                                            break

                                    if is_similar:
                                        continue

                                    object_count += 1
                                    resolution = f"{width_with_margin}x{height_with_margin}"
                                    filename = f"{class_name}_{conf:.2f}_{resolution}.jpg"
                                    save_path = os.path.join(output_folder, filename)
                                    
                                    cv2.imwrite(save_path, cropped_object)
                                    saved_hashes[class_name].add(image_hash)

                                    detected_objects.append({
                                        'class_name': class_name,
                                        'confidence': float(conf),
                                        'resolution': resolution,
                                        'file_path': filename
                                    })

            frame_count += 1

        cap.release()
        logger.info(f"Processed {frame_count} frames, detected {object_count} objects")
        return detected_objects, object_count

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        raise

@app.route('/detect_objects', methods=['POST'])
def detect_objects():
    """API endpoint to detect objects in a video."""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        if 'video_url' not in request.json:
            return jsonify({'error': 'No video URL provided'}), 400

        video_url = request.json['video_url']
        
        # Create temporary directories
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, f"video_{uuid.uuid4()}.mp4")
        output_folder = os.path.join(temp_dir, "detected_objects")

        try:
            # Download video
            logger.info(f"Downloading video from {video_url}")
            urlretrieve(video_url, video_path)

            # Process video
            logger.info("Processing video with YOLO")
            detected_objects, object_count = process_video(video_path, output_folder)

            # Prepare response
            response = {
                'success': True,
                'message': f'Successfully processed video and detected {object_count} objects',
                'detected_objects': detected_objects,
                'object_count': object_count
            }

            return jsonify(response), 200

        finally:
            # Clean up temporary files
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

    except Exception as e:
        logger.error(f"Error in detect_objects: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Video Detection API on port 5002")
    app.run(debug=True, port=5002) 