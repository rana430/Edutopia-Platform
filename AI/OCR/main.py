import os
import sys
from pathlib import Path

# Add the path to the Charts CV Model directory
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent  # Go up one level to AI directory
ocr_path = project_root / 'OCR'
sys.path.append(str(ocr_path))

# Define project paths
PROJECT_ROOT = project_root.parent  # Go up one more level to Edutopia root
MODELS_DIR = project_root / 'AI_GP' / 'models'
OUTPUT_DIR = PROJECT_ROOT / 'uploads' / 'detected_objects'

from pdf2image import convert_from_path
from PIL import Image
import pytesseract
import os
from pathlib import Path
import docx
from pptx import Presentation
import win32com.client
import tempfile
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import logging
from werkzeug.utils import secure_filename
import uuid

# Initialize Flask app
app = Flask(__name__)

# Path to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'F:\GP\Edutopia\AI\OCR\tesseract.exe'

def process_pdf(pdf_path, output_dir=None):
    """Process PDF file and extract text using OCR."""
    try:
        # If no output directory specified, use PDF's directory
        if output_dir is None:
            output_dir = Path(pdf_path).parent / 'ocr_output'
        else:
            output_dir = Path(output_dir)
            
        # Create output directories
        images_dir = output_dir / 'images'
        text_dir = output_dir / 'text'
        
        # Create directories if they don't exist
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(text_dir, exist_ok=True)
        
        # Convert PDF to images
        print(f"Converting PDF to images...")
        images = convert_from_path(pdf_path, dpi=300)
        
        # Get PDF filename without extension
        pdf_name = Path(pdf_path).stem
        
        # Create a combined text file for all pages
        combined_text_path = text_dir / f'{pdf_name}_combined.txt'
        
        with open(combined_text_path, 'w', encoding='utf-8') as combined_file:
            # Loop through images and perform OCR
            for i, image in enumerate(images):
                print(f"Processing page {i + 1}/{len(images)}")
                
                # Save the image
                image_path = images_dir / f'{pdf_name}_page_{i + 1}.jpg'
                image.save(image_path, 'JPEG')
                
                # Perform OCR on the image
                text = pytesseract.image_to_string(image)
                
                # Save individual page text
                page_text_path = text_dir / f'{pdf_name}_page_{i + 1}.txt'
                with open(page_text_path, 'w', encoding='utf-8') as page_file:
                    page_file.write(text)
                
                # Write to combined file
                combined_file.write(f"\n{'='*50}\n")
                combined_file.write(f"Page {i + 1}\n")
                combined_file.write(f"{'='*50}\n\n")
                combined_file.write(text)
                combined_file.write("\n")
        
        print(f"\nProcessing complete!")
        print(f"Images saved in: {images_dir}")
        print(f"Text files saved in: {text_dir}")
        print(f"Combined text file: {combined_text_path}")

        extracted_paths = {
            "images": str(images_dir),
            "text": str(text_dir),
            "combined_text": str(combined_text_path)
        }

        return extracted_paths
        
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")

def process_image(image_path, output_dir=None):
    """Process image file and extract text using OCR."""
    try:
        # If no output directory specified, use image's directory
        if output_dir is None:
            output_dir = Path(image_path).parent / 'ocr_output'
        else:
            output_dir = Path(output_dir)
            
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Get image filename without extension
        image_name = Path(image_path).stem
        
        # Open and process the image
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        
        # Save the extracted text
        text_file_path = output_dir / f'{image_name}_ocr.txt'
        with open(text_file_path, 'w', encoding='utf-8') as text_file:
            text_file.write(text)
        
        print(f"\nProcessing complete!")
        print(f"Text file saved in: {text_file_path}")
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")

def process_docx(docx_path, output_dir=None):
    """Process DOCX file and extract text directly (no OCR)."""
    try:
        # If no output directory specified, use document's directory
        if output_dir is None:
            output_dir = Path(docx_path).parent / 'ocr_output'
        else:
            output_dir = Path(output_dir)
            
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Get document filename without extension
        doc_name = Path(docx_path).stem
        
        # Open and process the document
        doc = docx.Document(docx_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        # Save the extracted text
        text_file_path = output_dir / f'{doc_name}_ocr.txt'
        with open(text_file_path, 'w', encoding='utf-8') as text_file:
            text_file.write(text)
        
        print(f"\nProcessing complete!")
        print(f"Text file saved in: {text_file_path}")
        
    except Exception as e:
        print(f"Error processing DOCX: {str(e)}")

def convert_pptx_to_images(pptx_path):
    """Convert PowerPoint slides to images using PowerPoint COM automation."""
    try:
        # Create temporary directory for images
        temp_dir = tempfile.mkdtemp()
        
        # Initialize PowerPoint
        powerpoint = win32com.client.Dispatch("PowerPoint.Application")
        powerpoint.Visible = True
        
        # Open the presentation
        presentation = powerpoint.Presentations.Open(pptx_path)
        
        # Save each slide as an image
        image_paths = []
        for i in range(1, presentation.Slides.Count + 1):
            image_path = os.path.join(temp_dir, f"slide_{i}.png")
            presentation.Slides(i).Export(image_path, "PNG")
            image_paths.append(image_path)
        
        # Close PowerPoint
        presentation.Close()
        powerpoint.Quit()
        
        return image_paths
    except Exception as e:
        print(f"Error converting PowerPoint to images: {str(e)}")
        return []

def process_pptx(pptx_path, output_dir=None):
    """Process PPTX file and extract text using OCR."""
    try:
        # If no output directory specified, use presentation's directory
        if output_dir is None:
            output_dir = Path(pptx_path).parent / 'ocr_output'
        else:
            output_dir = Path(output_dir)
            
        # Create output directories
        images_dir = output_dir / 'images'
        text_dir = output_dir / 'text'
        
        # Create directories if they don't exist
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(text_dir, exist_ok=True)
        
        # Get presentation filename without extension
        pptx_name = Path(pptx_path).stem
        
        print("Converting PowerPoint to images...")
        image_paths = convert_pptx_to_images(pptx_path)
        
        if not image_paths:
            print("Failed to convert PowerPoint to images")
            return
        
        # Create a combined text file for all slides
        combined_text_path = text_dir / f'{pptx_name}_combined.txt'
        
        with open(combined_text_path, 'w', encoding='utf-8') as combined_file:
            for i, image_path in enumerate(image_paths, 1):
                print(f"Processing slide {i}/{len(image_paths)}")
                
                # Save the slide image
                slide_image_path = images_dir / f'{pptx_name}_slide_{i}.png'
                os.rename(image_path, slide_image_path)
                
                # Open and process the image
                image = Image.open(slide_image_path)
                text = pytesseract.image_to_string(image)
                
                # Save individual slide text
                slide_text_path = text_dir / f'{pptx_name}_slide_{i}.txt'
                with open(slide_text_path, 'w', encoding='utf-8') as slide_file:
                    slide_file.write(text)
                
                # Write to combined file
                combined_file.write(f"\n{'='*50}\n")
                combined_file.write(f"Slide {i}\n")
                combined_file.write(f"{'='*50}\n\n")
                combined_file.write(text)
                combined_file.write("\n")
        
        # Clean up the temporary directory
        try:
            os.rmdir(os.path.dirname(image_paths[0]))
        except:
            pass
        
        print(f"\nProcessing complete!")
        print(f"Images saved in: {images_dir}")
        print(f"Text files saved in: {text_dir}")
        print(f"Combined text file: {combined_text_path}")
        
    except Exception as e:
        print(f"Error processing PPTX: {str(e)}")

def process_file(file_path, output_dir=None):
    """Process any supported file type."""
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"Error: File '{file_path}' does not exist")
        return
    
    file_ext = file_path.suffix.lower()
    
    if file_ext == '.pdf':
        process_pdf(str(file_path), output_dir)
    elif file_ext in ['.png', '.jpg', '.jpeg']:
        process_image(str(file_path), output_dir)
    elif file_ext == '.docx':
        process_docx(str(file_path), output_dir)
    elif file_ext == '.pptx':
        process_pptx(str(file_path), output_dir)
    else:
        print(f"Unsupported file type: {file_ext}")



# Define upload and output folders
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "extracted_diagrams"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {"pdf", "pptx"}

def allowed_file(filename):
    """Check if the uploaded file has a valid extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route("/process_file", methods=["POST"])
def process_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Save uploaded file temporarily
    temp_path = Path("temp") / file.filename
    os.makedirs(temp_path.parent, exist_ok=True)
    file.save(temp_path)

    # Process the file
    extracted_paths = process_pdf(temp_path)  # Calls your function

    if not extracted_paths or "combined_text" not in extracted_paths:
        return jsonify({"error": "Failed to process file"}), 500

    # Read the combined text content
    try:
        with open(extracted_paths["combined_text"], "r", encoding="utf-8") as text_file:
            extracted_text = text_file.read()
    except Exception as e:
        return jsonify({"error": f"Failed to read extracted text: {str(e)}"}), 500

    # Return only the extracted text
    return jsonify({
        "success": True,
        "message": "Text extracted successfully",
        "extracted_text": extracted_text
    })

if __name__ == "__main__":
    app.run(debug=True, port=5003)
