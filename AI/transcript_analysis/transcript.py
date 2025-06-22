import os
import sys
import json
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from langchain_groq import ChatGroq
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize resources
os.environ["HF_HOME"] = os.path.expanduser("~/.cache/huggingface")
embeddings = HuggingFaceEmbeddings()
llm = ChatGroq(
    groq_api_key=os.getenv('GROQ_API_KEY'),
    model_name="llama-3.3-70b-versatile",
    temperature=0
)

def get_youtube_video_id(url):
    """Extract video ID from YouTube URL."""
    try:
        parsed_url = urlparse(url)
        if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
            return parsed_url.path[1:]
        if parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
            query_params = parse_qs(parsed_url.query)
            return query_params.get('v', [None])[0]
        return None
    except Exception as e:
        logger.error(f"Error parsing URL: {str(e)}")
        return None

def get_video_transcript(video_id):
    """Get transcript for a YouTube video."""
    try:
        # First try with default language
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            return ' '.join([entry['text'] for entry in transcript_list])
        except Exception as e:
            logger.info(f"Trying to get transcript with language list: {str(e)}")
            
        # If default fails, try with available languages
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to get English transcript first
        try:
            english_transcript = transcript_list.find_transcript(['en'])
            transcript_data = english_transcript.fetch()
            return ' '.join([entry['text'] for entry in transcript_data])
        except Exception:
            logger.info("English transcript not found, trying other available languages")
        
        # If English not available, get the first available transcript
        available_transcript = next(iter(transcript_list))
        transcript_data = available_transcript.fetch()
        return ' '.join([entry['text'] for entry in transcript_data])
            
    except Exception as e:
        logger.error(f"Error getting transcript: {str(e)}")
        return None

def process_transcript_with_rag(transcript):
    """Process the transcript using RAG."""
    try:
        # Split the transcript into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        documents = text_splitter.create_documents([transcript])

        # Create vector store
        vectors = Chroma.from_documents(documents, embeddings)

        prompt = ChatPromptTemplate.from_template(
            """
            Based on the video transcript provided in the context, please provide a comprehensive analysis including:
            1. Main Topics:
               - List and explain the key subjects covered
               - Identify the primary themes and concepts
            
            2. Key Points and Takeaways:
               - Summarize the most important information
               - Highlight crucial insights and findings
            
            3. Technical Details:
               - List any specific techniques, methods, or tools mentioned
               - Explain any step-by-step processes described
            
            4. Practical Applications:
               - Identify real-world applications discussed
               - Note any examples or case studies mentioned
            
            Please structure your response clearly and provide specific examples from the transcript where relevant.

            <context>
            {context}
            </context>

            Question: {input}
            """
        )

        # Create and execute chains
        document_chain = create_stuff_documents_chain(llm, prompt)
        retriever = vectors.as_retriever()
        retrieval_chain = create_retrieval_chain(retriever, document_chain)

        response = retrieval_chain.invoke({
            "input": "Please analyze this video content"
        })

        return {
            'analysis': response['answer'],
            'relevant_sections': [
                {'content': doc.page_content} 
                for doc in vectors.similarity_search("summary", k=3)
            ]
        }

    except Exception as e:
        logger.error(f"RAG processing error: {str(e)}")
        return None

@app.route('/process_video', methods=['POST'])
def process_video():
    """API endpoint to process video content."""
    # Check if request has JSON data
    if not request.is_json:
        return jsonify({
            'error': 'Invalid content type',
            'message': 'Content-Type must be application/json',
            'example': {'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
        }), 400

    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({
            'error': 'Invalid JSON',
            'message': str(e),
            'example': {'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
        }), 400

    # Validate required fields
    if not data or 'video_url' not in data:
        return jsonify({
            'error': 'Missing field',
            'message': 'video_url is required',
            'example': {'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
        }), 400

    video_url = data['video_url']
    
    try:
        video_id = get_youtube_video_id(video_url)
        if not video_id:
            return jsonify({
                'error': 'Invalid URL',
                'message': 'Could not extract video ID',
                'example': {'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
            }), 400

        transcript = get_video_transcript(video_id)
        if not transcript:
            return jsonify({
                'error': 'No transcript',
                'message': 'Could not retrieve transcript',
                'video_id': video_id
            }), 400

        result = process_transcript_with_rag(transcript)
        if not result:
            return jsonify({
                'error': 'Analysis failed',
                'message': 'Could not process transcript',
                'video_id': video_id
            }), 500

        return jsonify({
            'success': True,
            'video_id': video_id,
            'analysis': result['analysis'],
            'sections': result['relevant_sections']
        }), 200

    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)