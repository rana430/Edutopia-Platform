from flask import Flask, request, jsonify
import os
import time
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import Chroma  
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
import logging

load_dotenv()

import os
from dotenv import load_dotenv

load_dotenv()


groq_api_key = os.environ['GROQ_API_KEY']

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask
app = Flask(__name__)

# Initialize Embeddings & LLM
embeddings = HuggingFaceEmbeddings()
llm = ChatGroq(groq_api_key=groq_api_key, model_name="llama-3.2-90b-vision-preview", temperature=0)

# Prompt for summarization
summary_prompt = ChatPromptTemplate.from_template(
    """
    Summarize the following document concisely while preserving key details:
    <document>
    {context}
    <document>
    """
)

# Initialize Vector Storage
vectors = None  # Will be initialized when processing text

from urllib.parse import urlparse, parse_qs

def get_youtube_video_id(url):
    """Extract video ID from various YouTube URL formats."""
    try:
        parsed_url = urlparse(url)
        
        # Handle shortened URLs (e.g., https://youtu.be/VIDEO_ID)
        if "youtu.be" in parsed_url.netloc:
            return parsed_url.path[1:]
        
        # Handle standard YouTube URLs (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
        if "youtube.com" in parsed_url.netloc:
            query_params = parse_qs(parsed_url.query)
            return query_params.get("v", [None])[0]
    
    except Exception as e:
        logger.error(f"Error parsing URL: {str(e)}")
        return None
    
    return None


def get_youtube_transcript(video_id):
    """Get transcript for a YouTube video."""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return ' '.join([entry['text'] for entry in transcript_list])
    except Exception as e:
        logger.error(f"Error getting transcript: {str(e)}")
        return None

def process_text(text):
    """
    Splits the text into chunks, stores embeddings in ChromaDB, and creates a retrieval chain.
    """
    global vectors
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    final_documents = text_splitter.create_documents([text])

    # Initialize ChromaDB
    vectors = Chroma.from_documents(final_documents, embeddings)

    # Create retrieval chain
    retriever = vectors.as_retriever()
    document_chain = create_stuff_documents_chain(llm, summary_prompt)
    return create_retrieval_chain(retriever, document_chain)

@app.route('/summarize/video', methods=['POST'])
def summarize():
    start = time.process_time()
    
    try:
        data = request.get_json()
        video_url = data.get("video_url")

        if not video_url:
            return jsonify({"error": "Missing video_url parameter"}), 400
        
        # ✅ Extract the video ID
        video_id = get_youtube_video_id(video_url)
        if not video_id:
            return jsonify({"error": "Invalid YouTube URL"}), 400

        # ✅ Fetch video transcript using only the extracted video ID
        transcript = get_youtube_transcript(video_id)
        if transcript is None:
            return jsonify({"error": "Could not retrieve transcript"}), 500
        
        # ✅ Process transcript into vector storage
        retrieval_chain = process_text(transcript)
        
        # ✅ Generate Summary
        response = retrieval_chain.invoke({"input": transcript})
        elapsed_time = time.process_time() - start
        
        logger.info(f"Summary: {response['answer']}")
        return jsonify({
            'summary': response['answer'],
            'response_time': elapsed_time
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/summarize/text', methods=['POST'])
def summarize_text():
    start = time.process_time()
    
    try:
        data = request.get_json()
        text = data.get("text")

        if not text:
            return jsonify({"error": "Missing text parameter"}), 400

        # ✅ Process transcript into vector storage
        retrieval_chain = process_text(text)
        
        # ✅ Generate Summary
        response = retrieval_chain.invoke({"input": text})
        elapsed_time = time.process_time() - start
        
        logger.info(f"Summary: {response['answer']}")
        return jsonify({
            'summary': response['answer'],
            'response_time': elapsed_time
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
