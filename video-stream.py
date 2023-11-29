from flask import Flask, Response
import cv2
import threading

app = Flask(__name__)

# Using a video file to simulate the camera. Loop the video indefinitely.
def camera_stream():
    video_path = 'file_example_MP4_640_3MG.mp4'  # Replace with your video file path
    while True:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("Error: Could not open video file.")
            break
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break  # Go to the outer loop to restart the video
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        cap.release()

@app.route('/video_feed')
def video_feed():
    return Response(camera_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(threaded=True, port=3000)
