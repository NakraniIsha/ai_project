from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import base64

app = Flask(__name__)
CORS(app)

# ------------------------------------------------------------------
# Face cascade (loaded once at startup)
# ------------------------------------------------------------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Standard size every enrolled face is resized to
FACE_SIZE = (200, 200)

# Confidence threshold for LBPH (lower = better match).
# Anything above this is treated as "Unknown".
CONFIDENCE_THRESHOLD = 80

# ------------------------------------------------------------------
# Cached recognizer – retrained only when faces folder changes
# ------------------------------------------------------------------
_recognizer = None
_label_reverse_map = {}
_faces_snapshot = None  # used to detect changes


def _get_faces_snapshot():
    """Return a hashable snapshot of the faces folder structure."""
    snapshot = []
    faces_dir = "faces"
    if not os.path.isdir(faces_dir):
        return tuple()
    for person in sorted(os.listdir(faces_dir)):
        person_dir = os.path.join(faces_dir, person)
        if not os.path.isdir(person_dir):
            continue
        files = sorted(os.listdir(person_dir))
        snapshot.append((person, tuple(files)))
    return tuple(snapshot)


def train_model(force=False):
    """Train (or re-use cached) LBPH recognizer."""
    global _recognizer, _label_reverse_map, _faces_snapshot

    current_snapshot = _get_faces_snapshot()

    if not force and _recognizer is not None and current_snapshot == _faces_snapshot:
        return _recognizer, _label_reverse_map

    recognizer = cv2.face.LBPHFaceRecognizer_create(
        radius=1, neighbors=8, grid_x=8, grid_y=8
    )
    faces = []
    labels = []
    label_map = {}
    current_label = 0

    for person_usn in os.listdir("faces"):
        person_folder = os.path.join("faces", person_usn)
        if not os.path.isdir(person_folder):
            continue

        if person_usn not in label_map:
            label_map[person_usn] = current_label
            current_label += 1

        for img_file in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_file)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                print(f"[WARN] Could not read image: {img_path}")
                continue

            # Resize to standard size for consistent training
            img = cv2.resize(img, FACE_SIZE)

            # Apply histogram equalization for better contrast
            img = cv2.equalizeHist(img)

            faces.append(img)
            labels.append(label_map[person_usn])

    if len(faces) == 0:
        raise ValueError("No face images found for training.")

    print(f"[INFO] Training with {len(faces)} face images across {len(label_map)} people")
    recognizer.train(faces, np.array(labels))

    _recognizer = recognizer
    _label_reverse_map = {v: k for k, v in label_map.items()}
    _faces_snapshot = current_snapshot

    return _recognizer, _label_reverse_map


# ------------------------------------------------------------------
# Enroll endpoint – detects face, crops & resizes, then saves
# ------------------------------------------------------------------
@app.route("/enroll", methods=["POST"])
def enroll():
    data = request.get_json()
    usn = data.get("usn")
    image_raw = data.get("image")

    if not usn or not image_raw:
        return jsonify({"message": "USN or image data is missing"}), 400

    try:
        image_data = image_raw.split(",")[1]
    except IndexError:
        image_data = image_raw

    image_bytes = base64.b64decode(image_data)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_color = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_color is None:
        return jsonify({"message": "Could not decode image"}), 400

    gray = cv2.cvtColor(img_color, cv2.COLOR_BGR2GRAY)

    # Apply histogram equalization for better face detection
    gray = cv2.equalizeHist(gray)

    # Detect faces with more lenient parameters for enrollment
    detected = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(80, 80)
    )

    if len(detected) == 0:
        return jsonify({"message": "No face detected. Please position your face clearly in front of the camera."}), 400

    # Save each detected face (cropped & resized)
    student_folder = os.path.join("faces", usn)
    os.makedirs(student_folder, exist_ok=True)

    existing = len(os.listdir(student_folder))
    saved_count = 0

    for (x, y, w, h) in detected:
        # Add some padding around the face for better recognition
        pad_x = int(w * 0.15)
        pad_y = int(h * 0.15)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(gray.shape[1], x + w + pad_x)
        y2 = min(gray.shape[0], y + h + pad_y)

        face_crop = gray[y1:y2, x1:x2]
        face_resized = cv2.resize(face_crop, FACE_SIZE)

        filename = f"{usn}_{existing + saved_count + 1}.jpg"
        filepath = os.path.join(student_folder, filename)
        cv2.imwrite(filepath, face_resized)
        print(f"[INFO] Saved face: {filepath}")
        saved_count += 1

    # Force retrain on next recognition
    global _faces_snapshot
    _faces_snapshot = None

    return jsonify({"message": f"Student {usn} enrolled successfully! ({saved_count} face(s) saved)"}), 200


# ------------------------------------------------------------------
# Recognize endpoint
# ------------------------------------------------------------------
@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.get_json()
    image_raw = data.get("image")

    if not image_raw:
        return jsonify({"usn": "No image provided"}), 400

    try:
        image_data = image_raw.split(",")[1]
    except IndexError:
        image_data = image_raw

    image_bytes = base64.b64decode(image_data)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"usn": "Could not decode image"}), 400

    try:
        recognizer, label_reverse_map = train_model()
    except ValueError as e:
        return jsonify({"usn": "No enrolled faces found. Please enroll first."}), 400

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Apply histogram equalization (same as training)
    gray = cv2.equalizeHist(gray)

    # Detect faces
    detected = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(80, 80)
    )

    if len(detected) == 0:
        return jsonify({"usn": "No face detected"})

    # Process the largest detected face (most likely the main subject)
    detected = sorted(detected, key=lambda f: f[2] * f[3], reverse=True)

    for (x, y, w, h) in detected:
        # Add padding (same as enrollment)
        pad_x = int(w * 0.15)
        pad_y = int(h * 0.15)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(gray.shape[1], x + w + pad_x)
        y2 = min(gray.shape[0], y + h + pad_y)

        face_crop = gray[y1:y2, x1:x2]
        face_resized = cv2.resize(face_crop, FACE_SIZE)

        label, confidence = recognizer.predict(face_resized)
        usn = label_reverse_map.get(label, "Unknown")

        print(f"[INFO] Predicted: {usn}, Confidence: {confidence:.2f}")

        # LBPH confidence: lower = better. Check threshold.
        if confidence > CONFIDENCE_THRESHOLD:
            return jsonify({
                "usn": "Unknown",
                "confidence": int(confidence),
                "message": "Face detected but not recognized"
            })

        return jsonify({
            "usn": usn,
            "confidence": int(confidence)
        })

    return jsonify({"usn": "No face detected"})


if __name__ == "__main__":
    # Pre-train model at startup if faces exist
    try:
        train_model()
        print("[INFO] Model pre-trained at startup")
    except ValueError:
        print("[INFO] No faces found for pre-training, will train on first enrollment")

    app.run(port=5000, debug=False)
