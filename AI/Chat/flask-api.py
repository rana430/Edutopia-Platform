from flask import Flask, request, jsonify
from agent import process_query, load_context
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/context', methods=['POST'])
def handle_load_context():
    """Handle loading context"""
    try:
        data = request.get_json()
        
        if not data or 'context' not in data:
            return jsonify({
                "error": "Missing required field",
                "message": "Please provide 'context' in the request body"
            }), 400
            
        

        loaded_context = data['context']
        user_str = data['user_str']
        ai_str = data['ai_str'] 
        response = load_context(loaded_context,user_str, ai_str)
        return jsonify({
            "message": "Context loaded successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/query', methods=['POST'])
def handle_query():
    """Handle incoming queries"""
    try:
   
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                "error": "Missing required field",
                "message": "Please provide 'query' in the request body"
            }), 400
            
        query = data['query']
        
        # Process the query using the agent with loaded context
        response = process_query(query)
        
        return jsonify({
            "response": response
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    }), 200

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)