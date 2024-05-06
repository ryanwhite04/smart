from flask import Flask, request, jsonify
import argparse
app = Flask(__name__)

@app.route('/post', methods=['POST'])
def handle_post():
    data = request.get_json()  # Assuming JSON data is sent with POST
    print(data)  # Print the JSON data received
    return jsonify({"response": "Data received"}), 200

if __name__ == '__main__':
    # Set up argument parsing
    parser = argparse.ArgumentParser(description='Start the Flask API server.')
    parser.add_argument('--port', type=int, default=5000, help='Port number for the server.')

    # Parse arguments
    args = parser.parse_args()

    # Run the server with the specified port
    app.run(debug=True, port=args.port)
    
@app.after_request
def after_request(response): response.headers.add('Access-Control-Allow-Origin', '*'); return response
