from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import traceback
from chatbot import load_context, process_query

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables to store context
context_file = "text.txt"
vectors = None
retrieval_chain = None
memory = None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running"""
    return jsonify({"status": "ok", "message": "Chatbot API is running"})

@app.route('/api/load_context', methods=['POST'])
def api_load_context():
    """Load context from text content provided in the request"""
    global vectors, retrieval_chain, memory
    
    try:
        data = request.json
        if not data or 'context' not in data:
            return jsonify({"status": "error", "message": "Missing context in request body"}), 400
        
        context_content = data.get('context', '')
        user_history = data.get('user_history', '')
        ai_history = data.get('ai_history', '')
        
        # Save context to file
        with open(context_file, "w", encoding="utf-8") as f:
            f.write(context_content)
        
        # Load context using the function from chatbot.py
        vectors, retrieval_chain, memory = load_context(context_file, user_history, ai_history)
        
        return jsonify({
            "status": "success", 
            "message": "Context loaded successfully",
            "chunks": len(vectors.get()) if vectors else 0
        })
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error loading context: {str(e)}\n{error_trace}")
        return jsonify({"status": "error", "message": str(e), "trace": error_trace}), 500

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Process a chat message and return the response"""
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({"status": "error", "message": "Missing message in request body"}), 400
        
        user_message = data.get('message', '')
        
        # Process the query using the function from chatbot.py
        response = process_query(user_message)
        
        # Extract just the final answer part
        if "Final Answer:" in response:
            final_answer = response.split("Final Answer:\n")[1].strip()
        else:
            final_answer = response
        
        return jsonify({
            "status": "success",
            "message": final_answer,
            "full_response": response
        })
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error processing chat: {str(e)}\n{error_trace}")
        return jsonify({"status": "error", "message": str(e), "trace": error_trace}), 500

@app.route('/api/generate_questions', methods=['POST'])
def api_generate_questions():
    """Generate questions based on provided text"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({"status": "error", "message": "Missing text in request body"}), 400
        
        text = data.get('text', '')
        question_type = data.get('type', 'all')  # Default to all types
        
        # Format the query for question generation
        if question_type == 'mcq':
            query = f"generate questions about {text}"
        elif question_type == 'yes_no':
            query = f"generate y/n questions about {text}"
        elif question_type == 'true_false':
            query = f"generate t/f questions about {text}"
        else:
            query = f"generate questions about {text}"
        
        # Process the query using the function from chatbot.py
        response = process_query(query)
        
        # Extract just the final answer part
        if "Final Answer:" in response:
            questions = response.split("Final Answer:\n")[1].strip()
        else:
            questions = response

        print(questions)  
        return jsonify({
            "status": "success",
            "questions": questions
        })
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error generating questions: {str(e)}\n{error_trace}")
        return jsonify({"status": "error", "message": str(e), "trace": error_trace}), 500

@app.route('/api/save_conversation', methods=['POST'])
def api_save_conversation():
    """Save conversation history to database"""
    try:
        data = request.json
        if not data or 'user_messages' not in data or 'ai_messages' not in data:
            return jsonify({"status": "error", "message": "Missing conversation data in request body"}), 400
        
        user_messages = data.get('user_messages', [])
        ai_messages = data.get('ai_messages', [])
        
        # Convert lists to comma-separated strings
        user_str = ",".join(user_messages)
        ai_str = ",".join(ai_messages)
        
        # Reload context with the conversation history
        global vectors, retrieval_chain, memory
        vectors, retrieval_chain, memory = load_context(context_file, user_str, ai_str)
        
        return jsonify({
            "status": "success",
            "message": "Conversation saved successfully"
        })
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error saving conversation: {str(e)}\n{error_trace}")
        return jsonify({"status": "error", "message": str(e), "trace": error_trace}), 500

if __name__ == '__main__':
    # Initialize with empty context
    try:
        vectors, retrieval_chain, memory = load_context(context_file)
        print("Initial context loaded successfully")
    except Exception as e:
        print(f"Error loading initial context: {str(e)}")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)