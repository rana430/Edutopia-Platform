from flask import Flask, request, jsonify
from agent import process_query, load_context

app = Flask(__name__)

# Store the loaded context in memory

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
        response = load_context(loaded_context)
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)