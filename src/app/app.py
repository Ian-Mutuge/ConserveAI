from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import tensorflow as tf
import librosa
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize YOLO model
video_model = YOLO('best.torchscript', task='detect')  # Replace with your YOLO model path


current_results = []  # Global variable to store YOLO results
class_labels = ['gunshot', 'scream', 'background_noise']  # Replace with your audio class labels


# Helper function to extract features for audio classification
def extract_features(audio_path, sr=22050, n_mfcc=40):
    try:
        audio, sample_rate = librosa.load(audio_path, sr=sr)
        mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=n_mfcc)
        mfccs_scaled = np.mean(mfccs.T, axis=0)  # Take the mean along the time axis
        return np.expand_dims(mfccs_scaled, axis=0)  # Add batch dimension for prediction
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None


# Video stream generator
def generate_frames():
    global current_results
    video_source = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    cap = cv2.VideoCapture(video_source)
    
    if not cap.isOpened():
        print(f"Error: Unable to open video source: {video_source}")
        return

    frame_counter = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                print("End of stream or error reading frame.")
                break

            frame_counter += 1
            if frame_counter % 19 != 0:  # Skip frames for performance
                continue

            # Run YOLO inference
            results = video_model(frame)

            # Extract detection metadata (labels, confidence, boxes)
            detection_results = []
            for box in results[0].boxes:
                detection_results.append({
                    'label': box.cls,  # Replace 'cls' with the actual class label mapping if needed
                    'confidence': float(box.conf),  # Convert to float for JSON serialization
                    'bbox': box.xyxy.tolist()  # Bounding box coordinates
                })
             # Update the global results variable
            current_results = detection_results

            # Annotate the frame
            annotated_frame = results[0].plot()

            # Convert the annotated frame to byte stream for video feed
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame = buffer.tobytes()

            # Yield the frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    except Exception as e:
        print(f"Error during video stream processing: {e}")
    finally:
        cap.release()


# API for video stream
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detection_results', methods=['GET'])
def get_detection_results():
    global current_results
    print("Request received at /detection_results")
    print(f"Current results: {current_results}")
    return jsonify(current_results or [])



if __name__ == '__main__':
    app.run(debug=True, threaded=True)
