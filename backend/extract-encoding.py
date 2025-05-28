from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify, make_response
import face_recognition
import numpy as np
import base64
import cv2
import json
import os

from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # restrict to your frontend origin


DB_PATH = "db.json"

def load_known_faces():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "r") as f:
            return json.load(f)
    return []   

def decode_base64_image(image_data):
    img_bytes = base64.b64decode(image_data.split(",")[1])
    img_array = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(img_array, cv2.IMREAD_COLOR)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Flask is working!"})

@app.route("/extract-encoding", methods=["POST"])
def extract_encoding():
    data = request.get_json()
    image_data = data.get("image")
    if not image_data:
        return make_response(jsonify({"error": "No image provided"}), 400)

    print("📥 Received image data")
    img = decode_base64_image(image_data)
    face_locations = face_recognition.face_locations(img)

    if not face_locations:
        print("❌ No face found")
        return make_response(jsonify({"error": "No face found"}), 400)

    encodings = face_recognition.face_encodings(img, face_locations)
    if not encodings:
        print("❌ Encoding failed")
        return make_response(jsonify({"error": "Encoding failed"}), 400)

    print("✅ Encoding extracted successfully")
    response = jsonify({"encoding": encodings[0].tolist()})
    response.headers["Content-Type"] = "application/json"
    return response

@app.route("/match-face", methods=["POST"])
def match_face():
    data = request.get_json()
    image_data = data.get("image")
    known_faces = load_known_faces()

    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    img = decode_base64_image(image_data)
    face_locations = face_recognition.face_locations(img)

    if not face_locations:
        return jsonify({"error": "No face found"})

    input_encoding = face_recognition.face_encodings(img, face_locations)[0]

    for face in known_faces:
        known_encoding = np.array(face["encoding"])
        match = face_recognition.compare_faces([known_encoding], input_encoding, tolerance=0.5)[0]

        if match:
            return jsonify({
                "match": {
                    "name": face["name"],
                    "timestamp": face["timestamp"]
                }
            })

    return jsonify({"match": None})

@app.route("/live-match", methods=["POST"])
def live_match():
    try:
        req_data = request.get_json()
        print("Request received")

        img_data = req_data["image"].split(",")[1]
        img_bytes = base64.b64decode(img_data)
        img = Image.open(BytesIO(img_bytes))
        img_np = np.array(img)

        print("Image converted to NumPy")

        if img_np.shape[-1] == 4:
            img_np = img_np[:, :, :3]

        face_locations = face_recognition.face_locations(img_np)
        face_encodings = face_recognition.face_encodings(img_np, face_locations)

        print(f"Detected {len(face_encodings)} face(s)")

        
        known_faces = load_known_faces()
        known_face_encodings = [np.array(face["encoding"]) for face in known_faces]
        known_face_names = [face["name"] for face in known_faces]

        matches = []

        for encoding, box in zip(face_encodings, face_locations):
            results = face_recognition.compare_faces(known_face_encodings, encoding)
            distances = face_recognition.face_distance(known_face_encodings, encoding)
            best_idx = np.argmin(distances)

            if results[best_idx]:
                name = known_face_names[best_idx]
            else:
                name = "Unknown"

            matches.append({
                "name": name,
                "box": list(box)
            })

        return jsonify({"matches": matches})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=8000)
