from flask import Flask, jsonify
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Cho phép CORS cho tất cả các route

@app.route('/api/data')
def get_data():
    return jsonify({'message': 'Data from Flask back-end!', 'users': ['User1', 'User2', 'User3']})

if __name__ == '__main__':
    # Chạy trên cổng 5000 (mặc định của Flask)
    app.run(debug=True, port=5000)