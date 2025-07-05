import os
import sys
from pathlib import Path
import json
import logging
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

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize resources
os.environ["HF_HOME"] = os.path.expanduser("~/.cache/huggingface")

# Load the Groq API key
try:
    groq_api_key = os.environ['GROQ_API_KEY']
except KeyError:
    logger.error("GROQ_API_KEY environment variable not set")
    sys.exit(1)

# Flask app initialization
app = Flask(__name__)

# Initialize resources with error handling
try:
    embeddings = HuggingFaceEmbeddings()
    # Updated to use the recommended model
    llm = ChatGroq(groq_api_key=groq_api_key, model_name="llama-3.3-70b-versatile", temperature=0)
except Exception as e:
    logger.error(f"Failed to initialize resources: {str(e)}")
    sys.exit(1)

def get_youtube_video_id(url):
    """Extract video ID from YouTube URL."""
    try:
        parsed_url = urlparse(url)
        if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
            return parsed_url.path[1:]
        if parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
            query_params = parse_qs(parsed_url.query)
            return query_params.get('v', [None])[0]
    except Exception as e:
        logger.error(f"Error parsing URL: {str(e)}")
        return None
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
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        documents = text_splitter.create_documents([transcript])

        # Create vector store
        vectors = Chroma.from_documents(documents, embeddings)

        # Create prompt template for comprehensive analysis
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

        # Get similar chunks for context
        docs_with_scores = vectors.similarity_search_with_score(
            "What are the main points and key concepts discussed in this video?",
            k=5
        )

        # Get the analysis
        response = retrieval_chain.invoke({
            "input": "Please provide a detailed analysis of the video content."
        })

        return {
            'analysis': response['answer'],
            'relevant_sections': [
                {
                    'content': doc.page_content,
                    'relevance_score': float(score)
                } for doc, score in docs_with_scores
            ]
        }

    except Exception as e:
        logger.error(f"Error in RAG processing: {str(e)}")
        return None

@app.route('/process_video', methods=['POST'])
def process_video():
    """
    API endpoint to process video content.
    Expects a JSON payload with the 'video_url' field.
    """
    try:
        logger.info("Received video processing request")
        data = request.json
        if not data:
            logger.error("No JSON data received")
            return jsonify({'error': 'No JSON data received'}), 400
            
        if 'video_url' not in data:
            logger.error("Missing video_url field in request")
            return jsonify({'error': 'Invalid request, "video_url" field is required'}), 400

        video_url = data['video_url']
        logger.info(f"Processing video URL: {video_url}")
        
        # Get YouTube video ID
        video_id = get_youtube_video_id(video_url)
        if not video_id:
            logger.error(f"Invalid YouTube URL: {video_url}")
            return jsonify({'error': 'Invalid YouTube URL'}), 400

        logger.info(f"Extracted video ID: {video_id}")

        # Get video transcript
        transcript = get_video_transcript(video_id)
        if not transcript:
            logger.error(f"Could not retrieve transcript for video ID: {video_id}")
            return jsonify({'error': 'Could not retrieve video transcript'}), 400
        logger.info("Successfully retrieved video transcript")

        # Process with RAG
        rag_result = process_transcript_with_rag(transcript)
        if not rag_result:
            logger.error("RAG processing failed")
            return jsonify({'error': 'Could not analyze transcript'}), 500
        logger.info("Successfully processed transcript with RAG")
        
        # Format the response
        result = {
            'success': True,
            'analysis': rag_result['analysis']
        }

        logger.info("Successfully completed video processing")
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Unexpected error processing request: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001, use_reloader=False)